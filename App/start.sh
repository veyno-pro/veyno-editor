#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
URL="http://127.0.0.1:8766/"
if command -v node >/dev/null 2>&1; then NODE=node
elif command -v nodejs >/dev/null 2>&1; then NODE=nodejs
else
  echo
  echo "  Node.js wird benoetigt, wurde aber nicht gefunden. Bitte installieren:"
  echo "    Debian/Ubuntu: sudo apt install nodejs"
  echo "    Fedora:        sudo dnf install nodejs"
  echo "    macOS (brew):  brew install node      (oder https://nodejs.org)"
  echo
  read -r -p "  Enter zum Schliessen..." _
  exit 1
fi
echo
echo "  VEYNO laeuft:  $URL"
echo "  Dieses Fenster offen lassen (Strg+C beendet VEYNO)."
echo
( sleep 1.5; xdg-open "$URL" >/dev/null 2>&1 || open "$URL" >/dev/null 2>&1 || sensible-browser "$URL" >/dev/null 2>&1 ) &
exec "$NODE" veyno-server.js
