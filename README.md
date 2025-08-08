# Inköpslistor – Web App (Statisk / GitHub Pages)

En helt statisk SPA som hanterar inköpslistor i webbläsaren via LocalStorage. Automatisk kategorisering sker klient-side med regler + fuzzy, och kan valfritt använda OpenAI om användaren anger sin egen API-nyckel i UI:t.

## Start lokalt (ingen build krävs)
Öppna `docs/index.html` i din webbläsare direkt från filsystemet eller serva `docs/` med valfri enkel HTTP-server.

Exempel:
```bash
# via Python
python3 -m http.server --directory docs 8080
# öppna http://localhost:8080
```

## GitHub Pages
1. Lägg koden i ett GitHub-repo
2. Gå till Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` (eller din default) och folder: `/docs`
5. Spara – din sida blir tillgänglig på GitHub Pages-URL:en

## AI-kategorisering (valfritt)
I toppen av sidan finns "AI-inställningar" där du kan ange `OPENAI_API_KEY` och modell (t.ex. `gpt-4o-mini`). Nyckeln lagras i LocalStorage och anropen går direkt från din webbläsare till OpenAI.

Om ingen nyckel anges används en lokal regelbaserad + fuzzy-kategorisering.

## Backend-kod (valfri)
I repo finns även en tidigare backend-implementation (`app/`, FastAPI) som inte behövs för GitHub Pages. Den kan ignoreras om du bara vill köra statiskt.