// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

if (!fs.existsSync(SCORES_FILE)) {
    fs.writeFileSync(SCORES_FILE, JSON.stringify({}, null, 2));
}

app.use(express.static(__dirname));
app.use(express.json());

app.get('/api/scores', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(SCORES_FILE));
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read scores' });
    }
});

app.post('/api/scores', (req, res) => {
    try {
        const { uniqueId, nickname, points } = req.body;
        const data = JSON.parse(fs.readFileSync(SCORES_FILE));
        data[uniqueId] = { nickname, points: parseInt(points) || 0 };
        fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

app.delete('/api/scores', (req, res) => {
    try {
        fs.writeFileSync(SCORES_FILE, JSON.stringify({}, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to clear scores' });
    }
});

app.listen(PORT, () => {
    console.log(`Server MaMu.GG Wordle berjalan di: http://localhost:${PORT}`);
    console.log(`Data disimpan di: ${SCORES_FILE}`);
});