# Meal prep

App personale di meal prep (PWA). File statici, nessuna build: Netlify pubblica la cartella così com'è.

- `index.html` · struttura delle schermate
- `style.css` · stile (Libre Baskerville per i titoli, Lato per il testo)
- `data.js` · ricettario (pasti, cereali, sughi, fermentati, dolci), frutta di stagione, colazioni e spuntini, obiettivi nutrizionali, mappa delle piante
- `prices.js` · prezzi Coop stimati
- `app.js` · generatore settimanale, spesa, piano, ricette, Casa (inventario di dispensa/frigo/freezer con scadenze e priorità, sughi da freezer, fermentati), dolci
- `extras.js` · guida frigo e illustrazioni
- `sw.js` · funzionamento offline (cambiare VERSION a ogni aggiornamento)

Obiettivi di default: 1800 kcal e 80–100 g di proteine al giorno, 30 piante a settimana, un fermentato al giorno, due cereali di famiglie diverse, pesce azzurro almeno una volta.

## Oblò (cartella `lavatrice/`)

Seconda app indipendente, pubblicata su `/lavatrice/` dello stesso sito: smistamento del bucato nelle ceste, dispensa dei prodotti, lavatrice virtuale con dosi, gradi e giri, e un laboratorio di box scientifici. Ha manifest, icone e service worker propri (cache `oblo-*`).

- `lavatrice/data.js` · capi, fibre, colori, ceste, prodotti, macchie, simboli delle etichette
- `lavatrice/scienza.js` · box scientifici (domanda, spiegazione, analogia, pratica)
- `lavatrice/engine.js` · smistamento, compatibilità tra ceste, ricetta del lavaggio
- `lavatrice/app.js` · interfaccia
- `lavatrice/sw.js` · offline (cambiare VERSION a ogni aggiornamento)
