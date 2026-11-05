# LexIndo Backend — FastAPI entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base
from app.routers import auth, chat, corpus, saved, feedback, plans, admin_dashboard

# Create all tables on startup (Alembic handles migrations in production)
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="LexIndo API",
    description="Legal Research Assistant for Indonesian Law",
    version="1.0.0",
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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "LexIndo"}

