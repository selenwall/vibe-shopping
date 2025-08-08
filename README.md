# Inköpslistor – Web App

En enkel FastAPI-app med HTML/JS-frontend för att hantera inköpslistor. Varor kategoriseras automatiskt (AI om nyckel finns, annars regler + fuzzy match).

## Funktioner
- Skapa flera listor
- Lägg till/ta bort varor
- Automatisk kategorisering (mejeri, bröd, frukt & grönt, kött & fisk, skafferi, dryck, hushåll, frys)

## Körning med Docker (rekommenderas)
```bash
docker compose up --build
```
Appen körs på http://localhost:8000

Valfri AI-nyckel:
```bash
export OPENAI_API_KEY=sk-...
docker compose up --build
```

## Lokal körning (utan Docker)
Kräver Python 3.10+
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn uvicorn_app:app --reload --host 0.0.0.0 --port 8000
```

## .env
Kopiera `.env.example` till `.env` och fyll i vid behov.

## Noteringar om AI-kategorisering
- Om `OPENAI_API_KEY` finns används en Chat Completions-modell (default `gpt-4o-mini`).
- Om AI saknas eller fallerar används regelbaserad och fuzzy-kategorisering.