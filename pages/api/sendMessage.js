import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { awsConfig } from "./aws-config";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { channelId, message, username } = req.body;

    if (!channelId || !message || !username) {
        return res.status(400).json({ message: 'Channel ID, message, and username are required' });
    }

    if (message.trim().length === 0) {
        return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message.length > 500) {
        return res.status(400).json({ message: 'Message is too long (max 500 characters)' });
    }

    try {
        const ddbClient = new DynamoDBClient(awsConfig);
        const docClient = DynamoDBDocumentClient.from(ddbClient);

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const item = {
            id: messageId,
            channelId: channelId,
            message: message.trim(),
            username: username.trim(),
            timestamp: timestamp,
            createdAt: timestamp
        };

        await docClient.send(new PutCommand({
            TableName: "IVSChatMessages",
            Item: item
        }));

        res.status(200).json({
            success: true,
            message: item
        });

    } catch (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", {
            name: error.name,
            message: error.message,
            code: error.code
        });
        
        // Check if it's a table not found error
        if (error.name === 'ResourceNotFoundException' || error.message?.includes('does not exist')) {
            res.status(500).json({ 
                success: false,
                message: 'Chat table not found. Please run: node scripts/create_chat_table.js', 
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false,
                message: 'Error sending message', 
                error: error.message 
            });
        }
    }
}

