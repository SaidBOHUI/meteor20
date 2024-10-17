from flask import Flask, request, jsonify
from kafka import KafkaProducer, KafkaConsumer
from marshmallow import Schema, fields, ValidationError
from pyspark.ml.classification import LogisticRegressionModel
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from flask_cors import CORS
import json
import random
from datetime import datetime, timezone
 
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
 
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
    num_asteroids = fields.Int(required=True)  # Number of asteroids to generate
 
asteroid_request_schema = AsteroidRequestSchema()
 
# Function to generate random asteroid data
def generate_asteroid_data(request_id, asteroid_index):
    asteroid_data = {
        "id": f"asteroid_{request_id}_{asteroid_index:03d}",  # Unique Asteroid ID with request_id and index
        "position": {
            "x": round(random.uniform(-500000.0, 500000.0), 2),  # Random position in space
            "y": round(random.uniform(-500000.0, 500000.0), 2),
            "z": round(random.uniform(-500000.0, 500000.0), 2),
        },
        "velocity": {
            "vx": round(random.uniform(-50.0, 50.0), 2),  # Random velocity vector components
            "vy": round(random.uniform(-50.0, 50.0), 2),
            "vz": round(random.uniform(-50.0, 50.0), 2),
        },
        "size": round(random.uniform(0.1, 10.0), 2),  # Random size in kilometers
        "mass": round(random.uniform(1e12, 1e15), 2),  # Random mass in kilograms
        "last_time_looked": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')  # Current UTC time
    }
    return asteroid_data
 
@app.route('/generate_asteroids', methods=['POST'])
def create_asteroids():
    json_data = request.get_json()
 
    # Validate request data against the schema
    if not json_data:
        return jsonify({"message": "No input data provided"}), 400
 
    try:
        data = asteroid_request_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422
 
    # Number of asteroids to generate
    num_asteroids = data['num_asteroids']
 
    # Generate a unique request ID based on the current timestamp
    request_id = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
 
    asteroid_list = []
 
    # Generate the specified number of asteroids
    for asteroid_index in range(1, num_asteroids + 1):
        asteroid_data = generate_asteroid_data(request_id, asteroid_index)
        producer.send('asteroid_data', asteroid_data)  # Send each asteroid to Kafka
        asteroid_list.append(asteroid_data)  # Append to the list for response
 
    producer.flush()  # Ensure all messages are sent to Kafka
 
    return jsonify({
        "message": f"{num_asteroids} asteroids generated and sent to Kafka",
        "asteroids": asteroid_list
    }), 200
 
@app.route('/get_asteroids', methods=['GET'])
def get_asteroids():
    asteroids = []
 
    # Poll for messages from Kafka (timeout in milliseconds)
    messages = consumer.poll(timeout_ms=1000, max_records=10)
 
    # Process the polled messages
    for topic_partition, msg_list in messages.items():
        for message in msg_list:
            asteroid = message.value  # Get the asteroid data from the Kafka message
            asteroids.append(asteroid)
 
    if len(asteroids) == 0:
        return jsonify({"message": "No asteroids found"}), 404
 
    return jsonify({
        "message": "Latest asteroids retrieved from Kafka",
        "asteroids": asteroids
    }), 200
 
class AsteroidSchema(Schema):
    x = fields.Float(required=True)  # Position X
    y = fields.Float(required=True)  # Position Y
    z = fields.Float(required=True)  # Position Z
    vx = fields.Float(required=True)  # Velocity X
    vy = fields.Float(required=True)  # Velocity Y
    vz = fields.Float(required=True)  # Velocity Z
    size = fields.Float(required=True)  # Size in kilometers
    mass = fields.Float(required=True)  # Mass in kilograms
 
asteroid_schema = AsteroidSchema()
 
# Endpoint to create a new asteroid with user-defined parameters
@app.route('/generate_asteroid', methods=['POST'])
def create_asteroid():
    json_data = request.get_json()
 
    # Validate request data against the schema
    try:
        data = asteroid_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422
 
    # Generate id and last_time_looked on the backend
    asteroid_id = f"asteroid_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    last_time_looked = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
 
    asteroid_data = {
        "id": asteroid_id,
        "position": {
            "x": data['x'],
            "y": data['y'],
            "z": data['z']
        },
        "velocity": {
            "vx": data['vx'],
            "vy": data['vy'],
            "vz": data['vz']
        },
        "size": data['size'],
        "mass": data['mass'],
        "last_time_looked": last_time_looked
    }
 
    # Send the asteroid data to Kafka
    producer.send('asteroid_data', asteroid_data)
    producer.flush()
 
    return jsonify({
        "message": "Asteroid created and sent to Kafka",
        "asteroid": asteroid_data
    }), 200

# Initialize Spark session
spark = SparkSession.builder \
    .appName("AsteroidPredictionService") \
    .getOrCreate()

# Load the trained model from HDFS
model = LogisticRegressionModel.load("hdfs://namenode:9000/user/spark/models/asteroid_collision_model")

# Prediction API
@app.route('/predict_collision', methods=['POST'])
def predict_collision():
    data = request.get_json()

    # Convert input data to Spark DataFrame
    asteroid_df = spark.createDataFrame([data])

    # Prepare features for prediction
    assembler = VectorAssembler(
        inputCols=["position.x", "position.y", "position.z", "velocity.vx", "velocity.vy", "velocity.vz", "size", "mass"],
        outputCol="features"
    )
    features_df = assembler.transform(asteroid_df)

    # Make a prediction
    prediction = model.transform(features_df)
    predicted_collision = prediction.select("prediction").collect()[0][0]

    # Return the result
    return jsonify({"collision_prediction": predicted_collision})
 
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Backend running"}), 200
 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5550)