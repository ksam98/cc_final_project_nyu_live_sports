# handlers/list_live_games.py
import json
from lib.dynamodb import table
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    response = table.query(
        IndexName="LiveGamesIndex",
        KeyConditionExpression=Key("streamStatus").eq("Started"),
        ScanIndexForward=False
    )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(response.get("Items", []), default=str)
    }
