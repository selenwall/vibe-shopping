# Development

Run the app locally either with Docker (recommended) or directly on your machine.

## Using Docker

Prereqs: Docker Desktop or Docker Engine.

1) Copy env (optional, only needed for AI categorization):

```
cp .env.example .env
# then edit .env to add your OPENAI_API_KEY if you want AI-assisted categorization
```

2) Build and start both services (backend + nginx frontend proxy):

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API (direct): http://localhost:8000/docs
- Data persists in the named volume `db_data` (SQLite file under /data in the container)

Hot reload: Code changes in the repo are mounted into the backend container and uvicorn runs with `--reload`.

## Without Docker (local Python)

Prereqs: Python 3.11+

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn uvicorn_app:app --reload --host 0.0.0.0 --port 8000
```

Open the app at:

- http://localhost:8000/ (FastAPI serves the static UI from `static/`)
- API docs: http://localhost:8000/docs

Optional AI categorization:

```
export OPENAI_API_KEY=sk-...
# OPENAI_MODEL is optional; defaults to gpt-4o-mini
```

## Notes
- There are two frontends in this repo:
  - `static/` is the UI that talks to the backend API (what Docker serves by default).
  - `index.html`, `app.js`, `styles.css` in the repo root are a fully local demo that uses `localStorage` only (no backend).
- In Docker, Nginx serves the `static/` UI on port 5173 and proxies `/api/*` to the backend on port 8000.