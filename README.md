# Inköpslistor (web app)

- Ingen Docker
- Minimal NodeJS-endpoint för datum/tid

UI:n i `index.html`, `app.js`, `styles.css` körs helt i webbläsaren och sparar allt lokalt via LocalStorage.

## Starta (Codespaces eller lokalt)

- Installera beroenden och starta API:t (NodeJS):

```
npm install
npm run start
```

- Öppna den vidarebefordrade porten (3000). Testa endpointen:
  - `GET /api/time` → svarar med aktuell tid som JSON

Exempel:
```
curl http://localhost:3000/api/time
# { "iso": "2025-01-01T12:34:56.789Z", "epochMs": 1735734896789, "locale": "2025-01-01, 13:34:56" }
```

- (Valfritt) Öppna `index.html` direkt i en webbläsare för den helt lokala demot utan backend.

## Funktioner

- Flera listor, byt namn, ta bort
- Lägg till varor med antal, kategori och noteringar
- Markera som avklarad, rensa avklarade
- Sök, filtrera och sortera
- Dra och släpp för manuell ordning
- Exportera/Importera alla listor som JSON

All data i det lokala demot sparas i `localStorage` under nyckeln `shoppingLists.v1`.