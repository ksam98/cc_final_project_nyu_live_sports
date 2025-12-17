const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config({ path: '.env.local' });

const awsConfig = {
    region: process.env.APP_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID ? process.env.APP_AWS_ACCESS_KEY_ID.trim() : undefined,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY ? process.env.APP_AWS_SECRET_ACCESS_KEY.trim() : undefined
    }
};

async function debugChat() {
    console.log("=== Debugging Chat System ===");
    console.log("Config Region:", awsConfig.region);
    console.log("Access Key ID:", awsConfig.credentials.accessKeyId ? "Set" : "Missing");

    const client = new DynamoDBClient(awsConfig);
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        console.log("\n--- Scanning IVSChatMessages Table ---");
        const scanCmd = new ScanCommand({ TableName: "IVSChatMessages" });
        const response = await docClient.send(scanCmd);

        const items = response.Items || [];
        console.log(`Found ${items.length} messages.`);

        if (items.length > 0) {
            console.log("\nLast 20 messages:");
            // Sort by timestamp
            items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            items.slice(-20).forEach(msg => {
                console.log(`[${msg.timestamp}] User: ${msg.username}`);
                console.log(`    ChannelID: ${msg.channelId}`);
                console.log(`    Message:   ${msg.message}`);
                console.log(`    ID:        ${msg.id}`);
                console.log("------------------------------------------------");
            });

            // Group by Channel ID to see validation
            const channelGroups = {};
            items.forEach(msg => {
                channelGroups[msg.channelId] = (channelGroups[msg.channelId] || 0) + 1;
            });
            console.log("\nMessages per Channel ID:");
            console.table(channelGroups);
        }

    } catch (err) {
        console.error("Error scanning Chat Table:", err.message);
    }
}

debugChat();
