# handlers/create_game.py
# Testing CF Update
import json
import uuid
from datetime import datetime
from lib.dynamodb import table
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
def lambda_handler(event, context):
    logger.info(f"Received event: {event}")
    body = json.loads(event["body"])

    game_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    item = {
        "gameId": game_id,
        "home": body["home"],
        "away": body["away"],
        "homeScore": 0,
        "awayScore": 0,
        "name": body["name"],
        "description": body["description"],
        "streamStatus": "N/A",
        "ivsChannelArn": body["ivsChannelArn"],
        "ivsPlaybackUrl": body.get("ivsPlaybackUrl"),
        # "createdBy": event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"],
        "createdAt": now,
        "updatedAt": now
    }

    table.put_item(Item=item)

    return {
        "statusCode": 201,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(item)
    }
