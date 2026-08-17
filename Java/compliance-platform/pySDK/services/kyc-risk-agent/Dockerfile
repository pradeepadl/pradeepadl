# Build context is the repo root (see docker-compose.deploy.yml) so this
# Dockerfile can reach both pySDK/sdk (the shared package) and this
# service's own code.
FROM python:3.12-slim
WORKDIR /app

# SDK layer first, installed on its own, so Docker's layer cache is only
# invalidated when the SDK itself changes — not on every service edit.
COPY pySDK/sdk ./sdk
RUN pip install --no-cache-dir ./sdk

COPY pySDK/services/kyc-risk-agent ./service
RUN pip install --no-cache-dir -r ./service/requirements.txt

WORKDIR /app/service
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD python -c "import httpx; httpx.get('http://127.0.0.1:8000/health').raise_for_status()" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
