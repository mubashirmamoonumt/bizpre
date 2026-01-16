/**
 * Worker Process
 * Process jobs from the queue sequentially.
 */

const { Worker } = require('bullmq');
const { connection, queueName } = require('./lib/queue');
const { scanBusiness } = require('./scrapers/index');
const { generateInsights } = require('./lib/insights');
const axios = require('axios'); // For webhook (need to install or use fetch)
// Just stick to raw http or install axios? I installed axios? No I installed express puppeteer bullmq ioredis body-parser cors dotenv.
// I will use native fetch (Node 18+) or https.

async function sendWebhook(url, data) {
    if (!url) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.error('Webhook failed', e);
    }
}

const worker = new Worker(queueName, async job => {
    console.log(`Processing job ${job.id}`);
    const { business, webhookUrl } = job.data;

    // 1. Scan
    const presenceResults = await scanBusiness(business);

    // 2. Insights
    const insights = generateInsights(presenceResults, business);

    const finalResult = {
        scan_id: job.id,
        business: business,
        presence: presenceResults,
        insights: insights,
        finished_at: new Date().toISOString()
    };

    // 3. Webhook
    if (webhookUrl) {
        await sendWebhook(webhookUrl, finalResult);
    }

    return finalResult;
}, {
    connection,
    concurrency: 1 // "Workers process jobs sequentially. Only one browser runs per worker."
});

worker.on('completed', job => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed`, err);
});

console.log('Worker started...');
