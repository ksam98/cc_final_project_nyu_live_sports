# handlers/create_game.py
# Testing CF Update
import json
import uuid
from datetime import datetime
from lib.dynamodb import table

def lambda_handler(event, context):
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
        "body": json.dumps(item)
    }
