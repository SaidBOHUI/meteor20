from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, avg, explode, window, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, FloatType, IntegerType


spark = SparkSession.builder \
    .appName("KafkaSparkConsumer") \
    .config("spark.master", "local[*]") \
    .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
    .getOrCreate()

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

df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "asteroid_data") \
    .load()

asteroid_df = df.selectExpr("CAST(value AS STRING)", "timestamp") \
    .select(from_json(col("value"), asteroid_schema).alias("data"), col("timestamp")) \
    .select("data.*", "timestamp")

asteroid_df_with_watermark = asteroid_df.withWatermark("timestamp", "10 minutes")

avg_size = asteroid_df_with_watermark.groupBy(window(col("timestamp"), "10 minutes")).agg(avg(col("size")).alias("average_size"))

avg_velocity = asteroid_df_with_watermark.groupBy(window(col("timestamp"), "10 minutes")).agg(
    avg(col("velocity.vx")).alias("avg_velocity_x"),
    avg(col("velocity.vy")).alias("avg_velocity_y"),
    avg(col("velocity.vz")).alias("avg_velocity_z")
)


query_avg_size = avg_size.writeStream \
    .outputMode("append") \
    .format("parquet") \
    .option("path", "hdfs://namenode:9092/asteroid_size") \
    .option("checkpointLocation", "/user/spark/average_size_checkpoint") \
    .start()

query_avg_velocity = avg_velocity.writeStream \
    .outputMode("append") \
    .format("parquet") \
    .option("path", "hdfs://namenode:9092/asteroid_velocity") \
    .option("checkpointLocation", "/user/spark/average_velocity_checkpoint") \
    .start()

query_avg_size.awaitTermination()
query_avg_velocity.awaitTermination()
