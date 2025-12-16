# handlers/get_game_by_id.py
import json
from lib.dynamodb import table

def lambda_handler(event, context):
    game_id = event["pathParameters"]["gameId"]

    response = table.get_item(
        Key={"gameId": game_id}
    )

    item = response.get("Item")
    if not item:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "Game not found"})
        }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(item, default=str)
    }
