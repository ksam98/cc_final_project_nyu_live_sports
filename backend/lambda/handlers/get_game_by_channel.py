# handlers/get_game_by_channel.py
import json
from lib.dynamodb import table
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    channel_arn = event["pathParameters"]["channelArn"]

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
        "body": json.dumps(items[0])
    }
