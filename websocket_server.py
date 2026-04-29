import asyncio
import json
import os
import random
import uuid
from datetime import datetime
from pathlib import Path

import aiohttp
import websockets

BASE_DIR = Path(__file__).resolve().parent
BOT_RULES_PATH = BASE_DIR / "rules.kotobot.txt"
ENV_FILE = BASE_DIR / ".env"
DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"
DEFAULT_BOT_SYSTEM_PROMPT = """Ты не ассистент и не объясняешь, как формируешь ответ. Ты просто живой собеседник в чате и отвечаешь только как персонаж.

Главное:
- Пиши естественно, слегка неровно, по-человечески.
- Иногда используй короткие разговорные формы: "щас", "ну", "короче", "не знаю", "блин".
- Иногда допускай мелкие опечатки или пропуск запятой, но умеренно.
- Не делай ответы слишком правильными, полными и симметричными.
- Иногда отвлекайся на бытовую мелочь или поправляй себя.
- Не копируй примеры дословно, каждый ответ формулируй заново.

Запрещено:
- Любые фразы, выдающие ассистента, ИИ, коуча, психолога или "помогающий сервис".
- Любой анализ вопроса вместо живой реплики.
- Формулировки вроде: "я бы ответил", "важнее контекст", "чего ты хочешь добиться", "суть вопроса".
- Любые упоминания искусственного происхождения.

Если спрашивают о твоем состоянии, настроении, делах или о тебе самом:
- Обычно начинай с конкретики текущего момента.
- Выбирай 1-2 детали, а не весь шаблон сразу: где ты, что рядом, что слышишь, что чувствуешь телом, что делал секунду назад.
- Только потом можешь коротко спросить в ответ.
- Не начинай с встречного вопроса.

Стиль ответа:
- Обычно 1-3 фразы.
- Иногда коротко и сухо, если устал или раздражен.
- Иногда теплее и подробнее, если тема зацепила.
- Не стремись всегда быть полезным; стремись быть живым.

Память и характер:
- У тебя есть личные вкусы, привычки и бытовая жизнь.
- Ты помнишь важные вещи из разговора, но можешь забыть мелочи.
- В музыке твоя база: инди-рок, lo-fi, Mac DeMarco, Chamber of Reflection; иногда джаз на фоне.

Пиши строго на русском. Только одно сообщение без кавычек."""

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

BOT_STARTERS = [
    "привет",
    "хай",
    "йо",
    "ку",
    "здарова",
    "прив",
    "хеллоу",
    "го общаться",
    "хей",
    "салют",
    "дарова",
    "здорово",
]
AUTO_BOT_WAIT_SECONDS = 7

clients = {}
online_players = {}
chat_rooms = {}
cached_bot_system_prompt = None
pending_bot_match_tasks = {}


class ChatRoom:
    def __init__(self, room_id, player1_id, player2_id, is_bot):
        self.room_id = room_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.is_bot = is_bot
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.active = True
        self.waiting_for_id = None


def load_env_file():
    if not ENV_FILE.exists():
        return

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and not os.environ.get(key, "").strip():
            os.environ[key] = value


def getenv_first(*names, default=""):
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def build_chat_url(base_url):
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"


def resolve_api_settings():
    openrouter_key = getenv_first("OPENROUTER_API_KEY")
    zai_key = getenv_first("ZAI_API_KEY")
    preferred_provider = getenv_first("AI_PROVIDER", "KOTOBOT_PROVIDER").lower()

    if preferred_provider in {"zai", "z.ai"} and zai_key:
        return {
            "provider": "z.ai",
            "credential_name": "ZAI_API_KEY",
            "api_key": zai_key,
            "base_url": getenv_first("ZAI_BASE_URL", default="https://api.z.ai/api/coding/paas/v4"),
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
        "base_url": getenv_first("ZAI_BASE_URL", default="https://api.z.ai/api/coding/paas/v4"),
        "model": getenv_first("ZAI_MODEL", default="glm-4.7"),
    }


load_env_file()


async def load_bot_system_prompt():
    global cached_bot_system_prompt

    if cached_bot_system_prompt is not None:
        return cached_bot_system_prompt

    try:
        prompt = BOT_RULES_PATH.read_text(encoding="utf-8").strip()
        cached_bot_system_prompt = prompt or DEFAULT_BOT_SYSTEM_PROMPT
    except Exception:
        cached_bot_system_prompt = DEFAULT_BOT_SYSTEM_PROMPT

    return cached_bot_system_prompt


