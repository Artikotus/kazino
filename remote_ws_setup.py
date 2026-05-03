import argparse
import paramiko

from server_access import get_server_access_defaults


COMMANDS = [
    "cd /home/c/{user}/api/artikotus_runtime && python3 -c \"import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/pip/3.6/get-pip.py', 'get-pip.py')\"",
    "cd /home/c/{user}/api/artikotus_runtime && python3 get-pip.py --user",
    "cd /home/c/{user}/api/artikotus_runtime && ~/.local/bin/pip3 install --user websockets==10.4 aiohttp==3.8.6",
    "cd /home/c/{user}/api/artikotus_runtime && nohup python3 websocket_server.py > websocket.log 2>&1 &",
    "cd /home/c/{user}/api/artikotus_runtime && sleep 2 && tail -n 50 websocket.log",
]


def run_remote(client: paramiko.SSHClient, command: str) -> int:
    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    print(f"$ {command}")
    if out:
        print(out)
    if err:
        print(err)
    print(f"[exit={code}]")
    return code


def main() -> int:
    defaults = get_server_access_defaults()

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=defaults["host"])
    parser.add_argument("--user", default=defaults["user"])
    parser.add_argument("--password", default=defaults["password"])
    args = parser.parse_args()

    if not args.host or not args.user or not args.password:
        parser.error("Missing hosting access. Use server_access.local.env or pass --host/--user/--password.")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        args.host,
        username=args.user,
        password=args.password,
        look_for_keys=False,
        allow_agent=False,
        timeout=20,
        banner_timeout=20,
        auth_timeout=20,
    )
    try:
        for raw_command in COMMANDS:
            code = run_remote(client, raw_command.format(user=args.user))
            if code != 0:
                return code
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
