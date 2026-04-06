#!/bin/bash
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
cd "$(dirname "$0")/.."
exec npx next dev
