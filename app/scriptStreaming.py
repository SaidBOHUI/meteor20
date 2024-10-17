from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json
from pyspark.sql.types import StructType, StructField, StringType, FloatType, IntegerType

# Configuration de la session Spark
spark = SparkSession.builder \
    .appName("KafkaSparkConsumer") \
    .config("spark.master", "local[*]") \
    .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
    .getOrCreate()

# Schéma des données Asteroid
asteroid_schema = StructType([
    StructField("id", StringType(), True),
    StructField("position", StructType([
        StructField("x", FloatType(), True),
        StructField("y", FloatType(), True),
        StructField("z", FloatType(), True)
    ])),
    StructField("velocity", StructType([
        StructField("vx", FloatType(), True),
        StructField("vy", FloatType(), True),
        StructField("vz", FloatType(), True)
    ])),
    StructField("size", FloatType(), True),
    StructField("mass", FloatType(), True),
    StructField("last_time_looked", StringType(), True)
])

# Consommation des messages Kafka
kafka_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "asteroid_data") \
    .load()

# Déserialiser data
parsed_df = kafka_df.selectExpr("CAST(value AS STRING)") \
    .select(from_json(col("value"), asteroid_schema).alias("data")) \
    .select("data.*")

query = parsed_df.writeStream \
    .format("parquet") \
    .option("path", "hdfs://namenode:9000/user/spark/asteroid_data") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .outputMode("append") \
    .start()

query.awaitTermination()
