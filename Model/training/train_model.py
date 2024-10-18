import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import MinMaxScaler

# Fonction pour générer des données d'entraînement
def generate_asteroid_data(num_samples=1000):
    position_x = np.random.uniform(-1e6, 1e6, num_samples)
    position_y = np.random.uniform(-1e6, 1e6, num_samples)
    position_z = np.random.uniform(-1e6, 1e6, num_samples)

    # Génération de vitesses aléatoires (en km/s)
    velocity_x = np.random.uniform(-50, 50, num_samples)
    velocity_y = np.random.uniform(-50, 50, num_samples)
    velocity_z = np.random.uniform(-50, 50, num_samples)

    # Génération de tailles d'astéroïdes (en km) et de masses (en kg)
    size = np.random.uniform(0.1, 10.0, num_samples)  # Taille entre 0.1 et 10 km
    mass = np.random.uniform(1e12, 1e15, num_samples)  # Masse entre 10^12 et 10^15 kg

    # Ajustement des seuils pour générer plus de collisions
    collision_distance_threshold = 5e5  # Seuil de distance pour une collision en km (augmenté)
    speed_threshold = 30  # Seuil de vitesse pour définir une collision 

    distance_from_origin = np.sqrt(position_x**2 + position_y**2 + position_z**2)
    speed = np.sqrt(velocity_x**2 + velocity_y**2 + velocity_z**2)

    # Une collision est définie si l'astéroïde est suffisamment proche du point (0, 0, 0) et se déplace rapidement
    collision = np.where((distance_from_origin < collision_distance_threshold) & (speed > speed_threshold), 1, 0)

    # Construction du DataFrame
    data = pd.DataFrame({
        'position_x': position_x,
        'position_y': position_y,
        'position_z': position_z,
        'velocity_x': velocity_x,
        'velocity_y': velocity_y,
        'velocity_z': velocity_z,
        'size': size,
        'mass': mass,
        'collision': collision
    })

    return data

# Fonction pour normaliser les données
def normalize_data(data):
    scaler = MinMaxScaler()
    columns_to_scale = ['position_x', 'position_y', 'position_z', 'velocity_x', 'velocity_y', 'velocity_z', 'size', 'mass']
    data[columns_to_scale] = scaler.fit_transform(data[columns_to_scale])
    return data

# Entraînement du modèle
def train_model(data):
    X = data[['position_x', 'position_y', 'position_z', 'velocity_x', 'velocity_y', 'velocity_z', 'size', 'mass']]
    y = data['collision']  # 0 = pas de collision, 1 = collision

    # Normalisation des données
    X = normalize_data(X)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Création et entraînement du modèle
    model = LogisticRegression()
    model.fit(X_train, y_train)

    # Prédiction et évaluation
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Précision du modèle après normalisation : {accuracy * 100:.2f}%")
    save_model(model)

# Sauvegarde du modèle
def save_model(model, model_path=os.path.join('saved', 'model_v1.pkl')):
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"Modèle sauvegardé à l'emplacement : {model_path}")

if __name__ == "__main__":
    # Génération des données d'entraînement pour 1000 astéroïdes
    asteroid_data = generate_asteroid_data(1000)
    
    # Définir le chemin pour sauvegarder les données dans le répertoire de training
    training_data_dir = os.path.join("training", "training_data")
    os.makedirs(training_data_dir, exist_ok=True)
    
    # Chemin vers le fichier CSV contenant les données d'entraînement
    training_data_path = os.path.join(training_data_dir, "asteroid_data.csv")
    asteroid_data.to_csv(training_data_path, index=False)
    print(f"Données d'entraînement sauvegardées dans '{training_data_path}'.")
    
    # Entraînement du modèle avec les données générées
    train_model(asteroid_data)