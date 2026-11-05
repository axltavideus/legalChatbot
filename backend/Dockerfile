# ==============================================================================
# LexIndo Backend — Production Dockerfile
# FastAPI + ChromaDB + ReportLab + Uvicorn
# ==============================================================================
FROM python:3.11-slim AS base

# Install system dependencies (curl for health check, build tools if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    DATABASE_URL=sqlite:////app/data/lexindo.db \
    CHROMA_PATH=/app/data/chroma_db \
    EMBEDDING_PROVIDER=gemini \
    MOCK_LLM=true

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and seed files
COPY app/ ./app/
COPY seed/ ./seed/
COPY main.py .

# Create persistent data directory
RUN mkdir -p /app/data/chroma_db

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

