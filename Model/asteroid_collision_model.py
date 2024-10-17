from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Initialize Spark session
spark = SparkSession.builder \
    .appName("AsteroidModelTraining") \
    .config("spark.master", "local[*]") \
    .getOrCreate()

# Load the asteroid data from HDFS
asteroid_df = spark.read.parquet("hdfs://namenode:9000/user/spark/asteroid_data")

# Prepare the feature vector (using position, velocity, size, and mass)
assembler = VectorAssembler(
    inputCols=["position.x", "position.y", "position.z", "velocity.vx", "velocity.vy", "velocity.vz", "size", "mass"],
    outputCol="features"
)
df_features = assembler.transform(asteroid_df)

# Split the data into training and testing sets
train, test = df_features.randomSplit([0.8, 0.2])

# Train a logistic regression model
lr = LogisticRegression(labelCol="collision_label", featuresCol="features")
lr_model = lr.fit(train)

# Evaluate the model
predictions = lr_model.transform(test)
evaluator = BinaryClassificationEvaluator(labelCol="collision_label", metricName="areaUnderROC")
auc = evaluator.evaluate(predictions)

print(f"Model AUC: {auc}")

# Optionally save the model for future use
lr_model.save("hdfs://namenode:9000/user/spark/models/asteroid_collision_model")
