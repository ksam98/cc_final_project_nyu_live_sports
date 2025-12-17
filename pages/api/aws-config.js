// Shared AWS configuration for API routes
// WARNING: These credentials should be moved to environment variables for production

export const awsConfig = {
    region: process.env.APP_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY
    }
};
