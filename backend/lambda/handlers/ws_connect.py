import os
import json
from datetime import datetime
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["CONNECTIONS_TABLE"])

def lambda_handler(event, context):
    logger.info(f"Received event: {event}")
    connection_id = event["requestContext"]["connectionId"]
    game_id = event["queryStringParameters"]["gameId"]

    table.put_item(
        Item={
            "connectionId": connection_id,
            "gameId": game_id,
            "connectedAt": datetime.utcnow().isoformat()
        }
    )

    return {
        "statusCode": 200,
        "body": "Connected"
    }
