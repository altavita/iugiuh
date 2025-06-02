# RealTradingBot

RealTradingBot è un'applicazione di analisi di mercato e trading per criptovalute. Combina un backend Python (Flask) per l'analisi dei dati, l'addestramento di modelli di machine learning e la generazione di segnali di trading, con un frontend React per l'interazione dell'utente e la visualizzazione dei dati.

## Funzionalità Principali

*   **Analisi di Mercato (Bot 1):**
    *   Recupera dati storici e in tempo reale per una vasta gamma di criptovalute da Binance.
    *   Calcola numerosi indicatori tecnici (RSI, MACD, ADX, Bande di Bollinger, OBV, Volatilità, Momentum, Trend, ecc.).
    *   Addestra un ensemble di modelli di Machine Learning (RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor) per prevedere le variazioni percentuali dei prezzi.
    *   Filtra gli asset in base a criteri di qualità (es. trend ADX, segnali RSI, volume significativo).
    *   Fornisce un punteggio di qualità per gli asset analizzati.
    *   Mette in cache i modelli addestrati per velocizzare le analisi successive.
*   **Analisi di Trading (Bot 2):**
    *   Utilizza un secondo insieme di modelli e indicatori più avanzati (Stochastic Oscillator, Chaikin Money Flow) per generare segnali di trading.
    *   Integra l'analisi del sentiment dalle notizie (tramite NewsAPI) per ponderare le decisioni.
    *   Rileva pattern candlestick (Doji, Hammer, Shooting Star, Bullish/Bearish Engulfing).
    *   Calcola l'allocazione del budget per asset in base a un sistema di pesi derivato da previsioni, sentiment e indicatori.
    *   Determina livelli dinamici di Stop Loss (basati su ATR) e Take Profit.
    *   Fornisce decisioni di trading (COMPRARE, VENDERE, MANTENERE) con motivazioni dettagliate.
*   **Backtesting:**
    *   Permette di testare le strategie dei bot (Bot 1 e Bot 2) su dati storici per valutarne l'efficacia.
    *   Calcola metriche di performance come accuratezza della direzione e errore medio percentuale.
*   **Cross-Validation:**
    *   Esegue k-fold cross-validation sui modelli per valutarne la robustezza e generalizzazione.
*   **API Backend:**
    *   Espone endpoint RESTful per tutte le funzionalità sopra menzionate.
*   **Frontend React:**
    *   Interfaccia utente per avviare analisi, visualizzare risultati, grafici storici e interagire con il bot.

## Stack Tecnologico

*   **Backend:**
    *   Python 3 (Flask, scikit-learn, pandas, numpy, ccxt, textblob, joblib, python-dotenv)
*   **Frontend:**
    *   React (JavaScript, Material-UI, Axios, react-scripts)
*   **API Esterne:**
    *   Binance API (per dati di mercato)
    *   NewsAPI (per analisi del sentiment)

## Prerequisiti

