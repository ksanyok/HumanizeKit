# HumanizeKit

Beautiful, modern web service for algorithmic text naturalization powered by [TextHumanize](https://github.com/ksanyok/TextHumanize).

## Features

- **Modern glassmorphism UI** with dark/light themes
- **Particle background** with interactive mouse effects
- **Real-time text processing** via REST API
- **Visual analytics dashboard** with animated gauges and metrics
- **Diff view** to compare original vs processed text
- **10-stage pipeline visualization** with animations
- **9 language support** + universal processor
- **5 processing profiles**: Chat, Web, SEO, Docs, Formal
- **Confetti effects** on successful processing
- **Keyboard shortcuts** (Cmd/Ctrl+Enter to process)

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
bash run.sh

# Or directly:
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/info` | Service metadata |
| `POST` | `/api/humanize` | Process text |
| `POST` | `/api/analyze` | Analyze text metrics |

## Tech Stack

- **Backend**: FastAPI + TextHumanize engine
- **Frontend**: Vanilla HTML/CSS/JS, glassmorphism design
- **Animations**: CSS animations, Canvas particle system, confetti effects

## License

Powered by TextHumanize — Personal Use License.
