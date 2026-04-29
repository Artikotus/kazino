import json
import os
import random
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error, request
from urllib.parse import urlsplit, urlunsplit


ROOT_DIR = Path(__file__).resolve().parent
CATBOT_DIR = ROOT_DIR.parent / "catbot"
PROMPT_FILES = [
    ROOT_DIR / "rules.kotobot.txt",
    ROOT_DIR / "AI.kotobot.rules.txt",
    CATBOT_DIR / "AI.kotobot.rules.txt",
    CATBOT_DIR / "rules.kotobot.txt",
]
ENV_FILES = [
    ROOT_DIR / ".env",
    CATBOT_DIR / ".env",
]
DEFAULT_ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4"
DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"
FALLBACK_REPLIES = [
    "норм",
    "ок",
    "ага",
    "го",
    "крч да",
    "пон",
    "жесть",
    "забей",
    "имба",
    "красава",
    "кринж",
    "рил",
    "база",
    "нормусь",
    "топ",
    "жиза",
    "сочувствую",
    "ого",
    "ваще жесть",
    "лол",
    "ор",
    "ахах",
    "ясн",
    "бывает",
    "интересно",
    "мм ок",
    "да норм все",
    "как вообще?",
    "чего нового?",
    "серьезно?",
    "круто",
    "дичь",
]


def load_env_file() -> None:
    for env_file in ENV_FILES:
        if not env_file.exists():
            continue

        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('\"').strip("'")
            if key and not os.environ.get(key, "").strip():
                os.environ[key] = value


load_env_file()
PORT = int(os.getenv("PORT", "8000"))


def getenv_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def get_prompt_file() -> Path | None:
    for prompt_file in PROMPT_FILES:
        if prompt_file.exists():
            return prompt_file
    return None


def load_prompt() -> str:
    prompt_file = get_prompt_file()
    if prompt_file is None:
        return ""
    return prompt_file.read_text(encoding="utf-8").strip()


def resolve_api_settings() -> dict[str, str]:
    openrouter_key = getenv_first("OPENROUTER_API_KEY")
    zai_key = getenv_first("ZAI_API_KEY")
    preferred_provider = getenv_first("AI_PROVIDER", "KOTOBOT_PROVIDER").lower()

    if preferred_provider in {"zai", "z.ai"} and zai_key:
        return {
            "provider": "z.ai",
            "credential_name": "ZAI_API_KEY",
            "api_key": zai_key,
            "base_url": getenv_first("ZAI_BASE_URL", default=DEFAULT_ZAI_BASE_URL),
            "model": getenv_first("ZAI_MODEL", default="glm-4.7"),
        }

    if preferred_provider == "openrouter" and openrouter_key:
        return {
            "provider": "openrouter",
            "credential_name": "OPENROUTER_API_KEY",
            "api_key": openrouter_key,
            "base_url": getenv_first("OPENROUTER_BASE_URL", default=DEFAULT_OPENROUTER_BASE_URL),
            "model": getenv_first("OPENROUTER_MODEL", default=DEFAULT_OPENROUTER_MODEL),
        }

    if openrouter_key:
        return {
            "provider": "openrouter",
            "credential_name": "OPENROUTER_API_KEY",
            "api_key": openrouter_key,
            "base_url": getenv_first("OPENROUTER_BASE_URL", default=DEFAULT_OPENROUTER_BASE_URL),
            "model": getenv_first("OPENROUTER_MODEL", default=DEFAULT_OPENROUTER_MODEL),
        }

    return {
        "provider": "z.ai",
        "credential_name": "ZAI_API_KEY",
        "api_key": zai_key,
        "base_url": getenv_first("ZAI_BASE_URL", default=DEFAULT_ZAI_BASE_URL),
        "model": getenv_first("ZAI_MODEL", default="glm-4.7"),
    }


def build_chat_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    parsed = urlsplit(normalized)
    path = parsed.path.rstrip("/")

    if path.endswith("/chat/completions"):
        return normalized

    if not path:
        path = "/v1/chat/completions"
    else:
        path = f"{path}/chat/completions"

    return urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))


