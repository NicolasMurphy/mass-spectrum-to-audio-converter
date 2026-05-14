FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM python:3.13
WORKDIR /app

COPY requirements.txt requirements-dev.txt ./
RUN apt-get update && apt-get install -y libpq-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ] ; then pip install --no-cache-dir -r requirements-dev.txt ; fi

COPY api/ ./api/
COPY audio/ ./audio/
COPY db/ ./db/
COPY services/ ./services/
COPY utils/ ./utils/
COPY app.py ./
COPY gunicorn.conf.py ./
COPY --from=frontend-builder /app/frontend/dist ./static/

EXPOSE 5000
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
