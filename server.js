const express = require('express');
const { WebSocketServer } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');  // ← package betul
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files (WAJIB untuk Railway)
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, () => console.log(`Server jalan port ${PORT}`));
const wss = new WebSocketServer({ server });

// GANTI DENGAN USERNAME TIKTOK KAU (tanpa @)
const TIKTOK_USERNAME = "sueatime";

const liveConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  }
});

liveConnection.connect().then(state => {
  console.info(`Connected to @${TIKTOK_USERNAME} - Room ID: ${state.roomId}`);
}).catch(err => {
  console.error('TikTok connect gagal:', err);
  process.exit(1);
});

liveConnection.on('chat', data => {
  const payload = {
    event: 'chat',
    data: {
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      profilePictureUrl: data.profilePictureUrl || '',
      comment: data.comment
    }
  };

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
});

liveConnection.on('error', err => {
  console.error('TikTok error:', err);

});
