/**
 * Business Presence Scanner API
 * Expose endpoints to trigger scans and retrieve results.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { scanQueue } = require('./lib/queue');

const app = express();
const PORT = process.env.PORT || 4010;

app.use(cors());
app.use(bodyParser.json());

// POST /scan
app.post('/scan', async (req, res) => {
    try {
        const { business, webhookUrl } = req.body;

        if (!business || !business.business_name) {
            return res.status(400).json({ error: 'business_name is required in business object' });
        }

        const job = await scanQueue.add('scan', { business, webhookUrl });

        res.json({ job_id: job.id, message: 'Scan queued successfully' });
    } catch (error) {
        console.error('Scan queue error:', error);
        res.status(500).json({ error: 'Failed to queue scan' });
    }
});

// GET /status?id=
app.get('/status', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id parameter is required' });

        const job = await scanQueue.getJob(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress; // if we tracked progress

        res.json({ id: job.id, status: state, progress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /result?id=
app.get('/result', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id parameter is required' });

        const job = await scanQueue.getJob(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        if (state !== 'completed') {
            return res.status(400).json({ error: 'Job not completed yet', status: state });
        }

        const result = job.returnvalue;
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});