*   Node.js e npm (per il frontend) - [https://nodejs.org/](https://nodejs.org/)
*   Python 3 (consigliato Python 3.9+ o 3.10+) e pip - [https://www.python.org/](https://www.python.org/)

## Setup e Installazione

Segui questi passaggi per configurare ed eseguire l'applicazione sul tuo sistema locale.

### 1. Backend

```bash
# Clona il repository (se non l'hai già fatto)
# git clone <URL_DEL_TUO_REPOSITORY>
# cd realtradingbot

# Naviga nella directory del backend
cd backend

# Crea un ambiente virtuale Python
python3 -m venv venv

# Attiva l'ambiente virtuale
# Su macOS/Linux:
source venv/bin/activate
# Su Windows (Git Bash o WSL):
# source venv/Scripts/activate
# Su Windows (Command Prompt o PowerShell):
# venv\Scripts\activate

# Installa le dipendenze Python
pip install -r requirements.txt
```

### 2. Frontend

```bash
# Dalla directory root del progetto (realtradingbot)
cd frontend

# Installa le dipendenze Node.js
npm install
```

## Variabili d'Ambiente (Backend)

Il backend richiede alcune chiavi API per funzionare correttamente. Crea un file chiamato `.env` nella directory `backend` (`realtradingbot/backend/.env`) e aggiungi le seguenti variabili:

```env
BINANCE_API_KEY=LA_TUA_CHIAVE_API_BINANCE
BINANCE_API_SECRET=IL_TUO_SEGRETO_API_BINANCE
NEWS_API_KEY=LA_TUA_CHIAVE_API_NEWSAPI

# Opzionali (hanno valori di default in App.py)
# PORT=5000
# DEBUG=True
# DEFAULT_MARKET_SYMBOL=USDT
# DEFAULT_TIMEFRAME=1h
# DEFAULT_LIMIT=500
# DEFAULT_TOP_ASSETS=200
# DEFAULT_FORECAST_THRESHOLD=0.1
# DEFAULT_STOP_LOSS=-0.03
# DEFAULT_TAKE_PROFIT=0.05
# DEFAULT_FORECAST_DAYS=14
# DEFAULT_NEWS_LIMIT=140
```

Sostituisci `LA_TUA_CHIAVE_API_BINANCE`, `IL_TUO_SEGRETO_API_BINANCE`, e `LA_TUA_CHIAVE_API_NEWSAPI` con le tue effettive chiavi API.

## Avvio dell'Applicazione

Assicurati di aver completato i passaggi di setup e configurazione delle variabili d'ambiente.

### 1. Avviare il Backend

```bash
# Naviga nella directory del backend (se non ci sei già)
cd backend

# Attiva l'ambiente virtuale (se non è già attivo)
source venv/bin/activate

# Avvia il server Flask
python App.py
```

Il server backend sarà tipicamente in esecuzione su `http://localhost:5000`.

### 2. Avviare il Frontend

Apri un nuovo terminale.

```bash
# Dalla directory root del progetto, naviga nella directory del frontend
cd frontend

# Avvia il server di sviluppo React
npm start
```

Il frontend sarà tipicamente in esecuzione su `http://localhost:3000` e si aprirà automaticamente nel tuo browser predefinito.

## Accesso all'Applicazione

Una volta che sia il backend che il frontend sono in esecuzione:
1.  Apri il tuo browser web.
2.  Naviga a `http://localhost:3000`.

## Troubleshooting

### Errori di Cache del Modello (`No module named 'sklearn.ensemble._gb_losses'`)

Durante l'avvio del backend o l'esecuzione di analisi, potresti incontrare errori come `No module named 'sklearn.ensemble._gb_losses'` o simili, relativi al caricamento dei modelli dalla cache. Questo può accadere se la versione di scikit-learn o altre dipendenze correlate sono cambiate tra il momento in cui il modello è stato messo in cache e il momento in cui si tenta di caricarlo.

**Soluzione:** Elimina la directory `model_cache` all'interno della cartella `backend`:

```bash
# Dalla directory root del progetto
rm -rf backend/model_cache
```

Questo forzerà l'applicazione a riaddestrare e mettere in cache nuovi modelli con le versioni attuali delle librerie.

### Errori di Importazione nel Linter Python (IDE)

Se il tuo IDE (es. VS Code con Pylance) mostra errori di importazione per moduli come `ccxt`, `pandas`, `textblob` nonostante siano installati, è probabile che l'IDE non stia utilizzando l'interprete Python corretto dall'ambiente virtuale del backend.

**Soluzione (per VS Code):**
1.  Apri la Command Palette (Cmd+Shift+P su macOS, Ctrl+Shift+P su Windows/Linux).
2.  Digita e seleziona "Python: Select Interpreter".
3.  Scegli l'interprete Python che si trova in `backend/venv/bin/python` (o percorso equivalente per il tuo OS). Se non è elencato, potresti dover inserire manualmente il percorso.

Una volta selezionato l'interprete corretto, gli errori di importazione nel linter dovrebbero risolversi.
