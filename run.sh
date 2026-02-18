#!/usr/bin/env bash
# HumanizeKit — Start the web service
set -e

cd "$(dirname "$0")"

# Activate venv
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install fastapi uvicorn python-multipart
    pip install git+https://github.com/ksanyok/TextHumanize.git
fi

echo ""
echo "  ✨ HumanizeKit Web Service"
echo "  ────────────────────────────"
echo "  Open: http://localhost:8000"
echo ""

uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
