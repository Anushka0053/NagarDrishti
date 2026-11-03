# ==============================================================================
# NAGARDRISHTI — BACKEND PRODUCTION DOCKERFILE
# Multi-worker FastAPI with PostGIS & GeoAlchemy2 runtime
# ==============================================================================

FROM python:3.11-slim as builder

# Install build dependencies for C-extensions (psycopg2, shapely, pyproj)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies in isolated wheel cache
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime image
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user for secure production execution
RUN groupadd -r nagar && useradd -r -g nagar nagar

WORKDIR /app

# Copy installed python packages from builder
COPY --from=builder /root/.local /home/nagar/.local
COPY . /app

# Ensure correct permissions
RUN chown -R nagar:nagar /app /home/nagar
USER nagar

ENV PATH=/home/nagar/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

EXPOSE 8000

# Container liveness check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/v1/health/live || exit 1

# Multi-worker Gunicorn server running Uvicorn workers
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]

