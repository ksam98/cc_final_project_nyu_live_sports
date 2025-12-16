const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const awsConfig = require("./aws-config");

async function createChatTable() {
    const client = new DynamoDBClient(awsConfig);

    const command = new CreateTableCommand({
        TableName: "IVSChatMessages",
        KeySchema: [
            { AttributeName: "id", KeyType: "HASH" } // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" }, // String
            { AttributeName: "channelId", AttributeType: "S" }, // String for GSI
            { AttributeName: "timestamp", AttributeType: "S" } // String for GSI
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "channelId-timestamp-index",
                KeySchema: [
                    { AttributeName: "channelId", KeyType: "HASH" },
                    { AttributeName: "timestamp", KeyType: "RANGE" }
                ],
                Projection: {
                    ProjectionType: "ALL"
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    });

    try {
        console.log("Creating DynamoDB Table 'IVSChatMessages'...");
        const response = await client.send(command);
        console.log("✅ Table creation initiated:", response.TableDescription.TableStatus);
        console.log("⏳ Note: Table creation may take a few minutes. GSI creation may take additional time.");
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log("ℹ️ Table 'IVSChatMessages' already exists.");
        } else {
            console.error("❌ Error creating table:", error);
        }
    }
}

createChatTable();

