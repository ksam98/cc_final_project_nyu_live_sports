import os
import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["CONNECTIONS_TABLE"])

apigw = boto3.client(
    "apigatewaymanagementapi",
    endpoint_url=os.environ["WS_ENDPOINT"]
)

def broadcast_to_game(game_id, payload):
    response = table.scan(
        FilterExpression=Key("gameId").eq(game_id)
    )

    for item in response.get("Items", []):
        try:
            apigw.post_to_connection(
                ConnectionId=item["connectionId"],
                Data=json.dumps(payload, default=str)
            )
        except apigw.exceptions.GoneException:
            table.delete_item(
                Key={"connectionId": item["connectionId"]}
            )
