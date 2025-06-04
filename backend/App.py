from flask import Flask, request, jsonify
from flask_cors import CORS
import ccxt
import pandas as pd
import numpy as np

# Compatibilità NumPy 2.0
if not hasattr(np, 'float_'):
    np.float_ = np.float64
if not hasattr(np, 'int_'):
    np.int_ = np.int64

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV, KFold
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from datetime import datetime
from textblob import TextBlob
import requests
import re
import time
import os
import joblib
import multiprocessing
import warnings
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import multiprocessing

if __name__ == '__main__':
    try:
        multiprocessing.set_start_method('fork')
        print("Using 'fork' method for multiprocessing")
    except RuntimeError:
        print("Multiprocessing method already set or not supported")

# Ottimizzazioni per M2
NUM_CORES = multiprocessing.cpu_count()
print(f"System has {NUM_CORES} CPU cores, optimizing for parallelism")

warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration from environment variables
API_KEY = os.getenv('BINANCE_API_KEY')
API_SECRET = os.getenv('BINANCE_API_SECRET')
NEWS_API_KEY = os.getenv('NEWS_API_KEY')
DEFAULT_MARKET_SYMBOL = os.getenv('DEFAULT_MARKET_SYMBOL', 'USDT')
DEFAULT_TIMEFRAME = os.getenv('DEFAULT_TIMEFRAME', '1h')
DEFAULT_LIMIT = int(os.getenv('DEFAULT_LIMIT', 500))
DEFAULT_TOP_ASSETS = int(os.getenv('DEFAULT_TOP_ASSETS', 200))
DEFAULT_FORECAST_THRESHOLD = float(os.getenv('DEFAULT_FORECAST_THRESHOLD', 0.1))
DEFAULT_STOP_LOSS = float(os.getenv('DEFAULT_STOP_LOSS', -0.03))
DEFAULT_TAKE_PROFIT = float(os.getenv('DEFAULT_TAKE_PROFIT', 0.05))
DEFAULT_FORECAST_DAYS = int(os.getenv('DEFAULT_FORECAST_DAYS', 14))
DEFAULT_NEWS_LIMIT = int(os.getenv('DEFAULT_NEWS_LIMIT', 140))

# Cartella per la cache dei modelli
os.makedirs('model_cache', exist_ok=True)

exchange = ccxt.binance({
    'apiKey': API_KEY,
    'secret': API_SECRET,
    'enableRateLimit': True
})

# Common Functions
def fetch_market_assets(market_symbol=DEFAULT_MARKET_SYMBOL):
    try:
        markets = exchange.load_markets()
        pairs = [
            symbol for symbol, details in markets.items()
            if market_symbol in symbol and '/' in symbol 
            and details.get('quote') == market_symbol  
            and details.get('active', True)
        ]
        return pairs
    except Exception as e:
        print(f"Error loading assets: {e}")
        return []

def fetch_market_data(symbol, timeframe=DEFAULT_TIMEFRAME, limit=DEFAULT_LIMIT):
    try:
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        if not ohlcv:
            return None
        
        data = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        data['timestamp'] = pd.to_datetime(data['timestamp'], unit='ms')
        return data
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

def calculate_rsi(data, period=14):
    delta = data['close'].diff()
    gain = delta.clip(lower=0).rolling(window=period).mean()
    loss = -delta.clip(upper=0).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(data, short=12, long=26, signal=9):
    short_ema = data['close'].ewm(span=short).mean()
    long_ema = data['close'].ewm(span=long).mean()
    macd = short_ema - long_ema
    signal_line = macd.ewm(span=signal).mean()
    return macd, signal_line

def calculate_atr(data, period=14):
    high_low = data['high'] - data['low']
    high_close = abs(data['high'] - data['close'].shift(1))
    low_close = abs(data['low'] - data['close'].shift(1))
    return pd.concat([high_low, high_close, low_close], axis=1).max(axis=1).rolling(window=period).mean()

def calculate_volatility(data, period=14):
    log_returns = np.log(data['close'] / data['close'].shift(1))
    return log_returns.rolling(window=period).std()

def calculate_adx(data, period=14):
    df = data.copy()
    df['TR'] = np.maximum(df['high'] - df['low'], 
                          np.maximum(abs(df['high'] - df['close'].shift(1)), 
                                     abs(df['low'] - df['close'].shift(1))))
    df['DM+'] = np.where((df['high'] - df['high'].shift(1)) > (df['low'].shift(1) - df['low']), 
                         df['high'] - df['high'].shift(1), 0)
    df['DM-'] = np.where((df['low'].shift(1) - df['low']) > (df['high'] - df['high'].shift(1)), 
                         df['low'].shift(1) - df['low'], 0)
    tr_rolling = df['TR'].rolling(window=period).sum()
    dm_plus_rolling = df['DM+'].rolling(window=period).sum()
    dm_minus_rolling = df['DM-'].rolling(window=period).sum()
    di_plus = 100 * (dm_plus_rolling / tr_rolling)
    di_minus = 100 * (dm_minus_rolling / tr_rolling)
    dx = 100 * abs(di_plus - di_minus) / (di_plus + di_minus)
    return dx.rolling(window=period).mean()

def calculate_bollinger_bands(data, window=20):
    sma = data['close'].rolling(window).mean()
    std = data['close'].rolling(window).std()
    upper_band = sma + (2 * std)
    lower_band = sma - (2 * std)
    return upper_band, lower_band

def backtest_model(symbol, lookback_days=30, prediction_days=5):
    """
    Esegue un backtest del modello su dati storici.
    """
    print(f"Esecuzione backtest per {symbol}...")
    
    try:
        # Otteniamo dati storici più ampi rispetto al normale
        backtest_limit = DEFAULT_LIMIT + lookback_days + prediction_days
        all_data = fetch_market_data(symbol, timeframe='1h', limit=backtest_limit)
        
        if all_data is None or len(all_data) < backtest_limit * 0.9:  # Tolleriamo alcuni dati mancanti
            return {"symbol": symbol, "success": False, "error": "Dati insufficienti per backtest"}
        
        # Dividiamo i dati in periodi di training, testing e verifica
        results = []
        
        # Creiamo diversi periodi di backtest
        for i in range(lookback_days):
            # Dati di training: una finestra che termina lookback_days - i giorni fa
            train_end_idx = len(all_data) - prediction_days - i
            train_data = all_data.iloc[:train_end_idx].copy()
            
            # Dati di verifica: i giorni successivi al training
            verify_data = all_data.iloc[train_end_idx:train_end_idx + prediction_days].copy()
            
            if train_data.empty or verify_data.empty:
                continue
                
            # Calcola indicatori e fa previsione
            train_data = calculate_indicators_bot1(train_data)
            if train_data.empty:
                continue
                
            try:
                # Previsione
                forecast = train_and_forecast_bot1(train_data)
                forecast_mean = forecast.mean()
                
                # Risultati reali
                real_future_price = verify_data['close'].iloc[-1]
                forecast_change = (forecast_mean - train_data['close'].iloc[-1]) / train_data['close'].iloc[-1]
                real_change = (real_future_price - train_data['close'].iloc[-1]) / train_data['close'].iloc[-1]
                
                # Determina se la previsione era nella direzione corretta
                correct_direction = (forecast_change > 0 and real_change > 0) or (forecast_change < 0 and real_change < 0)
                
                # Error margin
                error_pct = abs(forecast_change - real_change) * 100
                
                results.append({
                    "period": i,
                    "forecast_change_pct": forecast_change * 100,
                    "real_change_pct": real_change * 100,
                    "correct_direction": correct_direction,
                    "error_margin_pct": error_pct
                })
            except Exception as e:
                print(f"Errore durante il backtest per il periodo {i}: {e}")
                continue
        
        # Calcola le metriche di precisione
        if not results:
            return {"symbol": symbol, "success": False, "error": "Nessun risultato valido nel backtest"}
        
        direction_accuracy = sum(1 for r in results if r["correct_direction"]) / len(results) * 100
        avg_error = sum(r["error_margin_pct"] for r in results) / len(results)
        
        return {
            "symbol": symbol,
            "success": True,
            "direction_accuracy": direction_accuracy,
            "avg_error_pct": avg_error,
            "periods_tested": len(results),
            "detailed_results": results
        }
    
    except Exception as e:
        print(f"Errore eseguendo backtest per {symbol}: {e}")
        return {"symbol": symbol, "success": False, "error": str(e)}

