import boto3
import os

TABLE_NAME = os.environ.get("GAMES_TABLE", "Games")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)