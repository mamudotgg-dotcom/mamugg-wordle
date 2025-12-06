const express = require('express');
const { WebSocketServer } = require('ws');
const tiktokLiveConnector = require('@tiktoklive/node');
const path = require('path');          // ← tambah ni

const app = express();
const PORT = process.env.PORT || 8080;

// ini 3 line WAJIB untuk Railway
app.use(express.static(path.join(__dirname)));           // serve semua file dalam folder
app.get('*', (req, res) => {                             // kalau tak jumpa route lain
  res.sendFile(path.join(__dirname, 'index.html'));        // hantar index.html
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

// === TIKTOK LIVE CONNECT ===
const tiktokUsername = "yoyo_savagemike";   // ← pastikan betul macam ni

tiktokLiveConnector.connect(tiktokUsername, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  // signApiKey: "optional kalau nak lebih stabil"
})
.then(live => {
  console.log(`Connected to @${tiktokUsername} live`);

  live.on('chat', (data) => {
    const event = {
      event: 'chat',
      data: {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        profilePictureUrl: data.profilePictureUrl,
        comment: data.comment
      }
    };

    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  });

})
.catch(err => {
  console.error('Gagal connect TikTok Live:', err);
});