def cross_validate_model(data, features, target, k=5):
    """
    Esegue k-fold cross-validation sul modello di previsione.
    """
    try:
        if len(data) < k * 2:
            print("Dati insufficienti per cross-validation significativa")
            return None
            
        # Prepara i dati per validation
        X = data[features].values
        y = target.values
        
        # Inizializza KFold
        kf = KFold(n_splits=k, shuffle=True, random_state=42)
        
        # Inizializza metriche
        scores = {
            'mse': [],
            'rmse': [],
            'mae': [],
            'r2': [],
            'direction_accuracy': []
        }
        
        # Esegui validation
        for train_idx, test_idx in kf.split(X):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            
            # Standardizza i dati
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Addestra modello
            model = GradientBoostingRegressor(
                n_estimators=100, 
                learning_rate=0.05, 
                max_depth=4, 
                random_state=42
            )
            
            model.fit(X_train_scaled, y_train)
            
            # Fai previsioni
            y_pred = model.predict(X_test_scaled)
            
            # Calcola metriche
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Direction accuracy (importante per trading)
            actual_direction = np.sign(y_test)
            predicted_direction = np.sign(y_pred)
            direction_acc = np.mean(actual_direction == predicted_direction) * 100
            
            # Aggiungi metriche
            scores['mse'].append(mse)
            scores['rmse'].append(rmse)
            scores['mae'].append(mae)
            scores['r2'].append(r2)
            scores['direction_accuracy'].append(direction_acc)
        
        # Calcola medie
        avg_scores = {metric: np.mean(values) for metric, values in scores.items()}
        std_scores = {metric: np.std(values) for metric, values in scores.items()}
        
        return {
            'avg_scores': avg_scores,
            'std_scores': std_scores,
            'raw_scores': scores,
            'k_folds': k
        }
    
    except Exception as e:
        print(f"Errore durante cross-validation: {e}")
        return None

