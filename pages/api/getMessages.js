import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { awsConfig } from "./aws-config";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { channelId, lastMessageId } = req.query;

    if (!channelId) {
        return res.status(400).json({ message: 'Channel ID is required' });
    }

    try {
        const ddbClient = new DynamoDBClient(awsConfig);
        const docClient = DynamoDBDocumentClient.from(ddbClient);

        // Try to query using GSI first, fallback to scan if GSI doesn't exist
        let response;
        
        try {
            // Try to use GSI if it exists
            const queryCommand = new QueryCommand({
                TableName: "IVSChatMessages",
                IndexName: "channelId-timestamp-index",
                KeyConditionExpression: "channelId = :channelId",
                ExpressionAttributeValues: {
                    ":channelId": channelId
                },
                ScanIndexForward: false, // Most recent first
                Limit: 50
            });
            response = await docClient.send(queryCommand);
        } catch (error) {
            // If GSI doesn't exist or query fails, fallback to scan
            if (error.name === 'ValidationException' || error.name === 'ResourceNotFoundException') {
                console.log("GSI not available, using scan instead");
                const scanCommand = new ScanCommand({
                    TableName: "IVSChatMessages",
                    FilterExpression: "channelId = :channelId",
                    ExpressionAttributeValues: {
                        ":channelId": channelId
                    },
                    Limit: 50
                });
                response = await docClient.send(scanCommand);
            } else {
                throw error;
            }
        }

        const messages = (response.Items || []).sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        // If lastMessageId is provided, filter to only return messages after it
        let filteredMessages = messages;
        if (lastMessageId) {
            const lastMessageIndex = messages.findIndex(m => m.id === lastMessageId);
            if (lastMessageIndex >= 0) {
                filteredMessages = messages.slice(lastMessageIndex + 1);
            }
        }

        res.status(200).json({
            success: true,
            messages: filteredMessages
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ 
            message: 'Error fetching messages', 
            error: error.message 
        });
    }
}

