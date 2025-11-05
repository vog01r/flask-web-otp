#!/bin/bash
# Script de démarrage Web OTP

echo "🚀 Démarrage de Web OTP..."
echo ""

# Vérifier si le venv existe
if [ ! -d ".venv" ]; then
    echo "❌ Environnement virtuel non trouvé!"
    echo "   Exécute : python -m venv .venv"
    exit 1
fi

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant!"
    echo "   Exécute : cp .env.example .env"
    echo "   Puis édite .env avec tes valeurs"
    exit 1
fi

# Activer le venv
source .venv/bin/activate

# Charger les variables d'environnement
export $(grep -v '^#' .env | xargs)

echo "✓ Configuration chargée"
echo "✓ Mode DEBUG: $DEBUG"
echo "✓ Host: $HOST:$PORT"
echo ""
echo "👉 Accès: http://$HOST:$PORT/login"
echo ""

# Lancer l'app
python app.py
