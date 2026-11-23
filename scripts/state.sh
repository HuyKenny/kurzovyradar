#!/usr/bin/env bash
# Encrypted state for the PUBLIC repo (the pattern of apps/vian): data/state.db (odds history, SQLite with the D1 schema) and
# data/static-manifest.json (hashes of deployed match pages). The release asset is unreadable without STATE_KEY (a GitHub secret).
#   scripts/state.sh pull   # download + decrypt into data/ (no-op if there is none yet)
#   scripts/state.sh push   # encrypt + upload
set -euo pipefail
cd "$(dirname "$0")/.."
: "${STATE_KEY:?STATE_KEY missing}"
case "${1:-}" in
  pull)
    mkdir -p data
    if gh release download state -p 'state.enc' -D /tmp --clobber 2>/dev/null; then
      openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:STATE_KEY -in /tmp/state.enc | tar xz
      rm -f /tmp/state.enc
      echo "state restored ($(du -h data/state.db | cut -f1))"
    else
      echo "no previous state"
    fi ;;
  push)
    [ -f data/state.db ] || { echo "no state to save"; exit 0; }
    tar cz data/state.db $([ -f data/static-manifest.json ] && echo data/static-manifest.json) \
      | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:STATE_KEY -out /tmp/state.enc
    gh release view state >/dev/null 2>&1 || gh release create state --title "build state (encrypted)" --notes "Encrypted odds history between builds. Not a software release." --latest=false
    gh release upload state /tmp/state.enc --clobber
    echo "state saved ($(du -h /tmp/state.enc | cut -f1))"
    rm -f /tmp/state.enc ;;
  *) echo "usage: $0 pull|push"; exit 2 ;;
esac
