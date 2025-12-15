# handlers/ivs_stream_event.py
from lib.dynamodb import table
from boto3.dynamodb.conditions import Key
from datetime import datetime
from lib.ws_broadcast import broadcast_to_game

def lambda_handler(event, context):
    detail = event["detail"]
    channel_arn = detail["channel_arn"]
    event_name = detail["event_name"]

    status = "Started" if event_name == "Stream Started" else "Ended"

    response = table.query(
        IndexName="ChannelIndex",
        KeyConditionExpression=Key("ivsChannelArn").eq(channel_arn),
        ScanIndexForward=False,
        Limit=1
    )

    items = response.get("Items", [])
    if not items:
        return

    game_id = items[0]["gameId"]

    table.update_item(
        Key={"gameId": game_id},
        UpdateExpression="SET streamStatus = :status, updatedAt = :now",
        ExpressionAttributeValues={
            ":status": status,
            ":now": datetime.utcnow().isoformat()
        }
    )
    broadcast_to_game(
        game_id,
        {
            "type": "STREAM_STATUS",
            "gameId": game_id,
            "streamStatus": status
        }
    )
