const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const awsConfig = {
    region: process.env.APP_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY
    }
};

async function scanChannels() {
    console.log("Configuration:");
    console.log("Region:", awsConfig.region);
    console.log("Access Key ID:", awsConfig.credentials.accessKeyId ? "Set" : "Missing");

    const ddbClient = new DynamoDBClient(awsConfig);
    const docClient = DynamoDBDocumentClient.from(ddbClient);

    try {
        const command = new ScanCommand({ TableName: "IVSChannels" });
        const response = await docClient.send(command);
        console.log("Scan successful.");
        console.log("Items found:", response.Items.length);
        console.log(JSON.stringify(response.Items, null, 2));
    } catch (error) {
        console.error("Error scanning table:", error);
    }
}

scanChannels();
