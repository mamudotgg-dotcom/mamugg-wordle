const express = require('express');
const { WebSocketServer } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');
const path = require('path');
const ProxyAgent = require('proxy-agent');  // ← Tambah proxy support

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const server = app.listen(PORT, () => console.log(`Server hidup → port ${PORT}`));
const wss = new WebSocketServer({ server });

const TIKTOK_USERNAME = "mamu.gg";

// Free proxy contoh (cari fresh kat https://free-proxy-list.net/ atau ganti dengan paid seperti BrightData)
const PROXY_URL = 'http://your-proxy-ip:port';  // Contoh: 'http://123.45.67.89:8080' (tukar ni)

// Setup connection dengan proxy + disable fallback kalau block
let liveConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  requestPollingIntervalMs: 5000,  // Lebih slow avoid rate limit
  disableEulerFallbacks: false,    // Biar fallback ke API kalau SIGI_STATE fail
  webClientOptions: {
    httpsAgent: new ProxyAgent(PROXY_URL),  // Proxy untuk HTTP
    timeout: 20000
  },
  wsClientOptions: {
    agent: new ProxyAgent(PROXY_URL),       // Proxy untuk WebSocket
    timeout: 20000
  },
  fetchOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept-Language": "ms-MY,ms;q=0.9,en;q=0.8",
      "Sec-Fetch-Site": "same-origin"
    },
    timeout: 20000
  }
});

// Enhanced connect dengan proxy retry
async function connectTikTok(retryCount = 0) {
  try {
    const state = await liveConnection.connect();
    console.log(`✅ Connected ke @${TIKTOK_USERNAME} → Room ID: ${state.roomId}`);
    return;
  } catch (err) {
    console.log(`❌ Gagal connect (retry ${retryCount + 1}):`, err.message || err);
    if (retryCount < 3) {
      setTimeout(() => connectTikTok(retryCount + 1), 10000);  // Retry 10s
    } else {
      console.log('Max retry. Tukar proxy atau guna session login.');
      setTimeout(connectTikTok, 60000);  // Retry 1 minit
    }
  }
}

connectTikTok();

// Events sama macam dulu
liveConnection.on('chat', data => {
  console.log(`Chat: ${data.nickname}: ${data.comment}`);
  const payload = {
    event: 'chat',
    data: {
      uniqueId: data.uniqueId,
      nickname: data.nickname || 'Guest',
      profilePictureUrl: data.profilePictureUrl || 'https://via.placeholder.com/40',
      comment: data.comment
    }
  };
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(payload));
  });
});

liveConnection.on('error', err => {
  console.error('TikTok error (retrying):', err.message || err);
  connectTikTok();
});
