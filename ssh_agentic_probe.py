import argparse
import os
import shutil
import socket
import subprocess
import sys


def try_paramiko(host: str, user: str, password: str, remote_cmd: str) -> int:
    try:
        import paramiko
    except Exception as exc:
        print(f"PARAMIKO_UNAVAILABLE: {exc}")
        return 10

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            host,
            username=user,
            password=password,
            look_for_keys=False,
            allow_agent=False,
            timeout=10,
            banner_timeout=10,
            auth_timeout=10,
        )
        stdin, stdout, stderr = client.exec_command(remote_cmd)
        print("PARAMIKO_CONNECTED")
        print(stdout.read().decode(errors="replace").strip())
        err = stderr.read().decode(errors="replace").strip()
        if err:
            print("PARAMIKO_STDERR")
            print(err)
        client.close()
        return 0
    except Exception as exc:
        print(f"PARAMIKO_FAILED: {type(exc).__name__}: {exc}")
        return 1


def git_ssh_path() -> str | None:
    candidates = [
        r"C:\Program Files\Git\usr\bin\ssh.exe",
        r"C:\Program Files (x86)\Git\usr\bin\ssh.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return shutil.which("ssh")


def try_wexpect(host: str, user: str, password: str, remote_cmd: str) -> int:
    try:
        import wexpect
    except Exception as exc:
        print(f"WEXPECT_UNAVAILABLE: {exc}")
        return 20

    ssh_path = git_ssh_path()
    if not ssh_path:
        print("WEXPECT_FAILED: ssh client not found")
        return 21

    cmd = f'"{ssh_path}" -tt -o StrictHostKeyChecking=no {user}@{host}'
    print(f"WEXPECT_CMD: {cmd}")

    child = None
    try:
        child = wexpect.spawn(cmd, timeout=25)
        while True:
            idx = child.expect(
                [
                    r"Are you sure you want to continue connecting \(yes/no(/\[fingerprint\])?\)\?",
                    r"[Pp]assword:",
                    r"Permission denied",
                    r"[$#>] ?",
                    wexpect.EOF,
                    wexpect.TIMEOUT,
                ]
            )
            if idx == 0:
                child.sendline("yes")
            elif idx == 1:
                child.sendline(password)
            elif idx == 2:
                before = child.before.strip()
                print("WEXPECT_FAILED: Permission denied")
                if before:
                    print(before)
                return 22
            elif idx == 3:
                child.sendline(remote_cmd)
                child.sendline("exit")
            elif idx == 4:
                before = child.before.strip()
                print("WEXPECT_EOF")
                if before:
                    print(before)
                return 0
            elif idx == 5:
                before = child.before.strip()
                print("WEXPECT_TIMEOUT")
                if before:
                    print(before)
                return 23
    except Exception as exc:
        print(f"WEXPECT_FAILED: {type(exc).__name__}: {exc}")
        return 24
    finally:
        if child is not None:
            try:
                child.close()
            except Exception:
                pass


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="192.168.0.39")
    parser.add_argument("--user", default="kassir")
    parser.add_argument("--password", default="75435789")
    parser.add_argument("--cmd", default="whoami; hostname")
    args = parser.parse_args()

    # Fast reachability hint before auth attempts.
    try:
        with socket.create_connection((args.host, 22), timeout=5):
            print("TCP_22_REACHABLE")
    except Exception as exc:
        print(f"TCP_22_FAILED: {exc}")
        return 100

    code = try_paramiko(args.host, args.user, args.password, args.cmd)
    if code == 0:
        return 0

    return try_wexpect(args.host, args.user, args.password, args.cmd)


if __name__ == "__main__":
    sys.exit(main())
