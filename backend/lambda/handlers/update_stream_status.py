# handlers/update_stream_status.py
import json
from datetime import datetime
from lib.dynamodb import table
from lib.ws_broadcast import broadcast_to_game
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    game_id = event["pathParameters"]["gameId"]
    logger.info(f"Received event: {event}")
    body = json.loads(event["body"])
    if isinstance(body, str):
        body = json.loads(body)
    status = body["status"]

    if status not in ["Started", "Ended"]:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid stream status"})
        }

    response = table.update_item(
        Key={"gameId": game_id},
        UpdateExpression="SET streamStatus = :status, updatedAt = :now",
        ExpressionAttributeValues={
            ":status": status,
            ":now": datetime.utcnow().isoformat()
        },
        ReturnValues="ALL_NEW"
    )

    broadcast_to_game(
        game_id,
        {
            "type": "STREAM_STATUS",
            "gameId": game_id,
            "streamStatus": status
        }
    )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(response["Attributes"], default=str)
    }
