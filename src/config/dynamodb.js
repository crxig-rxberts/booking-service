const AWS = require('aws-sdk');
const logger = require('../utils/logger');

AWS.config.update({
  region: process.env.AWS_REGION || 'dummy',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:8000',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
});

const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'bookings';

async function initializeDynamoDB() {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
      { AttributeName: 'clientId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'clientId', AttributeType: 'S' },
      { AttributeName: 'providerUserSub', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ProviderIndex',
        KeySchema: [
          { AttributeName: 'providerUserSub', KeyType: 'HASH' },
          { AttributeName: 'id', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      },
      {
        IndexName: 'ClientIndex',
        KeySchema: [
          { AttributeName: 'clientId', KeyType: 'HASH' },
          { AttributeName: 'id', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    logger.info('Creating Bookings Table');
    await dynamoDB.createTable(params).promise();
    logger.info('DynamoDB Bookings table created successfully');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      logger.info('DynamoDB Bookings table already exists');
      // If the table exists, update the GSIs
      try {
        await updateGSIs(params.GlobalSecondaryIndexes);
      } catch (updateError) {
        logger.error('Error updating GSIs', { error: updateError });
      }
    } else {
      throw error;
    }
  }
}

async function updateGSIs(indexes) {
  for (const index of indexes) {
    const updateParams = {
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'providerUserSub', AttributeType: 'S' },
        { AttributeName: 'clientId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: index.IndexName,
            KeySchema: index.KeySchema,
            Projection: index.Projection
          }
        }
      ]
    };
    try {
      await dynamoDB.updateTable(updateParams).promise();
      logger.info(`GSI ${index.IndexName} created or updated successfully`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        logger.info(`GSI ${index.IndexName} already exists`);
      } else {
        throw error;
      }
    }
  }
}

module.exports = {
  docClient,
  TABLE_NAME,
  initializeDynamoDB
};
