import argparse
import posixpath
from pathlib import Path

import paramiko

from server_access import get_server_access_defaults


def ensure_remote_dir(sftp: paramiko.SFTPClient, remote_dir: str) -> None:
    parts = []
    current = remote_dir
    while current not in ("", "/"):
        parts.append(current)
        current = posixpath.dirname(current)
    for path in reversed(parts):
        try:
            sftp.stat(path)
        except FileNotFoundError:
            sftp.mkdir(path)


def upload_path(sftp: paramiko.SFTPClient, local_path: Path, remote_path: str) -> None:
    if local_path.is_dir():
        ensure_remote_dir(sftp, remote_path)
        for child in local_path.iterdir():
            upload_path(sftp, child, posixpath.join(remote_path, child.name))
        return

    ensure_remote_dir(sftp, posixpath.dirname(remote_path))
    sftp.put(str(local_path), remote_path)
    print(f"UPLOADED {local_path} -> {remote_path}")


def main() -> int:
    defaults = get_server_access_defaults()

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=defaults["host"])
    parser.add_argument("--user", default=defaults["user"])
    parser.add_argument("--password", default=defaults["password"])
    parser.add_argument("--local", required=True)
    parser.add_argument("--remote", required=True)
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
        sftp = client.open_sftp()
        try:
            upload_path(sftp, Path(args.local), args.remote)
        finally:
            sftp.close()
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