def ensure_python_types(obj):
    """Converte tipi NumPy in tipi Python nativi per compatibilità JSON"""
    if isinstance(obj, dict):
        return {key: ensure_python_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [ensure_python_types(item) for item in obj]
    elif isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64, 
                          np.uint8, np.uint16, np.uint32, np.uint64)):
        return int(obj)
    elif isinstance(obj, (np.float64, np.float16, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return ensure_python_types(obj.tolist())
    return obj

def cache_model(model, symbol, type="bot1", features=None):
    try:
        joblib.dump(model, f'model_cache/{symbol.replace("/", "_")}_{type}.joblib')
        
        # Salva anche le features utilizzate
        if features:
            import json
            with open(f'model_cache/{symbol.replace("/", "_")}_{type}_meta.json', 'w') as f:
                json.dump({'features': features}, f)
        
        return True
    except Exception as e:
        print(f"Error caching model for {symbol}: {e}")
        return False

def load_cached_model(symbol, type="bot1"):
    try:
        model_path = f'model_cache/{symbol.replace("/", "_")}_{type}.joblib'
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            
            # Verifica se esiste anche il file di metadati
            metadata_path = f'model_cache/{symbol.replace("/", "_")}_{type}_meta.json'
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                return model, metadata.get('features', [])
            return model, []  # Ritorna il modello ma senza informazioni sulle features
        return None, []
    except Exception as e:
        print(f"Error loading cached model for {symbol}: {e}")
        return None, []


# Bot 1 (Market Analysis) Functions - Migliorate
def calculate_indicators_bot1(data):
    # Aggiungiamo indicatori più sofisticati
    try:
        # RSI e MACD di base
        data['RSI'] = calculate_rsi(data)
        data['MACD'], data['Signal_Line'] = calculate_macd(data)
        data['MACD_hist'] = data['MACD'] - data['Signal_Line']
        
        # Indicatori di volatilità
        data['ATR'] = calculate_atr(data)
        data['Volatility'] = calculate_volatility(data)
        data['NATR'] = data['ATR'] / data['close'] * 100  # ATR normalizzato
        
        # Indicatori di momentum
        data['MOM'] = data['close'].diff(10)
        data['ROC'] = data['close'].pct_change(10) * 100
        
        # Indicatori di trend
        data['ADX'] = calculate_adx(data)
        
        # Calcolo delle direzioni (DI+ e DI-)
        df = data.copy()
        period = 14
        df['TR'] = np.maximum(df['high'] - df['low'], 
                            np.maximum(abs(df['high'] - df['close'].shift(1)), 
                                        abs(df['low'] - df['close'].shift(1))))
        df['DM+'] = np.where((df['high'] - df['high'].shift(1)) > (df['low'].shift(1) - df['low']), 
                            df['high'] - df['high'].shift(1), 0)
        df['DM-'] = np.where((df['low'].shift(1) - df['low']) > (df['high'] - df['high'].shift(1)), 
                            df['low'].shift(1) - df['low'], 0)
        tr_rolling = df['TR'].rolling(window=period).sum()
        dm_plus_rolling = df['DM+'].rolling(window=period).sum()
        dm_minus_rolling = df['DM-'].rolling(window=period).sum()
        data['PLUS_DI'] = 100 * (dm_plus_rolling / tr_rolling)
        data['MINUS_DI'] = 100 * (dm_minus_rolling / tr_rolling)
        
        # Medie Mobili
        data['EMA_9'] = data['close'].ewm(span=9).mean()
        data['EMA_21'] = data['close'].ewm(span=21).mean()
        data['EMA_50'] = data['close'].ewm(span=50).mean()
        data['EMA_200'] = data['close'].ewm(span=200).mean()
        
        # Indicatori di volume
        data['OBV'] = (np.sign(data['close'].diff()) * data['volume']).fillna(0).cumsum()
        
        # Bande di Bollinger
        data['BB_upper'], data['BB_lower'] = calculate_bollinger_bands(data)
        data['BB_middle'] = data['close'].rolling(window=20).mean()
        
        # Calcolo di trend change (cambio di direzione)
        data['Trend_Change'] = ((data['close'] > data['EMA_50']) & 
                              (data['close'].shift(1) <= data['EMA_50'].shift(1))).astype(int) - \
                             ((data['close'] < data['EMA_50']) & 
                              (data['close'].shift(1) >= data['EMA_50'].shift(1))).astype(int)
        
        # Feature engineered (combinazioni di indicatori)
        data['RSI_change'] = data['RSI'] - data['RSI'].shift(1)
        data['Price_to_EMA50'] = data['close'] / data['EMA_50']
        data['EMA_ratio'] = data['EMA_9'] / data['EMA_21']
        
        return data.dropna()
    except Exception as e:
        print(f"Error calculating indicators: {e}")
        # Fallback al metodo originale
        data['RSI'] = calculate_rsi(data)
        data['MACD'], data['Signal_Line'] = calculate_macd(data)
        data['ATR'] = calculate_atr(data)
        data['Volatility'] = calculate_volatility(data)
        data['EMA_50'] = data['close'].ewm(span=50).mean()
        data['EMA_200'] = data['close'].ewm(span=200).mean()
        return data.dropna()

def train_and_forecast_bot1(data, symbol=None, perform_cv=False):
    try:
        # Selezioniamo le features disponibili nei dati attuali
        possible_features = [
            'RSI', 'MACD', 'MACD_hist', 'Signal_Line', 'ATR', 'Volatility', 'NATR', 
            'MOM', 'ROC', 'ADX', 'PLUS_DI', 'MINUS_DI', 'OBV', 
            'BB_upper', 'BB_lower', 'Price_to_EMA50', 'EMA_ratio'
        ]
        
        available_features = [f for f in possible_features if f in data.columns]
        
        # Verifica se esiste un modello in cache
        use_cached = False
        if symbol:
            try:
                # Qui è il cambiamento principale: ora gestiamo una tupla
                cached_result = load_cached_model(symbol, "bot1")
                if cached_result and cached_result[0]:  # Se abbiamo un modello
                    cached_model, cached_features = cached_result
                    print(f"Using cached model for {symbol}")
                    
                    # Prepariamo i dati per la previsione
                    features_to_use = available_features
                    if cached_features and len(cached_features) > 0:
                        # Se abbiamo features salvate, usiamo quelle
                        features_to_use = [f for f in cached_features if f in data.columns]
                    
                    # Verifichiamo se abbiamo tutte le features necessarie
                    if len(features_to_use) > 0:
                        latest_features = data[features_to_use].values[-48:]
                        return cached_model.predict(latest_features)
                    else:
                        print(f"Not enough features available for cached model, retraining")
            except Exception as cache_err:
                print(f"Cache error: {cache_err}")
                
        
        # Se siamo qui, o non abbiamo trovato una cache o non è compatibile
        # Procediamo con l'addestramento di un nuovo modello
        print(f"Training with features: {available_features}")
        
        X = data[available_features].values[:-1]
        y = data['close'].pct_change(1).shift(-1).iloc[:-1].values  # Prediciamo il cambio percentuale
        
        # Normalizziamo i dati per un training più efficiente
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Ensemble di modelli per maggiore robustezza
        model1 = RandomForestRegressor(
            n_estimators=100, 
            max_depth=10, 
            min_samples_split=5, 
            random_state=42, 
            n_jobs=1  # Ridotto a 1 per evitare problemi di multiprocessing su macOS
        )
        
        model2 = ExtraTreesRegressor(
            n_estimators=100, 
            max_depth=10, 
            min_samples_split=5, 
            random_state=43, 
            n_jobs=1  # Ridotto a 1 per evitare problemi di multiprocessing su macOS
        )
        
        model3 = GradientBoostingRegressor(
            n_estimators=100, 
            learning_rate=0.05, 
            max_depth=4, 
            random_state=44
        )
        
        # Training dei modelli
        model1.fit(X_scaled, y)
        model2.fit(X_scaled, y)
        model3.fit(X_scaled, y)
        
        # Prepariamo i dati per la previsione
        latest_features = data[available_features].values[-48:]  # Ultimi 48 punti
        latest_scaled = scaler.transform(latest_features)
        
        # Ensemble prediction (media delle previsioni)
        pred1 = model1.predict(latest_scaled)
        pred2 = model2.predict(latest_scaled)
        pred3 = model3.predict(latest_scaled)
        
        ensemble_pred = (pred1 + pred2 + pred3) / 3.0
        
        # Feature importance - utile per debug
        feature_importance = pd.DataFrame({
            'feature': available_features,
            'importance': model1.feature_importances_
        }).sort_values('importance', ascending=False)
        print("Top 5 features:", feature_importance.head(5).to_string())
        
        # Aggiungiamo validazione incrociata
        if perform_cv:
            cv_results = cross_validate_model(
                data=data, 
                features=available_features, 
                target=data['close'].pct_change(1).shift(-1).iloc[:-1], 
                k=5
            )
            
            if cv_results:
                print(f"Cross-Validation Results for {symbol}:")
                print(f"Direction Accuracy: {cv_results['avg_scores']['direction_accuracy']:.2f}%")
                print(f"RMSE: {cv_results['avg_scores']['rmse']:.6f}")
                
                # Salviamo i risultati CV insieme al modello
                if symbol:
                    # Nel meta file aggiungiamo i risultati
                    try:
                        meta_file = f'model_cache/{symbol.replace("/", "_")}_bot1_meta.json'
                        if os.path.exists(meta_file):
                            with open(meta_file, 'r') as f:
                                meta_data = json.load(f)
                        else:
                            meta_data = {'features': available_features}
                        
                        meta_data['cv_results'] = cv_results['avg_scores']
                        meta_data['timestamp'] = datetime.now().isoformat()
                        
                        with open(meta_file, 'w') as f:
                            json.dump(meta_data, f)
                    except Exception as cv_save_err:
                        print(f"Error saving CV results: {cv_save_err}")
        
        # Cache del modello ensemble
        if symbol:
            try:
                # Salviamo un modello più semplice che utilizzi esattamente le stesse feature
                # Questo evita problemi se in futuro il set di feature cambia
                ensemble_model = GradientBoostingRegressor(
                    n_estimators=100,
                    learning_rate=0.05,
                    max_depth=4,
                    random_state=42
                )
                ensemble_model.fit(X_scaled, y)
                
                # Salviamo anche le feature utilizzate in un file metadata separato
                import json
                os.makedirs('model_cache', exist_ok=True)
                cache_file = f'model_cache/{symbol.replace("/", "_")}_bot1.joblib'
                meta_file = f'model_cache/{symbol.replace("/", "_")}_bot1_meta.json'
                
                joblib.dump(ensemble_model, cache_file)
                with open(meta_file, 'w') as f:
                    json.dump({'features': available_features}, f)
                
                print(f"Model cached for {symbol} with {len(available_features)} features")
            except Exception as cache_err:
                print(f"Error caching model: {cache_err}")
        
        # Previsione di prezzo futuro (cambiamento percentuale)
        return data['close'].iloc[-1] * (1 + ensemble_pred)
    
    except Exception as e:
        print(f"Error in forecast model: {e}")
        print("Using enhanced fallback prediction model")
        
        # Scelta di indicatori più robusti ma comunque informativi
        fallback_features = [
            'RSI', 'MACD', 'Signal_Line', 'ATR', 'Volatility',
            'EMA_9', 'EMA_21', 'EMA_50', 'EMA_200', 'OBV'
        ]
        
        # Assicuriamoci che tutte le feature siano disponibili
        available_fallback = [f for f in fallback_features if f in data.columns]
        print(f"Fallback using features: {available_fallback}")
        
        # Preparazione dei dati
        X_fallback = data[available_fallback].values[:-1]
        y_fallback = data['close'].pct_change(1).shift(-1).iloc[:-1].values
        
        # Modello di fallback migliorato - più robusto ma ancora potente
        fallback_model = GradientBoostingRegressor(
            n_estimators=100,  # Ridotto per velocità
            learning_rate=0.05,
            max_depth=3,       # Ridotto per evitare overfitting
            min_samples_split=5,
            random_state=42,
            subsample=0.8      # Aggiunto per stabilità
        )
        
        # Training
        fallback_model.fit(X_fallback, y_fallback)
        
        # Previsione
        future_features = data[available_fallback].values[-48:]
        predictions = fallback_model.predict(future_features)
        
        # Convertiamo in prezzo futuro
        return data['close'].iloc[-1] * (1 + predictions)

# Bot 2 (Trading Analysis) Functions
def calculate_indicators_bot2(data):
    """
    Calcola indicatori tecnici avanzati per il Bot 2.
    """
    try:
        # RSI e MACD di base
        data['RSI'] = calculate_rsi(data)
        data['MACD'], data['Signal_Line'] = calculate_macd(data)
        data['MACD_hist'] = data['MACD'] - data['Signal_Line']
        
        # Indicatori di volatilità
        data['ATR'] = calculate_atr(data)
        data['Volatility'] = calculate_volatility(data)
        data['NATR'] = data['ATR'] / data['close'] * 100  # ATR normalizzato
        
        # Indicatori di momentum
        data['MOM'] = data['close'].diff(10)
        data['ROC'] = data['close'].pct_change(10) * 100
        
        # Indicatori di trend
        data['ADX'] = calculate_adx(data)
        
        # Calcolo delle direzioni (DI+ e DI-)
        df = data.copy()
        period = 14
        df['TR'] = np.maximum(df['high'] - df['low'], 
                            np.maximum(abs(df['high'] - df['close'].shift(1)), 
                                      abs(df['low'] - df['close'].shift(1))))
        df['DM+'] = np.where((df['high'] - df['high'].shift(1)) > (df['low'].shift(1) - df['low']), 
                           df['high'] - df['high'].shift(1), 0)
        df['DM-'] = np.where((df['low'].shift(1) - df['low']) > (df['high'] - df['high'].shift(1)), 
                           df['low'].shift(1) - df['low'], 0)
        tr_rolling = df['TR'].rolling(window=period).sum()
        dm_plus_rolling = df['DM+'].rolling(window=period).sum()
        dm_minus_rolling = df['DM-'].rolling(window=period).sum()
        data['PLUS_DI'] = 100 * (dm_plus_rolling / tr_rolling)
        data['MINUS_DI'] = 100 * (dm_minus_rolling / tr_rolling)
        
        # Medie Mobili
        data['EMA_9'] = data['close'].ewm(span=9).mean()
        data['EMA_21'] = data['close'].ewm(span=21).mean()
        data['EMA_50'] = data['close'].ewm(span=50).mean()
        data['EMA_200'] = data['close'].ewm(span=200).mean()
        
        # Indicatori di volume
        data['OBV'] = (np.sign(data['close'].diff()) * data['volume']).fillna(0).cumsum()
        
        # Bande di Bollinger
        data['Bollinger_Upper'], data['Bollinger_Lower'] = calculate_bollinger_bands(data)
        data['Bollinger_Middle'] = data['close'].rolling(window=20).mean()
        data['BB_Width'] = (data['Bollinger_Upper'] - data['Bollinger_Lower']) / data['close']
        
        # Calcolo di trend change (cambio di direzione)
        data['Trend_Change'] = ((data['close'] > data['EMA_50']) & 
                              (data['close'].shift(1) <= data['EMA_50'].shift(1))).astype(int) - \
                             ((data['close'] < data['EMA_50']) & 
                              (data['close'].shift(1) >= data['EMA_50'].shift(1))).astype(int)
        
        # Feature engineered (combinazioni di indicatori)
        data['RSI_change'] = data['RSI'] - data['RSI'].shift(1)
        data['Price_to_EMA50'] = data['close'] / data['EMA_50']
        data['EMA_ratio'] = data['EMA_9'] / data['EMA_21']
        
        # Indicatori avanzati di oscillazione
        data['Stochastic_K'] = 100 * ((data['close'] - data['low'].rolling(window=14).min()) / 
                                      (data['high'].rolling(window=14).max() - 
                                       data['low'].rolling(window=14).min()))
        data['Stochastic_D'] = data['Stochastic_K'].rolling(window=3).mean()
        
        # Chaikin Money Flow (CMF)
        data['MF_Multiplier'] = ((data['close'] - data['low']) - (data['high'] - data['close'])) / (data['high'] - data['low'])
        data['MF_Volume'] = data['MF_Multiplier'] * data['volume']
        data['CMF'] = data['MF_Volume'].rolling(window=20).sum() / data['volume'].rolling(window=20).sum()
        
        return data.dropna()
    except Exception as e:
        print(f"Error calculating bot2 indicators: {e}")
        # Fallback al metodo originale in caso di errore
        data['RSI'] = calculate_rsi(data)
        data['EMA_9'] = data['close'].ewm(span=9).mean()
        data['EMA_21'] = data['close'].ewm(span=21).mean()
        data['MACD'], data['Signal_Line'] = calculate_macd(data)
        data['ADX'] = calculate_adx(data)
        data['Bollinger_Upper'], data['Bollinger_Lower'] = calculate_bollinger_bands(data)
        return data.dropna()

def forecast_prices_bot2(data, forecast_days, symbol=None):
    """
    Predice i prezzi futuri utilizzando un ensemble di modelli avanzato.
    """
    try:
        # Verifica se esiste un modello in cache
        if symbol:
            cached_result = load_cached_model(symbol, "bot2")
            if cached_result and cached_result[0]:  # Se abbiamo un modello
                cached_model, cached_features = cached_result
                print(f"Using cached model for {symbol} (bot2)")
                
                # Prepariamo i dati per la previsione
                features_to_use = cached_features if cached_features else get_default_bot2_features()
                available_features = [f for f in features_to_use if f in data.columns]
                
                if len(available_features) > 0:
                    latest_features = data[available_features].values[-forecast_days:]
                    
                    # Normalizzazione
                    scaler = StandardScaler()
                    historical_data = data[available_features].values[:-forecast_days]
                    scaler.fit(historical_data)
                    latest_scaled = scaler.transform(latest_features)
                    
                    return cached_model.predict(latest_scaled)
                else:
                    print(f"Not enough features for cached model, retraining {symbol}")
        
        # Se siamo qui, o non abbiamo trovato cache o non è compatibile
        # Selezioniamo le features disponibili nei dati
        possible_features = [
            'RSI', 'MACD', 'MACD_hist', 'Signal_Line', 'ATR', 'Volatility', 'NATR',
            'MOM', 'ROC', 'ADX', 'PLUS_DI', 'MINUS_DI', 'OBV', 'EMA_9', 'EMA_21',
            'EMA_50', 'EMA_200', 'Bollinger_Upper', 'Bollinger_Lower', 'Bollinger_Middle',
            'BB_Width', 'RSI_change', 'Price_to_EMA50', 'EMA_ratio', 'Trend_Change',
            'Stochastic_K', 'Stochastic_D', 'CMF'
        ]
        
        available_features = [f for f in possible_features if f in data.columns]
        print(f"Bot2 training with {len(available_features)} features")
        
        X = data[available_features].values[:-1]
        y = data['close'].shift(-1).iloc[:-1].values  # Prediciamo il prezzo diretto
        
        # Normalizzazione dei dati
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Ensemble di modelli per maggiore robustezza
        model1 = RandomForestRegressor(
            n_estimators=100, 
            max_depth=10, 
            min_samples_split=5, 
            random_state=42, 
            n_jobs=1  # Ridotto per evitare problemi di multiprocessing
        )
        
        model2 = ExtraTreesRegressor(
            n_estimators=100, 
            max_depth=10, 
            min_samples_split=5, 
            random_state=43, 
            n_jobs=1  # Ridotto per evitare problemi di multiprocessing
        )
        
        model3 = GradientBoostingRegressor(
            n_estimators=200, 
            learning_rate=0.05, 
            max_depth=5, 
            min_samples_split=5,
            random_state=44
        )
        
        # Training dei modelli
        model1.fit(X_scaled, y)
        model2.fit(X_scaled, y)
        model3.fit(X_scaled, y)
        
        # Feature importance - utile per debug
        feature_importance = pd.DataFrame({
            'feature': available_features,
            'importance': model1.feature_importances_
        }).sort_values('importance', ascending=False)
        print(f"Bot2 Top 5 features: {feature_importance.head(5).to_string()}")
        
        # Preparazione dati per previsione futura
        future_features = data[available_features].values[-forecast_days:]
        future_scaled = scaler.transform(future_features)
        
        # Ensemble prediction (media ponderata delle previsioni)
        pred1 = model1.predict(future_scaled)
        pred2 = model2.predict(future_scaled)
        pred3 = model3.predict(future_scaled)
        
        # Pesi definiti in base alla loro performance empirica
        weights = [0.3, 0.2, 0.5]  # Dando maggior peso a GradientBoosting
        ensemble_pred = (pred1 * weights[0] + pred2 * weights[1] + pred3 * weights[2])
        
        # Cache del modello ensemble
        if symbol:
            try:
                # Salviamo un modello ottimizzato per la cache
                ensemble_model = GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.05,
                    max_depth=5,
                    random_state=42
                )
                ensemble_model.fit(X_scaled, y)
                
                cache_model(ensemble_model, symbol, "bot2", available_features)
                print(f"Bot2 model cached for {symbol} with {len(available_features)} features")
            except Exception as cache_err:
                print(f"Error caching Bot2 model: {cache_err}")
        
        return ensemble_pred
        
    except Exception as e:
        print(f"Error in bot2 forecast model: {e}")
        
        # Fallback migliorato in caso di errore
        try:
            print("Using enhanced fallback for Bot2")
            fallback_features = ['RSI', 'EMA_9', 'EMA_21', 'MACD', 'Signal_Line', 'ADX']
            available_fallback = [f for f in fallback_features if f in data.columns]
            
            if len(available_fallback) < 3:
                # Se troppo poche feature sono disponibili, usa approccio semplicistico
                return data['close'].iloc[-1] * np.ones(forecast_days) * 1.001  # Leggero trend positivo come default
            
            model = GradientBoostingRegressor(
                n_estimators=100, 
                learning_rate=0.05, 
                max_depth=3, 
                random_state=42,
                subsample=0.8  # Aggiunto per maggiore stabilità
            )
            
            X = data[available_fallback].values[:-1]
            y = data['close'].shift(-1).iloc[:-1].values
            model.fit(X, y)
            
            future_features = data[available_fallback].values[-forecast_days:]
            return model.predict(future_features)
        except Exception as fallback_err:
            print(f"Critical error in bot2 forecast fallback: {fallback_err}")
            # Ritorna ultima chiusura ripetuta come ultima risorsa
            return data['close'].iloc[-1] * np.ones(forecast_days)

def get_default_bot2_features():
    """Helper function per ottenere le feature di default per Bot2."""
    return [
        'RSI', 'MACD', 'Signal_Line', 'ATR', 'EMA_9', 'EMA_21', 
        'ADX', 'Bollinger_Upper', 'Bollinger_Lower'
    ]
def validate_bot2_model(data, symbol):
    """
    Esegue cross-validation per il modello Bot 2.
    """
    possible_features = [
        'RSI', 'MACD', 'MACD_hist', 'Signal_Line', 'ATR', 'Volatility', 'NATR',
        'MOM', 'ROC', 'ADX', 'PLUS_DI', 'MINUS_DI', 'OBV', 'EMA_9', 'EMA_21',
        'EMA_50', 'EMA_200', 'Bollinger_Upper', 'Bollinger_Lower', 'Bollinger_Middle',
        'BB_Width', 'RSI_change', 'Price_to_EMA50', 'EMA_ratio', 'Trend_Change',
        'Stochastic_K', 'Stochastic_D', 'CMF'
    ]
    
    available_features = [f for f in possible_features if f in data.columns]
    
    # Preparazione target - variazione percentuale del prezzo
    target = data['close'].pct_change(1).shift(-1).dropna()
    
    # Assicuriamoci che le features abbiano lo stesso numero di righe del target
    feature_data = data[available_features].iloc[:len(target)]
    
    cv_results = cross_validate_model(
        data=feature_data,
        features=available_features,
        target=target,
        k=5
    )
    
    if cv_results:
        # Salviamo i risultati nei metadati del modello
        meta_file = f'model_cache/{symbol.replace("/", "_")}_bot2_meta.json'
        if os.path.exists(meta_file):
            with open(meta_file, 'r') as f:
                meta_data = json.load(f)
        else:
            meta_data = {'features': available_features}
        
        meta_data['cv_results'] = cv_results['avg_scores']
        meta_data['timestamp'] = datetime.now().isoformat()
        
        with open(meta_file, 'w') as f:
            json.dump(meta_data, f)
        
        print(f"Bot2 CV Results for {symbol}:")
        print(f"Direction Accuracy: {cv_results['avg_scores']['direction_accuracy']:.2f}%")
        print(f"RMSE: {cv_results['avg_scores']['rmse']:.6f}")
    
    return cv_results
def detect_candlestick_patterns(data):
    """
    Rileva pattern candlestick avanzati per il Bot 2.
    """
    if len(data) < 5:
        return {}
    
    patterns = {}
    
    # Doji (corpo molto piccolo)
    latest = data.iloc[-1]
    body_size = abs(latest['close'] - latest['open'])
    total_range = latest['high'] - latest['low']
    if total_range > 0 and body_size <= 0.1 * total_range:
        patterns['doji'] = True
    else:
        patterns['doji'] = False
        
    # Hammer (corpo piccolo in alto, ombra lunga in basso)
    if latest['close'] > latest['open']:  # Candela verde
        upper_shadow = latest['high'] - latest['close']
        lower_shadow = latest['open'] - latest['low']
    else:  # Candela rossa
        upper_shadow = latest['high'] - latest['open']
        lower_shadow = latest['close'] - latest['low']
    
    if total_range > 0 and lower_shadow >= 2 * body_size and upper_shadow <= 0.1 * total_range:
        patterns['hammer'] = True
    else:
        patterns['hammer'] = False
        
    # Shooting Star (corpo piccolo in basso, ombra lunga in alto)
    if total_range > 0 and upper_shadow >= 2 * body_size and lower_shadow <= 0.1 * total_range:
        patterns['shooting_star'] = True
    else:
        patterns['shooting_star'] = False
        
    # Bullish Engulfing (seconda candela verde ingloba prima candela rossa)
    if len(data) >= 2:
        prev = data.iloc[-2]
        curr = data.iloc[-1]
        if (prev['close'] < prev['open'] and  # Prima candela rossa
            curr['close'] > curr['open'] and  # Seconda candela verde
            curr['open'] < prev['close'] and  # Apertura sotto chiusura precedente
            curr['close'] > prev['open']):    # Chiusura sopra apertura precedente
            patterns['bullish_engulfing'] = True
        else:
            patterns['bullish_engulfing'] = False
            
    # Bearish Engulfing (seconda candela rossa ingloba prima candela verde)
    if len(data) >= 2:
        prev = data.iloc[-2]
        curr = data.iloc[-1]
        if (prev['close'] > prev['open'] and  # Prima candela verde
            curr['close'] < curr['open'] and  # Seconda candela rossa
            curr['open'] > prev['close'] and  # Apertura sopra chiusura precedente
            curr['close'] < prev['open']):    # Chiusura sotto apertura precedente
            patterns['bearish_engulfing'] = True
        else:
            patterns['bearish_engulfing'] = False
    
    return patterns

def fetch_news_and_sentiment(symbol, news_limit):
    try:
        crypto_name = symbol.split('/')[0]
        url = f"https://newsapi.org/v2/everything?q={crypto_name}&language=en&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        articles = response.json().get("articles", [])
        if not articles:
            return 0
        limit = min(news_limit, len(articles))
        sentiment_score = sum(TextBlob(re.sub(r'[^a-zA-Z\s]', '', article['title'])).sentiment.polarity
                              for article in articles[:limit]) / limit
        return sentiment_score
    except Exception as e:
        print(f"Error fetching news: {e}")
        return 0

# Funzione per analizzare un asset in parallelo con filtri di qualità
def analyze_asset_parallel(symbol, forecast_threshold, include_negative, quality_filter=True):
    """
    Analizza un asset in parallelo con filtri di qualità.
    """
    try:
        print(f"Processing {symbol}...")
        data = fetch_market_data(symbol)
        if data is None or data.empty:
            print(f"No data for {symbol}")
            return None

        data = calculate_indicators_bot1(data)
        if data.empty:
            print(f"No indicators for {symbol}")
            return None
        
        # Variabili per filtri di qualità
        has_adx_trend = False
        has_rsi_signal = False
        has_volume_signal = False
        quality_score = 0
        
        # Applicazione dei filtri di qualità
        if quality_filter:
            # Controlla se l'ADX è significativo (trend confermato)
            has_adx_trend = 'ADX' in data.columns and data['ADX'].iloc[-1] > 20
            
            # Controlla se RSI è in zona significativa
            has_rsi_signal = 'RSI' in data.columns and (data['RSI'].iloc[-1] < 30 or data['RSI'].iloc[-1] > 70)
            
            # Controlla volume significativo rispetto alla media
            if not data['volume'].empty and len(data) > 10:
                recent_volume = data['volume'].iloc[-5:].mean()
                volume_history = data['volume'].iloc[:-5].mean()
                has_volume_signal = recent_volume > volume_history * 1.2  # 20% sopra la media
            
            # Se nessuno dei filtri di qualità passa, ignora questo asset
            quality_score = sum([has_adx_trend, has_rsi_signal, has_volume_signal])
            
            # Ignora asset con bassa qualità (meno di 1 filtro superato)
            if quality_score < 1:
                print(f"Asset {symbol} non supera i filtri di qualità")
                return None
        
        forecast = train_and_forecast_bot1(data, symbol)
        forecast_change = (forecast.mean() - data['close'].iloc[-1]) / data['close'].iloc[-1]
        
        # Include asset se è sopra la soglia positiva O se include_negative è true e il trend è negativo
        if forecast_change > forecast_threshold or (include_negative and forecast_change < -forecast_threshold):
            # Aggiunti più indicatori nei risultati
            asset_details = {
                'symbol': symbol,
                'currentPrice': round(data['close'].iloc[-1], 8),
                'forecastChange': round(forecast_change * 100, 2),
                'trend': "Positivo" if forecast_change > 0 else "Negativo",
                'rsi': round(data['RSI'].iloc[-1], 2) if 'RSI' in data else None,
                'adx': round(data['ADX'].iloc[-1], 2) if 'ADX' in data else None,
                'volume': round(data['volume'].iloc[-1], 2),
                'volatility': round(data['NATR'].iloc[-1], 2) if 'NATR' in data else None,
                # Aggiungiamo punteggio filtri di qualità e segnali specifici
                'qualityScore': quality_score if quality_filter else None,
                'hasAdxTrend': has_adx_trend if quality_filter else None,
                'hasRsiSignal': has_rsi_signal if quality_filter else None,
                'hasVolumeSignal': has_volume_signal if quality_filter else None,
            }
            return asset_details
        return None
    except Exception as e:
        print(f"Error analyzing {symbol}: {e}")
        return None

@app.route('/api/market-analysis', methods=['POST'])
def market_analysis():
    print("Received market analysis request")
    data = request.json
    print(f"Request data: {data}")

    top_assets = int(data.get('top_assets', DEFAULT_TOP_ASSETS))
    forecast_threshold = float(data.get('forecast_threshold', DEFAULT_FORECAST_THRESHOLD))
    include_negative = data.get('include_negative', False)  # Nuovo parametro
    quality_filter = data.get('quality_filter', True)  # Nuovo parametro
    
    assets = fetch_market_assets()[:top_assets]
    print(f"Fetched {len(assets)} assets")

    results = []
    
    # Utilizziamo il parallelismo per aumentare la velocità
    max_workers = min(NUM_CORES, 8)
    print(f"Using {max_workers} threads for parallel processing")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(analyze_asset_parallel, symbol, forecast_threshold, include_negative, quality_filter): symbol for symbol in assets}
        
        for i, future in enumerate(as_completed(futures)):
            result = future.result()
            if result:
                results.append(result)
            
            if (i + 1) % 5 == 0 or (i + 1) == len(assets):
                print(f"Processed {i + 1}/{len(assets)} assets")
            
    print(f"Returning {len(results)} results")
    response_data = {
        'assets': results,
        'stats': {
            'positive': sum(1 for asset in results if asset['trend'] == 'Positivo'),
            'negative': sum(1 for asset in results if asset['trend'] == 'Negativo'),
            'highQuality': sum(1 for asset in results if asset.get('qualityScore', 0) > 1)
        }
    }
    # Converte tipi NumPy prima della serializzazione
    return jsonify(ensure_python_types(response_data))
    

