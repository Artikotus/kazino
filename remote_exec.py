import argparse
import sys

import paramiko

from server_access import get_server_access_defaults


def main() -> int:
    defaults = get_server_access_defaults()

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=defaults["host"])
    parser.add_argument("--user", default=defaults["user"])
    parser.add_argument("--password", default=defaults["password"])
    parser.add_argument("--cmd", required=True)
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
        timeout=15,
        banner_timeout=15,
        auth_timeout=15,
    )
    try:
        stdin, stdout, stderr = client.exec_command(args.cmd)
        sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))
        sys.stderr.write(stderr.read().decode("utf-8", errors="replace"))
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
