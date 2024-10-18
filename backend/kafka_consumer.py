from kafka import KafkaConsumer
import json

# Création du consommateur Kafka
consumer = KafkaConsumer(
    'asteroid_data',  # Nom du topic à écouter
    bootstrap_servers='kafka:9092',  # Serveur Kafka
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),  # Désérialisation JSON
    auto_offset_reset='earliest',  # Lire depuis le début si c’est un nouveau consommateur
    enable_auto_commit=True,  # Validation automatique des messages consommés
    group_id='my-group'  # Groupe du consommateur
)

# Boucle pour lire les messages
for message in consumer:
    print(f"Message reçu : {message.value}")
