# Dockerfile dans ./Model
FROM python:3.8-slim

# Installer les dépendances requises
RUN pip install --no-cache-dir pandas scikit-learn numpy

# Créer le répertoire de travail
WORKDIR /app

# Copier les scripts et données d'entraînement
COPY ./training /app/training
COPY ./saved /app/saved

# Commande par défaut : peut être remplacée par la commande dans docker-compose.yml
CMD ["python", "/app/training/train_model.py"]
