# Housekeeping like a pro

Sito con le app di casa, pubblicato da Netlify su housekeepinglikeapro.netlify.app. File statici, nessuna build.

- `/` · pagina iniziale con i collegamenti alle app (`index.html`); `sw.js` alla radice serve solo a disattivare il vecchio service worker del meal prep, che prima viveva qui
- `/mealprep/` · **Schiscia**, l'app di meal prep (cartella `mealprep/`)
- `/lavatrice/` · **Oblò**, l'app per il bucato: vive nel repository allexor17/Oblo e Netlify la scarica a ogni pubblicazione

## Schiscia (cartella `mealprep/`)

App di meal prep (PWA), personalizzabile: chi la apre per la prima volta fa un questionario e l'app si adatta a lui. Si condivide mandando il link: ogni persona ha il suo profilo e i suoi dati, salvati solo sul suo telefono.

- `mealprep/index.html` · struttura delle schermate (compresi il questionario e il profilo)
- `style.css` · stile (Libre Baskerville per i titoli, Lato per il testo)
- `data.js` · ricettario (pasti, cereali, sughi, fermentati, dolci) con le etichette per la personalizzazione (`META`: carboidrati, difficoltà, buona fredda, termos, friggitrice ad aria, utensili che cambiano i tempi), frutta di stagione, colazioni e spuntini, mappa delle piante
- `prices.js` · prezzi Coop stimati
- `profile.js` · il profilo: diete, allergie, gusti, quantità, utensili, abilità e tempo; quali ricette vanno bene (`whyNot`), quanto grandi fare le porzioni (`portionFactors`), tempi con gli utensili (`effTimes`), diagnosi quando le ricette sono poche, sblocchi con gli utensili nuovi, questionario e schermata Profilo
- `app.js` · generatore settimanale, spesa, piano, ricette, Casa (inventario di dispensa/frigo/freezer con scadenze e priorità, sughi da freezer, fermentati), dolci
- `extras.js` · guida frigo, illustrazioni e avvio (questionario per chi è nuovo)
- `mealprep/sw.js` · funzionamento offline (cambiare VERSION a ogni aggiornamento; cache `schiscia-*`)

Come funziona la personalizzazione:

- **Filtri per ricetta**: dieta (onnivora, pescetariana, vegetariana, vegana), allergie e intolleranze, cibi esclusi, piccante, utensili indispensabili (forno o friggitrice, fornelli, bilancia per i fermentati), livello in cucina. Le categorie si riconoscono dal nome degli ingredienti, quindi valgono anche per le ricette nuove.
- **Vincoli per giornata**: calorie, proteine e, per low carb e chetogenica, carboidrati.
- **Porzioni a blocchi**: piatto principale e cereale si scalano separatamente per arrivare insieme a calorie e proteine del profilo; spesa e ricette mostrano le quantità già adattate.
- **Lucchetto**: un pasto già cucinato resta fisso quando si rigenera o si cambia il profilo. Cambiando il profilo, i pasti che non vanno più bene vengono segnalati e si rifanno con un tocco.

Chi usava l'app prima dei profili riceve un profilo uguale alle regole di allora: pescetariana, 1800 kcal e 80–100 g di proteine al giorno, niente piccante, 30 piante a settimana, un fermentato al giorno, pesce azzurro almeno una volta. La versione di prima è salvata nel branch `versione-originale`.

## Oblò (cartella `lavatrice/`)

Oblò vive nel suo repository, [allexor17/Oblo](https://github.com/allexor17/Oblo). Qui non c'è il suo codice: a ogni pubblicazione Netlify esegue `build-oblo.sh` (configurato in `netlify.toml`), che scarica Oblò nella cartella `lavatrice/` alla versione scritta in `oblo.ref`. Così ognuna ha il proprio repository e il sito le pubblica insieme: Schiscia su `/mealprep/`, Oblò su `/lavatrice/`.

Per pubblicare una nuova versione di Oblò: si fa il push sul repository Oblo, poi qui si scrive il nuovo commit in `oblo.ref` e si fa il push. Per provare in locale: `sh build-oblo.sh`.
