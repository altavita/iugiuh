#!/bin/bash

echo "🚀 Avviando l'applicazione Trading Bot..."

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funzione per verificare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verifica dipendenze
echo -e "${BLUE}Verificando dipendenze...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python3 non trovato. Installalo prima di procedere.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ NPM non trovato. Installa Node.js prima di procedere.${NC}"
    exit 1
fi

# Backend setup
echo -e "\n${BLUE}Configurando il backend...${NC}"
cd backend

# Verifica ambiente virtuale
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creando ambiente virtuale...${NC}"
    python3 -m venv venv
fi

# Attiva ambiente virtuale
echo -e "${GREEN}Attivando ambiente virtuale...${NC}"
source venv/bin/activate

# Aggiorna pip
echo -e "${GREEN}Aggiornando pip...${NC}"
pip install --upgrade pip

# Installa/aggiorna dipendenze
echo -e "${GREEN}Installando dipendenze backend...${NC}"
pip install -r requirements.txt

# Avvia il backend
echo -e "${GREEN}Avviando il backend...${NC}"
python App.py &
BACKEND_PID=$!

# Frontend setup
cd ../frontend

# Verifica node_modules
if [ ! -d "node_modules" ]; then
    echo -e "\n${BLUE}Installando dipendenze frontend...${NC}"
    npm install
fi

# Ottimizza l'avvio del frontend
echo -e "\n${GREEN}Avviando il frontend in modalità ottimizzata...${NC}"

# Disabilita alcune features di sviluppo per velocizzare l'avvio
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export FAST_REFRESH=false

# Avvia il frontend
npm start &
FRONTEND_PID=$!

# Informazioni finali
echo -e "\n${GREEN}✅ Applicazione avviata!${NC}"
echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"
echo -e "\n${GREEN}📍 Accedi all'applicazione su: http://localhost:3000${NC}"
echo -e "${GREEN}📍 API Backend su: http://localhost:5000${NC}"

# Trap per gestire l'interruzione
trap "echo -e '\n${RED}Chiudendo applicazione...${NC}'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# Mantieni lo script in esecuzione
wait 