from gevent import monkey
monkey.patch_all()  # Use gevent instead of eventlet

from flask import Flask, request, jsonify
from kafka import KafkaProducer, KafkaConsumer
from marshmallow import Schema, fields, ValidationError
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
import random
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent", logger=True, engineio_logger=True)

# Initialize Kafka Producer
producer = KafkaProducer(
    bootstrap_servers='kafka:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Kafka Consumer to listen to asteroid_data topic
consumer = KafkaConsumer(
    'asteroid_data',
    bootstrap_servers='kafka:9092',
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    auto_offset_reset='earliest',
    enable_auto_commit=True
)

# Schema to validate asteroid data
class AsteroidRequestSchema(Schema):
    num_asteroids = fields.Int(required=True)

asteroid_request_schema = AsteroidRequestSchema()

# Generate asteroid data
def generate_asteroid_data(request_id, asteroid_index):
    asteroid_data = {
        "id": f"asteroid_{request_id}_{asteroid_index:03d}",
        "position": {
            "x": round(random.uniform(-500.0, 500.0), 2),
            "y": round(random.uniform(-500.0, 500.0), 2),
            "z": round(random.uniform(-500.0, 500.0), 2),
        },
        "velocity": {
            "vx": round(random.uniform(-12.0, 12.0), 2),
            "vy": round(random.uniform(-12.0, 12.0), 2),
            "vz": round(random.uniform(-12.0, 12.0), 2),
        },
        "size": round(random.uniform(0.1, 10.0), 2),
        "mass": round(random.uniform(1e12, 1e15), 2),
        "last_time_looked": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    }
    return asteroid_data

# Endpoint to generate multiple asteroids
@app.route('/generate_asteroids', methods=['POST'])
def create_asteroids():
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

@app.route('/')
def index():
    return jsonify({"message": "WebSocket server running"}), 200

@app.route('/asteroids', methods=['GET'])
def get_all_asteroids():
    asteroids = []
    
    # Poll the Kafka consumer to fetch all asteroid messages
    messages = consumer.poll(timeout_ms=1000, max_records=50)

    for topic_partition, message_list in messages.items():
        for message in message_list:
            asteroid_data = message.value
            asteroids.append(asteroid_data)

    if len(asteroids) == 0:
        return jsonify({"message": "No asteroid data found"}), 404

    return jsonify({
        "message": "Asteroid data retrieved successfully",
        "asteroids": asteroids
    }), 200

# Kafka Consumer in real-time with WebSocket
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start_stream')
def start_stream():
    socketio.start_background_task(stream_asteroid_data)

def stream_asteroid_data():
    while True:
        messages = consumer.poll(timeout_ms=1000)
        for topic_partition, message_list in messages.items():
            for message in message_list:
                asteroid_data = message.value
                print(f"Kafka Message received: {asteroid_data}") 
                socketio.emit('asteroid_update', asteroid_data)
                print(f"Sent asteroid data via WebSocket: {asteroid_data}")  


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5550, debug=True, log_output=True)
