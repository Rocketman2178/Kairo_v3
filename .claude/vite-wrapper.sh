#!/bin/sh
# Strip --root <path> injected by Claude preview_start (Vite 5 uses positional arg, not --root flag)
ARGS=""
SKIP_NEXT=0
for arg in "$@"; do
  if [ "$SKIP_NEXT" = "1" ]; then
    SKIP_NEXT=0
    continue
  fi
  if [ "$arg" = "--root" ]; then
    SKIP_NEXT=1
    continue
  fi
  ARGS="$ARGS $arg"
done
cd /Users/marshallbriggs/Documents/GitHub/Kairo_v3
exec /usr/local/bin/npm run dev -- $ARGS
