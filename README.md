# Housekeeping like a pro

Sito con le app di casa, pubblicato da Netlify su housekeepinglikeapro.netlify.app. File statici, nessuna build.

- `/` · pagina iniziale con i collegamenti alle app (`index.html`); `sw.js` alla radice serve solo a disattivare il vecchio service worker del meal prep, che prima viveva qui
- `/mealprep/` · **Schiscia**, l'app di meal prep (cartella `mealprep/`)
- `/lavatrice/` · **Oblò**, l'app per il bucato (sottomodulo dal repository allexor17/Oblo)

## Schiscia (cartella `mealprep/`)

App personale di meal prep (PWA).

- `mealprep/index.html` · struttura delle schermate
- `style.css` · stile (Libre Baskerville per i titoli, Lato per il testo)
- `data.js` · ricettario (pasti, cereali, sughi, fermentati, dolci), frutta di stagione, colazioni e spuntini, obiettivi nutrizionali, mappa delle piante
- `prices.js` · prezzi Coop stimati
- `app.js` · generatore settimanale, spesa, piano, ricette, Casa (inventario di dispensa/frigo/freezer con scadenze e priorità, sughi da freezer, fermentati), dolci
- `extras.js` · guida frigo e illustrazioni
- `mealprep/sw.js` · funzionamento offline (cambiare VERSION a ogni aggiornamento; cache `schiscia-*`)

Obiettivi di default: 1800 kcal e 80–100 g di proteine al giorno, 30 piante a settimana, un fermentato al giorno, due cereali di famiglie diverse, pesce azzurro almeno una volta.

## Oblò (cartella `lavatrice/`)

Oblò vive nel suo repository, [allexor17/Oblo](https://github.com/allexor17/Oblo), ed è collegata qui come sottomodulo git nella cartella `lavatrice/`. Così ognuna ha il proprio repository, ma Netlify pubblica tutto su un solo sito: Schiscia su `/mealprep/`, Oblò su `/lavatrice/`.

Per aggiornare Oblò: si modifica e si pubblica il repository Oblo, poi qui si aggiorna il puntatore del sottomodulo (`git submodule update --remote lavatrice`, commit e push). Netlify scarica i sottomoduli da solo a ogni pubblicazione.
