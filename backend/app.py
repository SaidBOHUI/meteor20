from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from kafka import KafkaProducer, KafkaConsumer
from marshmallow import Schema, fields, ValidationError
from flask_cors import CORS
import json
import random
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app, support_credentials=True) 
# CORS(app, resources={r"/*": {"origins": "*"}})

socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Kafka Producer
producer = KafkaProducer(
    bootstrap_servers='kafka:9092',  # Kafka broker address
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Kafka Consumer: listens to asteroid_data topic
consumer = KafkaConsumer(
    'asteroid_data',
    bootstrap_servers='kafka:9092',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

# Schema to validate the asteroid generation request
class AsteroidRequestSchema(Schema):
    num_asteroids = fields.Int(required=True)

asteroid_request_schema = AsteroidRequestSchema()

# Function to generate random asteroid data
def generate_asteroid_data(request_id, asteroid_index):
    asteroid_data = {
        "id": f"asteroid_{request_id}_{asteroid_index:03d}",
        "position": {
            "x": round(random.uniform(-500000.0, 500000.0), 2),
            "y": round(random.uniform(-500000.0, 500000.0), 2),
            "z": round(random.uniform(-500000.0, 500000.0), 2),
        },
        "velocity": {
            "vx": round(random.uniform(-50.0, 50.0), 2),
            "vy": round(random.uniform(-50.0, 50.0), 2),
            "vz": round(random.uniform(-50.0, 50.0), 2),
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

    # Validate request data against the schema
    if not json_data:
        return jsonify({"message": "No input data provided"}), 400

    try:
        data = asteroid_request_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422

    num_asteroids = data['num_asteroids']
    request_id = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')

    asteroid_list = []

    # Generate the specified number of asteroids
    for asteroid_index in range(1, num_asteroids + 1):
        asteroid_data = generate_asteroid_data(request_id, asteroid_index)
        producer.send('asteroid_data', asteroid_data)
        asteroid_list.append(asteroid_data)

    producer.flush()

    return jsonify({
        "message": f"{num_asteroids} asteroids generated and sent to Kafka",
        "asteroids": asteroid_list
    }), 200

# Function to consume Kafka messages and emit them via WebSocket
def consume_asteroids():
    for message in consumer:
        asteroid_data = message.value
        print(f"Received asteroid data: {asteroid_data}")
        socketio.emit('asteroid_update', asteroid_data)

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
    socketio.start_background_task(consume_asteroids)
    socketio.run(app, host='0.0.0.0', port=5550)
