# handlers/delete_game.py
import json
from lib.dynamodb import table

def lambda_handler(event, context):
    game_id = event["pathParameters"]["gameId"]

    table.delete_item(
        Key={"gameId": game_id}
    )

    return {
        "statusCode": 204,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": ""
    }
