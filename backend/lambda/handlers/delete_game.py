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
        "body": ""
    }
