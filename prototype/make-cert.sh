#!/usr/bin/env sh
# Regenerate the self-signed cert used by server.js for HTTPS (required for the phone camera).
# The cert is tied to the LAN IP, so re-run this whenever the Wi-Fi network changes.
#
#   sh make-cert.sh              # auto-detects the LAN IP
#   sh make-cert.sh 192.168.1.39 # or pass it explicitly
#
# Needs openssl (ships with Git for Windows / Git Bash).
set -e
cd "$(dirname "$0")"

# Git Bash / MSYS rewrites "/CN=..." into a Windows path; these disable that. No-ops elsewhere.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

IP="$1"
if [ -z "$IP" ]; then
  IP=$(node -e "const n=require('os').networkInterfaces();for(const k in n)for(const i of n[k])if(i.family==='IPv4'&&!i.internal){console.log(i.address);process.exit(0)}")
fi
if [ -z "$IP" ]; then
  echo "Could not detect a LAN IP. Pass one: sh make-cert.sh 192.168.1.39" >&2
  exit 1
fi

echo "Generating cert for localhost + $IP ..."
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 825 \
  -subj "/CN=PosturAI prototype" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$IP"

echo "Wrote cert.pem + key.pem. Now run: node server.js"
