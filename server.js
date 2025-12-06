const express = require('express');
const { WebSocketServer } = require('ws');
const tiktokLiveConnector = require('@tiktoklive/node');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Overlay connected');
  
  ws.on('close', () => console.log('Overlay disconnected'));
});

// === CONNECT TO TIKTOK LIVE ===
const tiktokUsername = "mamu.gg"; // ubah ni

tiktokLiveConnector.connect(tiktokUsername, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
}).then(live => {
  console.log(`Connected to @${tiktokUsername}`);

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
    // Broadcast ke semua overlay
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  });

}).catch(err => {
  console.error('Failed to connect', err);
});