def json_response(handler: SimpleHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def build_fallback_result(messages: list[dict[str, str]], settings: dict[str, str], reason: str) -> dict:
    last_user_message = ""
    for item in reversed(messages):
        if item.get("role") == "user":
            last_user_message = item.get("content", "").strip().lower()
            break

    if "привет" in last_user_message or "ку" in last_user_message or "хай" in last_user_message:
        reply = "привет"
    elif "как дела" in last_user_message or "как ты" in last_user_message:
        reply = "да норм все"
    elif "?" in last_user_message:
        reply = random.choice(["хз честно", "серьезно?", "интересно", "мм ок"])
    else:
        reply = random.choice(FALLBACK_REPLIES)

    return {
        "reply": reply,
        "model": settings["model"],
        "provider": settings["provider"],
        "fallback": True,
        "warning": reason,
    }


def call_model(messages: list[dict[str, str]]) -> dict:
    settings = resolve_api_settings()
    api_key = settings["api_key"]
    base_url = settings["base_url"]
    model = settings["model"]

    if not model:
        raise ValueError("Missing model in API config.")
    if not api_key:
        raise ValueError(f"Missing API key: use {settings['credential_name']}.")

    prompt = load_prompt()
    payload = {
        "model": model,
        "temperature": 0.9,
        "frequency_penalty": 0.5,
        "presence_penalty": 0.2,
        "max_tokens": 80,
        "messages": ([{"role": "system", "content": prompt}] if prompt else []) + messages,
    }

    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        build_chat_url(base_url),
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with request.urlopen(req, timeout=45) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API error {exc.code}: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Failed to reach API: {exc.reason}") from exc

    try:
        message = response_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected API response: {response_data}") from exc

    if not isinstance(message, str) or not message.strip():
        raise RuntimeError("API returned an empty reply.")

    return {"reply": message.strip(), "model": model, "provider": settings["provider"]}


class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def guess_type(self, path):
        content_type = super().guess_type(path)
        text_extensions = {".html", ".css", ".js", ".json", ".txt", ".svg", ".manifest"}
        if Path(path).suffix.lower() in text_extensions and "charset=" not in content_type:
            return f"{content_type}; charset=utf-8"
        return content_type

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/kotobot/config":
            settings = resolve_api_settings()
            json_response(
                self,
                HTTPStatus.OK,
                {
                    "provider": settings["provider"],
                    "credential_name": settings["credential_name"],
                    "has_api_key": bool(settings["api_key"]),
                    "base_url": settings["base_url"],
                    "model": settings["model"],
                    "prompt_file": (get_prompt_file().name if get_prompt_file() else ""),
                },
            )
            return

        if self.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/kotobot/chat":
            json_response(self, HTTPStatus.NOT_FOUND, {"error": "Route not found."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            body = json.loads(raw_body.decode("utf-8"))
            messages = body.get("messages", [])
        except (ValueError, json.JSONDecodeError):
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON."})
            return

        if not isinstance(messages, list) or not messages:
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "messages array is required."})
            return

        cleaned_messages = []
        for item in messages[-12:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content", "")
            if role not in {"user", "assistant"} or not isinstance(content, str) or not content.strip():
                continue
            cleaned_messages.append({"role": role, "content": content.strip()})

        if not cleaned_messages:
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Chat history is empty or invalid."})
            return

        settings = resolve_api_settings()

        try:
            result = call_model(cleaned_messages)
        except ValueError as exc:
            result = build_fallback_result(cleaned_messages, settings, str(exc))
        except RuntimeError as exc:
            result = build_fallback_result(cleaned_messages, settings, str(exc))
        except Exception as exc:
            result = build_fallback_result(cleaned_messages, settings, f"Server error: {exc}")

        json_response(self, HTTPStatus.OK, result)

    def log_message(self, format, *args):
        return


def open_browser():
    time.sleep(1)
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", PORT), MyHTTPRequestHandler) as httpd:
        prompt_file = get_prompt_file()
        print(f"Server started at http://127.0.0.1:{PORT}")
        print(f"Prompt file: {prompt_file if prompt_file else 'not found'}")
        print("Opening Artikotus in the browser...")

        threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