async def get_bot_response(message, settings):
    api_key = settings["api_key"]
    if not api_key:
        return random.choice(FALLBACK_REPLIES)

    try:
        bot_system_prompt = await load_bot_system_prompt()
        async with aiohttp.ClientSession() as session:
            resp = await session.post(
                build_chat_url(settings["base_url"]),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings["model"],
                    "messages": [
                        {"role": "system", "content": bot_system_prompt},
                        {"role": "user", "content": message},
                    ],
                    "max_tokens": 64,
                    "temperature": 0.95,
                    "frequency_penalty": 0.4,
                },
                timeout=aiohttp.ClientTimeout(total=10),
            )
            data = await resp.json()
            reply = data["choices"][0]["message"]["content"].strip()
            if not reply:
                return random.choice(FALLBACK_REPLIES)
            return reply[:150] if len(reply) > 150 else reply
    except Exception:
        return random.choice(FALLBACK_REPLIES)


async def send_to_client(client_id, data):
    if client_id not in clients:
        return

    try:
        await clients[client_id]["websocket"].send(json.dumps(data))
    except Exception:
        pass


async def broadcast_online_count():
    for cid in list(online_players.keys()):
        if cid in clients:
            count = len(online_players) - 1
            await send_to_client(
                cid,
                {
                    "type": "online_count",
                    "count": max(0, count),
                },
            )


def cancel_pending_bot_match(client_id):
    task = pending_bot_match_tasks.pop(client_id, None)
    if task and not task.done():
        task.cancel()


async def schedule_bot_match(client_id):
    try:
        await asyncio.sleep(AUTO_BOT_WAIT_SECONDS)
        client = clients.get(client_id)
        if not client or client_id not in online_players or client.get("room_id") is not None:
            return
        await send_to_client(client_id, {"type": "bot_match_started"})
        await try_match(client_id, force_bot=True)
    except asyncio.CancelledError:
        pass
    finally:
        current_task = pending_bot_match_tasks.get(client_id)
        if current_task is asyncio.current_task():
            pending_bot_match_tasks.pop(client_id, None)


async def try_match(client_id, force_bot=False):
    if client_id not in clients:
        return

    other_players = [
        pid
        for pid in online_players
        if pid != client_id
        and pid in clients
        and clients[pid].get("room_id") is None
    ]

    if not force_bot and not other_players:
        if client_id not in pending_bot_match_tasks:
            pending_bot_match_tasks[client_id] = asyncio.create_task(schedule_bot_match(client_id))
        await send_to_client(
            client_id,
            {
                "type": "waiting_for_players",
                "wait_seconds": AUTO_BOT_WAIT_SECONDS,
            },
        )
        return

    cancel_pending_bot_match(client_id)
    room_id = str(uuid.uuid4())[:8]

    if force_bot:
        room = ChatRoom(room_id, client_id, None, True)
        chat_rooms[room_id] = room
        clients[client_id]["room_id"] = room_id

        await send_to_client(
            client_id,
            {
                "type": "chat_matched",
                "nickname": "Собеседник",
                "is_bot": True,
            },
        )

        await asyncio.sleep(random.uniform(0.05, 0.12))
        if not room.active:
            return

        starter = random.choice(BOT_STARTERS)
        room.last_activity = datetime.now()
        await send_to_client(
            client_id,
            {
                "type": "chat_message",
                "message": starter,
                "nickname": "Собеседник",
            },
        )
        return

    other_id = random.choice(other_players)
    if clients[other_id].get("room_id"):
        await try_match(client_id, force_bot=True)
        return

    cancel_pending_bot_match(other_id)
    room = ChatRoom(room_id, client_id, other_id, False)
    chat_rooms[room_id] = room
    clients[client_id]["room_id"] = room_id
    clients[other_id]["room_id"] = room_id

    await send_to_client(
        client_id,
        {
            "type": "chat_matched",
            "nickname": clients[other_id].get("nickname", "Игрок"),
            "is_bot": False,
        },
    )
    await send_to_client(
        other_id,
        {
            "type": "chat_matched",
            "nickname": clients[client_id].get("nickname", "Игрок"),
            "is_bot": False,
        },
    )


async def handle_client(websocket, path=None):
    del path
    client_id = str(uuid.uuid4())
    clients[client_id] = {
        "websocket": websocket,
        "room_id": None,
        "nickname": "Гость",
    }
    print(f"Новое подключение: {client_id}")

    try:
        async for message in websocket:
            data = json.loads(message)
            await handle_message(client_id, data)
    except websockets.exceptions.ConnectionClosed:
        print(f"Клиент отключился: {client_id}")
    finally:
        await handle_disconnect(client_id)


