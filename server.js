const express = require('express');
const { WebSocketServer } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve overlay
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const server = app.listen(PORT, () => console.log(`Server jalan → port ${PORT}`));
const wss = new WebSocketServer({ server });

// USERNAME TIKTOK KAU (tanpa @)
const TIKTOK_USERNAME = "sueatime";

// Paling ringkas & paling stabil 2025 (tanpa proxy, tanpa session pun OK kalau live aktif)
const liveConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  requestPollingIntervalMs: 3000,
  clientParams: {
    "app_language": "ms-MY",
    "device_platform": "web"
  },
  fetchOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36"
  }
});

// Auto retry setiap 12 saat kalau gagal
async function startConnect() {
  try {
    const state = await liveConnection.connect();
    console.log(`BERJAYA CONNECT @${TIKTOK_USERNAME} | Room ID: ${state.roomId}`);
  } catch (err) {
    console.log(`Gagal connect – retry 12s: ${err.message || err}`);
    setTimeout(startConnect, 12000);
  }
}
startConnect();

// Broadcast chat ke overlay
liveConnection.on('chat', data => {
  const payload = {
    event: 'chat',
    data: {
      uniqueId: data.uniqueId,
      nickname: data.nickname || 'Guest',
      profilePictureUrl: data.profilePictureUrl || data.profilePictureUrl || '',
      comment: data.comment
    }
  };
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(payload));
  });
});

liveConnection.on('error', () => setTimeout(startConnect, 12000));

