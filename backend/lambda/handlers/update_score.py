# handlers/update_score.py
import json
from datetime import datetime
from lib.dynamodb import table
from lib.ws_broadcast import broadcast_to_game

def lambda_handler(event, context):
    game_id = event["pathParameters"]["gameId"]
    body = json.loads(event["body"])
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
        "body": json.dumps(response["Attributes"])
    }
