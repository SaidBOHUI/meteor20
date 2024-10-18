from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, expr, to_json, struct
from pyspark.sql.types import StructType, StructField, StringType, FloatType
import sys


spark = SparkSession.builder \
    .appName("AsteroidPositionUpdater") \
    .config("spark.master", "local[*]") \
    .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")


asteroid_schema = StructType([
    StructField("id", StringType(), True),
    StructField("position", StructType([
        StructField("x", FloatType(), True),
        StructField("y", FloatType(), True),
        StructField("z", FloatType(), True)
    ]), True),
    StructField("velocity", StructType([
        StructField("vx", FloatType(), True),
        StructField("vy", FloatType(), True),
        StructField("vz", FloatType(), True)
    ]), True),
    StructField("size", FloatType(), True),
    StructField("mass", FloatType(), True),
    StructField("last_time_looked", StringType(), True)
])

df = spark.read.parquet("hdfs://namenode:9000s/asteroid_velocity", header=True)

query = df \
    .writeStream.outputMode("append") \
    .format("console") \
    .start()

query.awaitTermination()

asteroid_df = df.selectExpr("CAST(value AS STRING)", "timestamp") \
    .select(from_json(col("value"), asteroid_schema).alias("data"), col("timestamp")) \
    .select("data.*", "timestamp")


def calculate_new_position():
    current_time_expr = expr("unix_timestamp()")
    time_step_expr = current_time_expr - col("last_time_looked").cast("long")

    new_position_x = col("position.x") + (col("velocity.vx") * time_step_expr)
    new_position_y = col("position.y") + (col("velocity.vy") * time_step_expr)
    new_position_z = col("position.z") + (col("velocity.vz") * time_step_expr)

    return new_position_x, new_position_y, new_position_z, current_time_expr

new_x, new_y, new_z, current_time_expr = calculate_new_position()


updated_asteroid_positions = asteroid_df.withColumn("new_position_x", new_x) \
    .withColumn("new_position_y", new_y) \
    .withColumn("new_position_z", new_z) \
    .withColumn("last_time_looked", current_time_expr)

print(updated_asteroid_positions, "updated_asteroid_positions")
sys.stdout(updated_asteroid_positions, "updated_asteroid_positions")

updated_positions_to_kafka = updated_asteroid_positions.selectExpr(
    "to_json(struct(id, new_position_x as position_x, new_position_y as position_y, new_position_z as position_z, last_time_looked)) AS value"
)


# query = updated_positions_to_kafka.writeStream \
#     .format("kafka") \
#     .option("kafka.bootstrap.servers", "kafka:9092") \
#     .option("topic", "updatedComet") \
#     .option("checkpointLocation", "/user/spark/updated_positions_checkpoint") \
#     .start()

# query.awaitTermination()




# from pyspark.sql import SparkSession
# from pyspark.sql.functions import col, from_json, expr, to_json, struct
# from pyspark.sql.types import StructType, StructField, StringType, FloatType
# import sys
# # import requests
# # import json


# spark = SparkSession.builder \
#     .appName("AsteroidPositionUpdater") \
#     .config("spark.master", "local[*]") \
#     .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
#     .getOrCreate()

# spark.sparkContext.setLogLevel("WARN")


# asteroid_schema = StructType([
#     StructField("id", StringType(), True),
#     StructField("position", StructType([
#         StructField("x", FloatType(), True),
#         StructField("y", FloatType(), True),
#         StructField("z", FloatType(), True)
#     ]), True),
#     StructField("velocity", StructType([
#         StructField("vx", FloatType(), True),
#         StructField("vy", FloatType(), True),
#         StructField("vz", FloatType(), True)
#     ]), True),
#     StructField("size", FloatType(), True),
#     StructField("mass", FloatType(), True),
#     StructField("last_time_looked", StringType(), True)
# ])

# df = spark.read.parquet("hdfs://namenode:9000/asteroid_velocity", header=True)

# query = df \
#     .writeStream.outputMode("append") \
#     .format("console") \
#     .start()

# query.awaitTermination()

# asteroid_df = df.selectExpr("CAST(value AS STRING)", "timestamp") \
#     .select(from_json(col("value"), asteroid_schema).alias("data"), col("timestamp")) \
#     .select("data.*", "timestamp")


# def calculate_new_position():
#     current_time_expr = expr("unix_timestamp()")
#     time_step_expr = current_time_expr - col("last_time_looked").cast("long")

#     new_position_x = col("position.x") + (col("velocity.vx") * time_step_expr)
#     new_position_y = col("position.y") + (col("velocity.vy") * time_step_expr)
#     new_position_z = col("position.z") + (col("velocity.vz") * time_step_expr)

#     return new_position_x, new_position_y, new_position_z, current_time_expr

# new_x, new_y, new_z, current_time_expr = calculate_new_position()


# updated_asteroid_positions = asteroid_df.withColumn("new_position_x", new_x) \
#     .withColumn("new_position_y", new_y) \
#     .withColumn("new_position_z", new_z) \
#     .withColumn("last_time_looked", current_time_expr)

# updated_positions_to_hdfs = updated_asteroid_positions.selectExpr(
#     "id", "new_position_x as position_x", "new_position_y as position_y", "new_position_z as position_z", "last_time_looked"
# )

# hdfs_query = updated_positions_to_hdfs.writeStream \
#     .outputMode("append") \
#     .format("parquet") \
#     .option("path", "hdfs://namenode:9000/asteroid_updated_positions") \
#     .option("checkpointLocation", "/user/spark/checkpoints/asteroid_positions_hdfs") \
#     .start()

# updated_positions_to_kafka = updated_asteroid_positions.selectExpr(
#     "to_json(struct(id, new_position_x as position_x, new_position_y as position_y, new_position_z as position_z, last_time_looked)) AS value"
# )

# kafka_query = updated_positions_to_kafka.writeStream \
#     .format("kafka") \
#     .option("kafka.bootstrap.servers", "kafka:9092") \
#     .option("topic", "updatedComet") \
#     .option("checkpointLocation", "/user/spark/checkpoints/asteroid_positions_kafka") \
#     .start()

# # def send_to_backend(batch_df, batch_id):
# #     # Convertir les données en JSON
# #     data = batch_df.toJSON().collect()
# #     for json_data in data:
# #         # Effectuer une requête POST au backend
# #         try:
# #             response = requests.post('http://backend_url/asteroids', json=json.loads(json_data))
# #             if response.status_code != 200:
# #                 print(f"Erreur d'envoi au backend pour {json_data}")
# #         except Exception as e:
# #             print(f"Erreur de requête HTTP : {str(e)}")

# # # Écrire les données modifiées au backend
# # backend_query = updated_positions_to_hdfs.writeStream \
# #     .foreachBatch(send_to_backend) \
# #     .start()

# print(updated_asteroid_positions, "updated_asteroid_positions")
# sys.stdout(updated_asteroid_positions, "updated_asteroid_positions")

# # updated_positions_to_kafka = updated_asteroid_positions.selectExpr(
# #     "to_json(struct(id, new_position_x as position_x, new_position_y as position_y, new_position_z as position_z, last_time_looked)) AS value"
# # )

# hdfs_query.awaitTermination()
# kafka_query.awaitTermination()
# # backend_query.awaitTermination()

# # query = updated_positions_to_kafka.writeStream \
# #     .format("kafka") \
# #     .option("kafka.bootstrap.servers", "kafka:9092") \
# #     .option("topic", "updatedComet") \
# #     .option("checkpointLocation", "/user/spark/updated_positions_checkpoint") \
# #     .start()

# # query.awaitTermination()
