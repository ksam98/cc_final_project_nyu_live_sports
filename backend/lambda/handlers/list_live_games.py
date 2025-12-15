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
        "body": json.dumps(response.get("Items", []))
    }
