# handlers/update_stream_status.py
import json
from datetime import datetime
from lib.dynamodb import table
from lib.ws_broadcast import broadcast_to_game

def lambda_handler(event, context):
    game_id = event["pathParameters"]["gameId"]
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
        "body": json.dumps(response["Attributes"])
    }