@app.route('/api/backtest', methods=['POST'])
def run_backtest():
    """API endpoint per eseguire backtest su un asset specifico"""
    data = request.json
    symbol = data.get('symbol', '')
    
    # Assicura che il simbolo sia nel formato corretto
    if not symbol:
        return jsonify({'error': 'Simbolo asset non specificato'}), 400
    
    # Formatta il simbolo correttamente
    symbol = symbol.upper()
    if not '/' in symbol:
        symbol = f"{symbol}/USDT"
        
    lookback_days = int(data.get('lookback_days', 30))
    prediction_days = int(data.get('prediction_days', 5))
    
    results = backtest_model(symbol, lookback_days, prediction_days)
    # Converte tipi NumPy prima della serializzazione
    return jsonify(ensure_python_types(results))

@app.route('/api/trading-analysis', methods=['POST'])
def trading_analysis():
    data = request.json
    assets = data.get('assets', ['ETH/USDT', 'BTC/USDT'])
    total_budget = float(data.get('total_budget', 10.0))
    forecast_days = int(data.get('forecast_days', DEFAULT_FORECAST_DAYS))
    news_articles_limit = int(data.get('news_articles_limit', DEFAULT_NEWS_LIMIT))
    stop_loss_percentage = DEFAULT_STOP_LOSS
    take_profit_percentage = DEFAULT_TAKE_PROFIT
    risk_reward_ratio = 2.0  # Rapporto rischio/rendimento ottimale
    
    results = []
    total_weight = 0
    weights = []
    analyzed_patterns = {}
    
    # Phase 1: Calculate weights and analyze patterns
    for i, symbol in enumerate(assets):
        market_data = fetch_market_data(symbol, timeframe='1d', limit=200)
        if market_data is None or market_data.empty:
            weights.append(0)
            analyzed_patterns[i] = {}
            continue
            
        market_data = calculate_indicators_bot2(market_data)
        forecast = forecast_prices_bot2(market_data, forecast_days, symbol)
        sentiment_score = fetch_news_and_sentiment(symbol, news_articles_limit)
        
        # Rilevazione pattern candlestick
        analyzed_patterns[i] = detect_candlestick_patterns(market_data)
        
        # Calcolo peso con nuovi fattori
        forecast_gain = (forecast.mean() - market_data['close'].iloc[-1]) / market_data['close'].iloc[-1]
        
        # Ponderazione avanzata includendo più indicatori
        adx_factor = min(market_data['ADX'].iloc[-1] / 25, 1.5) if 'ADX' in market_data else 1.0
        trend_factor = 1.2 if market_data['EMA_9'].iloc[-1] > market_data['EMA_21'].iloc[-1] else 0.8 if 'EMA_9' in market_data and 'EMA_21' in market_data else 1.0
        
        # Bonus per pattern candlestick confermati
        pattern_bonus = 0
        if analyzed_patterns[i].get('bullish_engulfing', False) and forecast_gain > 0:
            pattern_bonus += 0.2
        if analyzed_patterns[i].get('hammer', False) and forecast_gain > 0:
            pattern_bonus += 0.15
        if analyzed_patterns[i].get('bearish_engulfing', False) and forecast_gain < 0:
            pattern_bonus += 0.2
        if analyzed_patterns[i].get('shooting_star', False) and forecast_gain < 0:
            pattern_bonus += 0.15
            
        # Calcolo peso finale
        weight = max(0.001, abs(forecast_gain) * adx_factor * trend_factor + 
                    max(sentiment_score * 0.5, 0) + pattern_bonus)
        
        weights.append(weight)
        if weight > 0:
            total_weight += weight
    
    # Phase 2: Analyze each asset with improved decision logic
    for i, symbol in enumerate(assets):
        market_data = fetch_market_data(symbol, timeframe='1d', limit=200)
        if market_data is None or market_data.empty:
            continue
            
        try:
            market_data = calculate_indicators_bot2(market_data)
            forecast = forecast_prices_bot2(market_data, forecast_days, symbol)
            sentiment_score = fetch_news_and_sentiment(symbol, news_articles_limit)
            current_price = market_data['close'].iloc[-1]
            forecast_gain = (forecast.mean() - current_price) / current_price
            if total_weight <= 0:
                total_weight = 1  # Evita divisione per zero
            normalized_weight = weights[i] / total_weight
            investment = normalized_weight * total_budget
            quantity = investment / current_price if current_price > 0 else 0
            
            # Stop loss dinamico basato su ATR
            atr_multiplier = 2.0
            if 'ATR' in market_data.columns:
                current_atr = market_data['ATR'].iloc[-1]
                dynamic_stop_loss = current_price - (current_atr * atr_multiplier)
                dynamic_take_profit = current_price + (current_atr * atr_multiplier * risk_reward_ratio)
                
                # Scegli il valore più conservativo tra stop loss statico e dinamico
                stop_loss_level = max(dynamic_stop_loss, current_price * (1 + stop_loss_percentage))
                take_profit_level = min(dynamic_take_profit, current_price * (1 + take_profit_percentage))
            else:
                # Fallback ai calcoli percentuali standard
                stop_loss_level = current_price * (1 + stop_loss_percentage)
                take_profit_level = current_price * (1 + take_profit_percentage)
            
            # Decision making migliorato con pattern e indicatori multipli
            if forecast_gain > take_profit_percentage and market_data['ADX'].iloc[-1] > 25:
                # Verifica anche i pattern candlestick
                pattern_confirmation = False
                if analyzed_patterns.get(i, {}).get('bullish_engulfing', False):
                    pattern_confirmation = True
                if analyzed_patterns.get(i, {}).get('hammer', False):
                    pattern_confirmation = True
                    
                if pattern_confirmation:
                    decision = f"COMPRARE (LONG): Previsione positiva con conferma pattern. Target a {take_profit_level:.2f} USDT, Stop Loss a {stop_loss_level:.2f} USDT"
                else:
                    decision = f"COMPRARE (LONG): Previsione positiva. Target a {take_profit_level:.2f} USDT, Stop Loss a {stop_loss_level:.2f} USDT"
                    
            elif forecast_gain < stop_loss_percentage and market_data['ADX'].iloc[-1] > 25:
                # Verifica anche i pattern candlestick ribassisti
                pattern_confirmation = False
                if analyzed_patterns.get(i, {}).get('bearish_engulfing', False):
                    pattern_confirmation = True
                if analyzed_patterns.get(i, {}).get('shooting_star', False):
                    pattern_confirmation = True
                    
                if pattern_confirmation:
                    decision = f"VENDERE (SHORT): Perdita prevista con conferma pattern. Target a {current_price * (1 - take_profit_percentage):.2f} USDT, Stop Loss a {current_price * (1 - stop_loss_percentage):.2f} USDT"
                else:
                    decision = f"VENDERE (SHORT): Perdita prevista. Target a {current_price * (1 - take_profit_percentage):.2f} USDT, Stop Loss a {current_price * (1 - stop_loss_percentage):.2f} USDT"
            
            # Aggiungiamo ulteriori regole di trading basate su indicatori multipli
            elif market_data['RSI'].iloc[-1] > 70 and market_data['MACD'].iloc[-1] < market_data['Signal_Line'].iloc[-1]:
                decision = f"VENDERE (SHORT): RSI in ipercomprato ({market_data['RSI'].iloc[-1]:.2f}) e MACD in inversione."
            
            elif market_data['RSI'].iloc[-1] < 30 and market_data['MACD'].iloc[-1] > market_data['Signal_Line'].iloc[-1]:
                decision = f"COMPRARE (LONG): RSI in ipervenduto ({market_data['RSI'].iloc[-1]:.2f}) e MACD in inversione. Target a {take_profit_level:.2f} USDT, Stop Loss a {stop_loss_level:.2f} USDT"
            
            # Controllo divergenze
            elif 'MACD' in market_data.columns and 'RSI' in market_data.columns:
                # Divergenza rialzista: prezzo fa nuovi minimi ma RSI non segue
                price_making_lower_low = market_data['close'].iloc[-1] < market_data['close'].iloc[-2] and market_data['close'].iloc[-2] < market_data['close'].iloc[-3]
                rsi_not_making_lower_low = market_data['RSI'].iloc[-1] > market_data['RSI'].iloc[-2] and price_making_lower_low
                
                # Divergenza ribassista: prezzo fa nuovi massimi ma RSI non segue
                price_making_higher_high = market_data['close'].iloc[-1] > market_data['close'].iloc[-2] and market_data['close'].iloc[-2] > market_data['close'].iloc[-3]
                rsi_not_making_higher_high = market_data['RSI'].iloc[-1] < market_data['RSI'].iloc[-2] and price_making_higher_high
                
                if rsi_not_making_lower_low:
                    decision = f"COMPRARE (LONG): Divergenza RSI rialzista rilevata. Target a {take_profit_level:.2f} USDT, Stop Loss a {stop_loss_level:.2f} USDT"
                elif rsi_not_making_higher_high:
                    decision = f"VENDERE (SHORT): Divergenza RSI ribassista rilevata. Target a {current_price * (1 - take_profit_percentage):.2f} USDT, Stop Loss a {current_price * (1 - stop_loss_percentage):.2f} USDT"
                elif abs(forecast_gain) < 0.01 or sentiment_score == 0:
                    decision = "MANTENERE O MONITORARE: Nessun segnale chiaro."
                else:
                    decision = "MANTENERE O MONITORARE: Nessun segnale per cambiare posizione."
            else:
                decision = "MANTENERE O MONITORARE: Dati insufficienti per una decisione."
            
            # Creazione del risultato con campi aggiuntivi
            result = {
                'asset': symbol,
                'currentPrice': f"{current_price:.8f}",
                'forecastPrice': f"{forecast.mean():.8f}",
                'forecastGain': f"{forecast_gain:.4f}",
                'rsi': f"{market_data['RSI'].iloc[-1]:.2f}",
                'macd': f"{market_data['MACD'].iloc[-1]:.8f}",
                'adx': f"{market_data['ADX'].iloc[-1]:.2f}",
                'sentiment': f"{sentiment_score:.2f}",
                'weightAllocated': f"{normalized_weight:.2%}",
                'investmentAmount': f"{investment:.2f}",
                'quantityToBuy': f"{quantity:.8f}",
                'decision': decision,
                'stopLoss': f"{stop_loss_level:.4f}",
                'takeProfit': f"{take_profit_level:.4f}",
                'atr': f"{market_data['ATR'].iloc[-1]:.4f}" if 'ATR' in market_data.columns else "N/A",
                'patternDetected': any(analyzed_patterns.get(i, {}).values()),
                'patterns': analyzed_patterns.get(i, {})
            }
            
            results.append(result)
        except Exception as e:
            print(f"Error analyzing {symbol}: {e}")
            continue
    
    return jsonify({'assets': results})

