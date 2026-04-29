# Server Deploy Reference

## SSH Access

- Host: `192.168.0.39`
- User: `kassir`
- Password: `75435789`
- Default SSH command:

```bash
ssh kassir@192.168.0.39
```

- Git for Windows SSH client available on this machine:

```powershell
& 'C:\Program Files\Git\usr\bin\ssh.exe' kassir@192.168.0.39
```

## Verification Status

- SSH service on `192.168.0.39:22` is reachable from this workstation.
- User confirmed access from a neighboring host.
- Server should allow both key-based access and password login for `kassir`.
- A local non-interactive test with Git for Windows bundled `ssh.exe` returned `Permission denied (publickey,password)`, so that failure appears specific to this workstation or invocation method rather than the credentials themselves.
- Save this file only as a temporary internal reference. Remove or rotate the password after deployment if possible.

## Server-Side Files In This Repo

- `websocket_server.py` - WebSocket game server
- `requirements.txt` - Python dependency list (`websockets>=12.0`)
- `README_WEBSOCKET.md` - local run notes for the WebSocket server
- `server.py` - simple local static file server on port `8000`
- `server.ps1` - PowerShell static file server on port `8000`

## Likely Deploy Steps

1. Connect to the server with the SSH credentials above.
2. Copy the project files to the target directory on the server.
3. Install Python and project dependencies.
4. Start `websocket_server.py` for the backend WebSocket service.
5. Serve the static frontend files separately if needed.

## Concrete Deploy Checklist

1. Open Git Bash or run Git's SSH client directly from PowerShell.
2. Use the confirmed working access path from the neighboring host if you need to deploy immediately.
3. Create a target app directory on the server, for example `~/kazino`.
4. Upload backend files:
   - `websocket_server.py`
   - `requirements.txt`
5. Upload frontend/static files if they must be served from the same server:
   - `index.html`
   - `manifest.json`
   - `game/`
   - `bd/`
6. Ensure Python 3 and `pip` are installed on the server.
7. Install dependencies with `python -m pip install -r requirements.txt`.
8. Start the backend with `python websocket_server.py`.
9. Keep it running with `screen`, `tmux`, a `systemd` service, or another process manager.
10. Point the frontend to the server's WebSocket address instead of localhost if clients connect remotely.

## Minimal Backend Start Commands

```bash
python -m pip install -r requirements.txt
python websocket_server.py
```

## Notes

- `README_WEBSOCKET.md` documents the WebSocket server running on `ws://localhost:8765`.
- `server.py` and `server.ps1` are development-oriented local static servers; they are not a production deployment setup by themselves.
- The earlier password failure reproduced only from this workstation's Git SSH test and should not be treated as proof of bad credentials.
