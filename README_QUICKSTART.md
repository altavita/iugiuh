# 🚀 Real Trading Bot - Guida Rapida all'Avvio

## Problemi Risolti
✅ **Errore NumPy 2.0**: Risolto il problema di compatibilità con `np.float_`  
✅ **Performance Frontend**: Ottimizzato il caricamento di Spline con lazy loading  
✅ **Script di Avvio**: Creato script unificato per avviare backend e frontend  

## Avvio Rapido

### Metodo 1: Script Automatico (Consigliato)
```bash
./start-app.sh
```

### Metodo 2: Avvio Manuale

#### Backend:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python App.py
```
### se non dovesse funzionare ancora fai: 
```bash
./venv/bin/python App.py
```

#### Frontend (in un nuovo terminale):
```bash
cd frontend
npm install
npm start
```

## Ottimizzazioni Applicate

### Backend
- ✅ Compatibilità NumPy 2.0
- ✅ Versioni dipendenze fissate
- ✅ Multiprocessing ottimizzato per macOS

### Frontend
- ✅ Lazy loading per componenti Spline 3D
- ✅ Caricamento ritardato delle animazioni
- ✅ Ottimizzazioni build React

## Troubleshooting

### Problema: Il frontend è ancora lento
**Soluzione**: Pulisci la cache e reinstalla:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problema: Errori NumPy nel backend
**Soluzione**: Aggiorna l'ambiente virtuale:
```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Problema: Script non eseguibile
**Soluzione**: Dai i permessi:
```bash
chmod +x start-app.sh
```

## Performance Tips

1. **Disabilita animazioni Spline temporaneamente** durante lo sviluppo
2. **Usa Chrome DevTools** per identificare bottleneck
3. **Monitora la console** per errori JavaScript

## URLs Applicazione
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Comandi Utili

**Stop applicazione**: `Ctrl+C` nel terminale dello script

**Logs backend**: Controlla il terminale del backend per errori Python

**Logs frontend**: Apri la console del browser (F12)

---
💡 **Nota**: Il primo avvio potrebbe richiedere più tempo per installare le dipendenze. Gli avvii successivi saranno molto più veloci. 