# LexIndo Backend — FastAPI entry point
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.routers import auth, chat, corpus, saved, feedback, plans, admin_dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: ensure database tables exist and auto-seed corpus if empty."""
    Base.metadata.create_all(bind=engine)
    try:
        from app.models.regulation import Regulation
        from seed.seed import run_seed
        db = SessionLocal()
        reg_count = db.query(Regulation).count()
        if reg_count == 0:
            print("[Startup] Corpus is empty. Running auto-seed...", flush=True)
            run_seed()
            print("[Startup] Auto-seed finished successfully.", flush=True)
        else:
            print(f"[Startup] Corpus contains {reg_count} regulations. Auto-seed not needed.", flush=True)
        db.close()
    except Exception as e:
        print(f"[Startup] Auto-seed check warning: {e}", flush=True)
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="LexIndo API",
    description="Legal Research Assistant for Indonesian Law",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(corpus.router, prefix="/api/corpus", tags=["corpus"])
app.include_router(saved.router, prefix="/api/saved", tags=["saved"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(admin_dashboard.router, prefix="/api/admin/dashboard", tags=["admin-dashboard"])


@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check for Docker, Render, Vercel, and Kubernetes probes."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e}"

    chroma_status = "ready"
    try:
        from app.services.vector_store import get_chroma_client
        client = get_chroma_client()
        client.heartbeat()
    except Exception as e:
        chroma_status = f"unhealthy: {e}"

    is_healthy = db_status == "connected" and "unhealthy" not in chroma_status
    return {
        "status": "ok" if is_healthy else "degraded",
        "app": "LexIndo",
        "version": "1.0.0",
        "database": db_status,
        "chromadb": chroma_status,
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "mock_llm": settings.MOCK_LLM,
    }

