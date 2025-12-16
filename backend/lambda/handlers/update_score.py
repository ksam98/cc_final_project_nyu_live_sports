# handlers/update_score.py
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
    team = body["team"]

    if team not in ["home", "away"]:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid team"})
        }

    score_attr = "homeScore" if team == "home" else "awayScore"

    response = table.update_item(
        Key={"gameId": game_id},
        UpdateExpression=f"SET {score_attr} = {score_attr} + :inc, updatedAt = :now",
        ExpressionAttributeValues={
            ":inc": 1,
            ":now": datetime.utcnow().isoformat()
        },
        ReturnValues="ALL_NEW"
    )

    broadcast_to_game(
        game_id,
        {
            "type": "SCORE_UPDATE",
            "gameId": game_id,
            "homeScore": response["Attributes"]["homeScore"],
            "awayScore": response["Attributes"]["awayScore"]
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
