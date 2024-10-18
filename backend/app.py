import json
import time
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from kafka import KafkaProducer, KafkaConsumer
from marshmallow import Schema, fields, ValidationError
from flask_cors import CORS
import random
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app, support_credentials=True) 
socketio = SocketIO(app, cors_allowed_origins="*")

producer = KafkaProducer(
    # print("Producer Kafka IIN")
    bootstrap_servers='kafka:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

consumer = KafkaConsumer(
    # print("Consumer Kafka IIN")
    'asteroid_data',
    bootstrap_servers='kafka:9092',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)


class AsteroidRequestSchema(Schema):
    num_asteroids = fields.Int(required=True)

asteroid_request_schema = AsteroidRequestSchema()

def generate_asteroid_data(request_id, asteroid_index, screen_width=1000, screen_height=1000):
    asteroid_data = {
        "id": f"asteroid_{request_id}_{asteroid_index:03d}",
        "position": {
            "x": round(random.uniform(-screen_width / 2, screen_width / 2), 2),
            "y": round(random.uniform(-screen_height / 2, screen_height / 2), 2),
            "z": 0, 
        },
        "velocity": {
            "vx": round(random.uniform(-50.0, 50.0), 2),
            "vy": round(random.uniform(-50.0, 50.0), 2),
            "vz": 0, 
        },
        "size": round(random.uniform(0.1, 10.0), 2),
        "mass": round(random.uniform(1e12, 1e15), 2),
        "last_time_looked": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    }
    return asteroid_data

@app.route('/generate_asteroids', methods=['POST'])
def create_asteroids():
    print("Enter in create_asteroids")
    json_data = request.get_json()

    if not json_data:
        return jsonify({"message": "No input data provided"}), 400

    try:
        data = asteroid_request_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422

    num_asteroids = data['num_asteroids']
    request_id = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')

    asteroid_list = []

    for asteroid_index in range(1, num_asteroids + 1):
        asteroid_data = generate_asteroid_data(request_id, asteroid_index)
        producer.send('asteroid_data', asteroid_data)
        asteroid_list.append(asteroid_data)

    producer.flush()

    return jsonify({
        "message": f"{num_asteroids} asteroids generated and sent to Kafka",
        "asteroids": asteroid_list
    }), 200

def consume_asteroids():
    print("Consommateur Kafka démarré")
    asteroids = {}

    try:
        for message in consumer:
            asteroid_data = message.value
            asteroid_id = asteroid_data["id"]
            print(f"Received asteroid data: {asteroid_data}")
            asteroids[asteroid_id] = asteroid_data

        while True:
            updated_asteroids = []
            for asteroid_id, asteroid in asteroids.items():
                time_step = 0.1 
                new_x = asteroid["position"]["x"] + asteroid["velocity"]["vx"] * time_step
                new_y = asteroid["position"]["y"] + asteroid["velocity"]["vy"] * time_step

                asteroid["position"]["x"] = new_x
                asteroid["position"]["y"] = new_y

                updated_asteroids.append(asteroid)

            # Envoyer les positions mises à jour à chaque cycle
            socketio.emit('asteroid_update', {"asteroids": updated_asteroids})
            time.sleep(0.5)

    except Exception as e:
        print(f"Erreur dans la consommation Kafka: {e}")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Backend running"}), 200

if __name__ == '__main__':
    print("Démarrage de l'application backend en arrière plan...")
    try:
        print("Appel direct de la fonction consume_asteroids...")
        socketio.start_background_task(consume_asteroids)  # Lancement de la tâche en arrière-plan
        # consume_asteroids()
        print("La fonction consume_asteroids a été appelée.")
    except Exception as e:
        print(f"Erreur lors du démarrage de la tâche consume_asteroids : {e}")
    
    socketio.run(app, host='0.0.0.0', port=5550)
