import random
import json
import time
from datetime import datetime, timezone  # Import timezone
from kafka import KafkaProducer

# Function to simulate asteroid data
def generate_asteroid_data(asteroid_id):
    asteroid_data = {
        "id": f"asteroid_{asteroid_id:03d}",  # Asteroid ID in "asteroid_001" format
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

# Initialize Kafka Producer
producer = KafkaProducer(
    bootstrap_servers='kafka:9092',  # Kafka broker address as per your Docker setup
    value_serializer=lambda v: json.dumps(v).encode('utf-8')  # Serialize data to JSON
)

# Topic to publish to
topic_name = "asteroid_data"

# Get user input for the number of asteroids to generate
num_asteroids = int(input("Enter the number of asteroids to generate: "))

try:
    print(f"Generating {num_asteroids} asteroids...")
    
    # Loop through and generate the specified number of asteroids
    for asteroid_id in range(1, num_asteroids + 1):
        data = generate_asteroid_data(asteroid_id)  # Generate data for the current asteroid
        producer.send(topic_name, value=data)  # Publish the data to Kafka
        print(f"Published asteroid data: {data}")
        time.sleep(1)  # Add a short delay between asteroid generation (optional)

except KeyboardInterrupt:
    print("Process interrupted...")

finally:
    producer.close()  # Ensure producer is closed after execution
    print("Data generation completed.")
