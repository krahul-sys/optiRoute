# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1 — Compilation: build the native C++ DAA engine with g++
# =============================================================================
FROM gcc:13 AS engine-build
WORKDIR /build
COPY engine/ ./engine/
RUN make -C engine

# =============================================================================
# Stage 2 — Production runtime: Python middleware + the compiled binary only.
# The heavy compiler toolchain is discarded to keep the image lightweight.
# =============================================================================
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY --from=engine-build /build/engine/engine /app/engine/engine
RUN chmod +x /app/engine/engine

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
