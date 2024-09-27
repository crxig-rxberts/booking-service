const { docClient, TABLE_NAME } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

class BookingModel {
  async create(bookingData) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: uuidv4(),
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    await docClient.put(params).promise();
    return params.Item;
  }

  async get(id, clientId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id, clientId }
    };

    const result = await docClient.get(params).promise();
    return result.Item;
  }

  async update(id, clientId, updateData) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id, clientId },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': updateData.status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.update(params).promise();
    return result.Attributes;
  }

  async getByProvider(providerUserSub) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'ProviderIndex',
      KeyConditionExpression: 'providerUserSub = :providerUserSub',
      ExpressionAttributeValues: {
        ':providerUserSub': providerUserSub
      }
    };

    const result = await docClient.query(params).promise();
    return result.Items;
  }

  async getByClient(clientId) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'ClientIndex',
      KeyConditionExpression: 'clientId = :clientId',
      ExpressionAttributeValues: {
        ':clientId': clientId
      }
    };

    const result = await docClient.query(params).promise();
    return result.Items;
  }
}

module.exports = new BookingModel();
