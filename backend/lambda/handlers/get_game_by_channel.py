# handlers/get_game_by_channel.py
import json
from lib.dynamodb import table
from boto3.dynamodb.conditions import Key
from urllib.parse import unquote

def lambda_handler(event, context):
    channel_arn = event["pathParameters"]["channelArn"]
    channel_arn = unquote(channel_arn)
    response = table.query(
        IndexName="ChannelIndex",
        KeyConditionExpression=Key("ivsChannelArn").eq(channel_arn),
        ScanIndexForward=False,
        Limit=1
    )

    items = response.get("Items", [])
    if not items:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "No game found for channel"})
        }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(items[0], default=str)
    }
