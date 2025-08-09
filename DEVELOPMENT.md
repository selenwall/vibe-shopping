# Development

This repo now uses a minimal NodeJS API and a static browser UI.

## Run in Codespaces

1) Install dependencies and start the server:
```
npm install
npm run start
```
2) Forward port 3000. Test:
```
curl http://localhost:3000/api/time
```

## Run locally

Prereqs: Node 18+
```
npm install
npm run start
```
Open: `http://localhost:3000/api/time`

UI demo (no backend needed): open `index.html` in your browser. It stores data in `localStorage`.