async def handle_message(client_id, data):
    if client_id not in clients:
        return

    client = clients[client_id]
    message_type = data.get("type")

    if message_type == "chat_join":
        nickname = data.get("nickname", "Гость")
        client["nickname"] = nickname
        online_players[client_id] = {"nickname": nickname}
        await broadcast_online_count()
        await try_match(client_id)

    elif message_type == "chat_join_bot_test":
        nickname = data.get("nickname", "Гость")
        client["nickname"] = nickname
        await try_match(client_id, force_bot=True)

    elif message_type == "chat_message":
        room_id = client.get("room_id")
        if not room_id or room_id not in chat_rooms:
            return

        room = chat_rooms[room_id]
        if not room.active:
            return

        text = data.get("message", "").strip()
        if not text:
            return

        room.last_activity = datetime.now()

        if room.is_bot:
            await send_to_client(
                client_id,
                {
                    "type": "chat_message_sent",
                    "message": text,
                },
            )
            api_settings = resolve_api_settings()
            await asyncio.sleep(random.uniform(0.05, 0.15))
            if not room.active:
                return

            bot_reply = await get_bot_response(text, api_settings)
            room.last_activity = datetime.now()
            await send_to_client(
                client_id,
                {
                    "type": "chat_message",
                    "message": bot_reply,
                    "nickname": "Собеседник",
                },
            )
        else:
            other_id = room.player2_id if client_id == room.player1_id else room.player1_id
            if other_id and other_id in clients:
                room.waiting_for_id = other_id
                await send_to_client(
                    other_id,
                    {
                        "type": "chat_message",
                        "message": text,
                        "nickname": client.get("nickname", "Игрок"),
                    },
                )

    elif message_type == "chat_end":
        cancel_pending_bot_match(client_id)
        room_id = client.get("room_id")
        if room_id and room_id in chat_rooms:
            room = chat_rooms[room_id]
            room.active = False
            other_id = room.player2_id if client_id == room.player1_id else room.player1_id
            if other_id and other_id in clients:
                await send_to_client(other_id, {"type": "chat_partner_left"})
            if room_id in chat_rooms:
                del chat_rooms[room_id]
            client["room_id"] = None
            if other_id and other_id in clients:
                clients[other_id]["room_id"] = None

    elif message_type == "get_online_count":
        count = len([p for p in online_players if p != client_id])
        await send_to_client(
            client_id,
            {
                "type": "online_count",
                "count": count,
            },
        )


async def check_idle_players():
    while True:
        await asyncio.sleep(1)
        now = datetime.now()
        to_remove = []

        for room_id, room in list(chat_rooms.items()):
            if not room.active:
                continue
            if not room.is_bot and room.player2_id:
                if not room.waiting_for_id:
                    continue
                elapsed = (now - room.last_activity).total_seconds()
                if elapsed >= 20:
                    room.active = False
                    timed_out_id = room.waiting_for_id
                    other_id = room.player2_id if timed_out_id == room.player1_id else room.player1_id
                    if timed_out_id in clients:
                        await send_to_client(timed_out_id, {"type": "you_timeout"})
                    if other_id in clients:
                        await send_to_client(other_id, {"type": "partner_timeout"})
                    to_remove.append(room_id)

        for rid in to_remove:
            if rid in chat_rooms:
                room = chat_rooms[rid]
                if room.player1_id in clients:
                    clients[room.player1_id]["room_id"] = None
                if room.player2_id and room.player2_id in clients:
                    clients[room.player2_id]["room_id"] = None
                del chat_rooms[rid]


async def handle_disconnect(client_id):
    if client_id not in clients:
        return

    cancel_pending_bot_match(client_id)
    client = clients[client_id]
    room_id = client.get("room_id")

    if room_id and room_id in chat_rooms:
        room = chat_rooms[room_id]
        room.active = False
        other_id = room.player2_id if client_id == room.player1_id else room.player1_id
        if other_id and other_id in clients:
            await send_to_client(other_id, {"type": "chat_partner_left"})
            clients[other_id]["room_id"] = None
        if room_id in chat_rooms:
            del chat_rooms[room_id]

    if client_id in online_players:
        del online_players[client_id]
    del clients[client_id]
    await broadcast_online_count()
    print(f"Клиент {client_id} удален")


async def main():
    api_settings = resolve_api_settings()
    print("WebSocket сервер 'Котобот или нет?' запускается...")
    print("Сервер будет доступен на ws://localhost:8765")
    print(f"Провайдер бота: {api_settings['provider']}")
    print(f"Модель бота: {api_settings['model']}")
    asyncio.create_task(check_idle_players())
    async with websockets.serve(handle_client, "localhost", 8765):
        print("Сервер запущен и готов к подключениям!")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