@app.route('/api/available-assets', methods=['GET'])
def available_assets():
    assets = fetch_market_assets()
    return jsonify({'assets': assets})

@app.route('/api/historical-data', methods=['POST'])
def get_historical_data():
    data = request.json
    symbol = data.get('symbol', 'BTC/USDT')
    timeframe = data.get('timeframe', '1d')
    limit = data.get('limit', 30)
    
    ohlcv_data = fetch_market_data(symbol, timeframe, limit)
    
    if ohlcv_data is None:
        return jsonify({'error': 'Could not fetch historical data'}), 400
    
    # Converti il DataFrame in un formato adatto al JSON
    result = []
    for index, row in ohlcv_data.iterrows():
        result.append({
            'timestamp': row['timestamp'].isoformat(),
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close']),
            'volume': float(row['volume'])
        })
    
    return jsonify({'data': result})
@app.route('/api/backtest-bot2', methods=['POST'])
def run_backtest_bot2():
    """API endpoint per eseguire backtest specifico su Bot 2"""
    data = request.json
    symbol = data.get('symbol', '')
    
    # Assicura che il simbolo sia nel formato corretto
    if not symbol:
        return jsonify({'error': 'Simbolo asset non specificato'}), 400
    
    # Formatta il simbolo correttamente
    symbol = symbol.upper()
    if not '/' in symbol:
        symbol = f"{symbol}/USDT"
        
    lookback_days = int(data.get('lookback_days', 30))
    prediction_days = int(data.get('prediction_days', 5))
    
    try:
        # Otteniamo dati storici più ampi per il backtest
        backtest_limit = DEFAULT_LIMIT + lookback_days + prediction_days
        all_data = fetch_market_data(symbol, timeframe='1d', limit=backtest_limit)
        
        if all_data is None or len(all_data) < backtest_limit * 0.9:
            return jsonify({'error': 'Dati insufficienti per backtest Bot 2'}), 400
        
        results = []
        
        # Creiamo diversi periodi di backtest
        for i in range(lookback_days):
            # Dati di training: una finestra che termina lookback_days - i giorni fa
            train_end_idx = len(all_data) - prediction_days - i
            train_data = all_data.iloc[:train_end_idx].copy()
            
            # Dati di verifica: i giorni successivi al training
            verify_data = all_data.iloc[train_end_idx:train_end_idx + prediction_days].copy()
            
            if train_data.empty or verify_data.empty:
                continue
                
            # Calcola indicatori e fa previsione con Bot 2
            train_data = calculate_indicators_bot2(train_data)
            if train_data.empty:
                continue
            
            # Validazione del modello per questo periodo
            cv_results = validate_bot2_model(train_data, symbol)
            
            # Previsione e confronto con valori reali
            forecast = forecast_prices_bot2(train_data, prediction_days)
            forecast_mean = forecast.mean()
            
            real_future_price = verify_data['close'].iloc[-1]
            forecast_change = (forecast_mean - train_data['close'].iloc[-1]) / train_data['close'].iloc[-1]
            real_change = (real_future_price - train_data['close'].iloc[-1]) / train_data['close'].iloc[-1]
            
            correct_direction = (forecast_change > 0 and real_change > 0) or (forecast_change < 0 and real_change < 0)
            error_pct = abs(forecast_change - real_change) * 100
            
            # Analisi pattern nelle candele di verifica
            patterns = detect_candlestick_patterns(verify_data)
            pattern_detected = any(patterns.values())
            
            results.append({
                "period": i,
                "forecast_change_pct": forecast_change * 100,
                "real_change_pct": real_change * 100,
                "correct_direction": correct_direction,
                "error_margin_pct": error_pct,
                "pattern_detected": pattern_detected,
                "patterns": patterns,
                "direction_accuracy": cv_results['avg_scores']['direction_accuracy'] if cv_results else None
            })
        
        # Calcola le metriche di precisione
        if not results:
            return jsonify({'symbol': symbol, 'success': False, 'error': 'Nessun risultato valido nel backtest Bot 2'})
        
        direction_accuracy = sum(1 for r in results if r["correct_direction"]) / len(results) * 100
        avg_error = sum(r["error_margin_pct"] for r in results) / len(results)
        pattern_accuracy = sum(1 for r in results if r["pattern_detected"] and r["correct_direction"]) / max(1, sum(1 for r in results if r["pattern_detected"])) * 100
        
        return jsonify(ensure_python_types({
            "symbol": symbol,
            "success": True,
            "direction_accuracy": direction_accuracy,
            "pattern_accuracy": pattern_accuracy,
            "avg_error_pct": avg_error,
            "periods_tested": len(results),
            "detailed_results": results
        }))
    
    except Exception as e:
        print(f"Error running Bot 2 backtest for {symbol}: {e}")
        return jsonify({'symbol': symbol, 'success': False, 'error': str(e)})
    
