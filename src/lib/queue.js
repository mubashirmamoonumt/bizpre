/**
 * Queue Setup
 * Configures BullMQ.
 */

const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Connect to local Redis or use standard connection string
const connection = new IORedis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
});

const queueName = 'business-scan';

const scanQueue = new Queue(queueName, { connection });

module.exports = { scanQueue, connection, queueName };
