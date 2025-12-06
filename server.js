const express = require('express');
const { WebSocketServer } = require('ws');
const tiktokLive = require('@tiktoklive/node');
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
const TIKTOK_USERNAME = "yoyo_savagemike";

tiktokLive.connect(TIKTOK_USERNAME, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  timeout: 10000
}).then(live => {
  console.log(`Connected to @${TIKTOK_USERNAME}`);

  live.on('chat', data => {
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

}).catch(err => {
  console.error('TikTok connect gagal:', err);
  process.exit(1);
});