@app.route('/api/cross-validate', methods=['POST'])
def run_cross_validation():
    """API endpoint per eseguire cross-validation su un asset specifico"""
    data = request.json
    symbol = data.get('symbol', '')
    
    # Assicura che il simbolo sia nel formato corretto
    if not symbol:
        return jsonify({'error': 'Simbolo asset non specificato'}), 400
    
    # Formatta il simbolo correttamente
    symbol = symbol.upper()
    if not '/' in symbol:
        symbol = f"{symbol}/USDT"
        
    k_folds = int(data.get('k_folds', 5))
    
    try:
        # Otteniamo i dati del mercato
        market_data = fetch_market_data(symbol, limit=500)
        if market_data is None or market_data.empty:
            return jsonify({'error': 'Dati insufficienti per validation'}), 400
            
        # Calcoliamo gli indicatori
        market_data = calculate_indicators_bot1(market_data)
        if market_data.empty:
            return jsonify({'error': 'Impossibile calcolare gli indicatori'}), 400
        
        # Selezioniamo le features
        possible_features = [
            'RSI', 'MACD', 'MACD_hist', 'Signal_Line', 'ATR', 'Volatility', 'NATR', 
            'MOM', 'ROC', 'ADX', 'PLUS_DI', 'MINUS_DI', 'OBV', 
            'BB_upper', 'BB_lower', 'Price_to_EMA50', 'EMA_ratio'
        ]
        
        available_features = [f for f in possible_features if f in market_data.columns]
        
        # Preparazione target - CORREZIONE QUI
        # Assicuriamoci che non ci siano problemi di indicizzazione
        target = market_data['close'].pct_change(1).shift(-1).dropna()
        
        # Assicuriamoci che le features abbiano lo stesso numero di righe del target
        feature_data = market_data[available_features].iloc[:len(target)]
        
        if len(feature_data) < k_folds * 2:
            return jsonify({'error': 'Dati insufficienti per eseguire una cross validation con {k_folds} fold'}), 400
        
        # Eseguiamo la cross-validation con i dati corretti
        cv_results = cross_validate_model(
            data=feature_data,
            features=available_features,
            target=target,
            k=k_folds
        )
        
        if cv_results:
            # Salviamo i risultati nei metadati del modello
            meta_file = f'model_cache/{symbol.replace("/", "_")}_bot1_meta.json'
            if os.path.exists(meta_file):
                with open(meta_file, 'r') as f:
                    meta_data = json.load(f)
            else:
                meta_data = {'features': available_features}
            
            meta_data['cv_results'] = cv_results['avg_scores']
            meta_data['timestamp'] = datetime.now().isoformat()
            
            with open(meta_file, 'w') as f:
                json.dump(meta_data, f)
            
            # Converte tipi NumPy prima della serializzazione
            return jsonify(ensure_python_types({
                'symbol': symbol,
                'success': True,
                'results': cv_results,
                'direction_accuracy': cv_results['avg_scores']['direction_accuracy'],
                'rmse': cv_results['avg_scores']['rmse']
            }))
        else:
            return jsonify({'error': 'Cross-validation fallita'}), 500
    
    except Exception as e:
        print(f"Error in cross-validation: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    app.run(debug=debug, port=port)