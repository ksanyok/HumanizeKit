"""HumanizeKit Web Service — FastAPI backend wrapping TextHumanize library."""

from __future__ import annotations

import time
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# TextHumanize imports
# ---------------------------------------------------------------------------
from texthumanize import humanize, humanize_chunked, analyze, explain, __version__ as th_version

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
APP_VERSION = "1.0.0"

app = FastAPI(
    title="HumanizeKit",
    description="Web service for algorithmic text naturalization powered by TextHumanize",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class HumanizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100_000)
    lang: str = Field("auto", pattern=r"^(auto|ru|uk|en|de|fr|es|pl|pt|it|[a-z]{2,3})$")
    profile: str = Field("web", pattern=r"^(chat|web|seo|docs|formal)$")
    intensity: int = Field(60, ge=0, le=100)
    preserve_code: bool = True
    preserve_urls: bool = True
    preserve_emails: bool = True
    keep_keywords: list[str] = Field(default_factory=list)
    seed: int | None = None


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100_000)
    lang: str = Field("auto", pattern=r"^(auto|ru|uk|en|de|fr|es|pl|pt|it|[a-z]{2,3})$")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the main SPA page."""
    html_path = FRONTEND_DIR / "index.html"
    return HTMLResponse(content=html_path.read_text(encoding="utf-8"))


@app.get("/api/info")
async def info():
    """Return service metadata."""
    return {
        "service": "HumanizeKit",
        "version": APP_VERSION,
        "engine": f"TextHumanize {th_version}",
        "profiles": ["chat", "web", "seo", "docs", "formal"],
        "languages": [
            {"code": "auto", "name": "Auto-detect"},
            {"code": "ru", "name": "Русский"},
            {"code": "uk", "name": "Українська"},
            {"code": "en", "name": "English"},
            {"code": "de", "name": "Deutsch"},
            {"code": "fr", "name": "Français"},
            {"code": "es", "name": "Español"},
            {"code": "pl", "name": "Polski"},
            {"code": "pt", "name": "Português"},
            {"code": "it", "name": "Italiano"},
        ],
    }


@app.post("/api/humanize")
async def api_humanize(req: HumanizeRequest):
    """Humanize the given text."""
    t0 = time.perf_counter()
    try:
        preserve = {
            "code_blocks": req.preserve_code,
            "urls": req.preserve_urls,
            "emails": req.preserve_emails,
        }
        constraints: dict = {}
        if req.keep_keywords:
            constraints["keep_keywords"] = req.keep_keywords

        # Use chunked for large texts
        fn = humanize_chunked if len(req.text) > 5000 else humanize
        result = fn(
            text=req.text,
            lang=req.lang,
            profile=req.profile,
            intensity=req.intensity,
            preserve=preserve,
            constraints=constraints or None,
            seed=req.seed,
        )

        elapsed = time.perf_counter() - t0

        # Analyse before & after
        report_before = analyze(req.text, lang=result.lang)
        report_after = analyze(result.text, lang=result.lang)

        explanation = explain(result)

        return {
            "ok": True,
            "original": result.original,
            "text": result.text,
            "lang": result.lang,
            "profile": result.profile,
            "intensity": result.intensity,
            "change_ratio": round(result.change_ratio, 4),
            "changes": result.changes[:50],  # limit to 50 for UI
            "elapsed_ms": round(elapsed * 1000, 1),
            "explanation": explanation,
            "metrics_before": {
                "artificiality_score": round(report_before.artificiality_score, 1),
                "avg_sentence_length": round(report_before.avg_sentence_length, 1),
                "bureaucratic_ratio": round(report_before.bureaucratic_ratio, 4),
                "connector_ratio": round(report_before.connector_ratio, 4),
                "repetition_score": round(report_before.repetition_score, 4),
                "burstiness_score": round(report_before.burstiness_score, 4),
                "flesch_kincaid_grade": round(getattr(report_before, "flesch_kincaid_grade", 0), 1),
                "coleman_liau_index": round(getattr(report_before, "coleman_liau_index", 0), 1),
            },
            "metrics_after": {
                "artificiality_score": round(report_after.artificiality_score, 1),
                "avg_sentence_length": round(report_after.avg_sentence_length, 1),
                "bureaucratic_ratio": round(report_after.bureaucratic_ratio, 4),
                "connector_ratio": round(report_after.connector_ratio, 4),
                "repetition_score": round(report_after.repetition_score, 4),
                "burstiness_score": round(report_after.burstiness_score, 4),
                "flesch_kincaid_grade": round(getattr(report_after, "flesch_kincaid_grade", 0), 1),
                "coleman_liau_index": round(getattr(report_after, "coleman_liau_index", 0), 1),
            },
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=422,
            content={"ok": False, "error": str(e)},
        )


@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    """Analyze text artificiality metrics."""
    try:
        lang = req.lang
        if lang == "auto":
            from texthumanize.lang_detect import detect_language
            lang = detect_language(req.text)

        report = analyze(req.text, lang=lang)
        return {
            "ok": True,
            "lang": lang,
            "artificiality_score": round(report.artificiality_score, 1),
            "avg_sentence_length": round(report.avg_sentence_length, 1),
            "bureaucratic_ratio": round(report.bureaucratic_ratio, 4),
            "connector_ratio": round(report.connector_ratio, 4),
            "repetition_score": round(report.repetition_score, 4),
            "burstiness_score": round(report.burstiness_score, 4),
            "flesch_kincaid_grade": round(getattr(report, "flesch_kincaid_grade", 0), 1),
            "coleman_liau_index": round(getattr(report, "coleman_liau_index", 0), 1),
            "total_words": getattr(report, "total_words", 0),
            "total_sentences": getattr(report, "total_sentences", 0),
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=422,
            content={"ok": False, "error": str(e)},
        )
