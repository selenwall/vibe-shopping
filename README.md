# Inköpslistor (helt lokal web app)

- Ingen Python
- Ingen backend
- Ingen Docker

Endast en web-app som körs helt i webbläsaren och sparar allt lokalt via LocalStorage.

## Starta

- Öppna `index.html` i din webbläsare (dubbelklicka eller dra in i ett tomt flikfönster).
- Klart. Ingen byggprocess, inga beroenden.

Tips: Vill du ha en lokal http-server (valfritt) kan du använda valfri statisk server. Det behövs inte för att appen ska fungera.

## Funktioner

- Flera listor, byt namn, ta bort
- Lägg till varor med antal, kategori och noteringar
- Markera som avklarad, rensa avklarade
- Sök, filtrera och sortera
- Dra och släpp för manuell ordning
- Exportera/Importera alla listor som JSON

All data sparas i `localStorage` under nyckeln `shoppingLists.v1`.