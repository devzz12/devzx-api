const CONFIG = {
    adminName: "DevZx Premier",
    apikey: "devzx18"
};

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
//      ANTI-CURL & BOT PROTECTION (SERVER)
// ==========================================
app.use((req, res, next) => {
    const userAgent = req.get('User-Agent') || "";
    const botList = ['curl', 'wget', 'python', 'go-http', 'node-fetch', 'axios', 'postman'];
    const isBot = botList.some(bot => userAgent.toLowerCase().includes(bot));
    
    if (req.path === '/' && isBot) {
        return res.status(403).send("Akses Ditolak: Terminal tidak diizinkan mengakses dashboard.");
    }
    next();
});

// ==========================================
//      KONFIGURASI FIREBASE STATS
// ==========================================
const FIREBASE_URL = "https://devzx18-default-rtdb.firebaseio.com/";

const trackRequest = (featureName, category) => {
    return async (req, res, next) => {
        const today = new Date().toDateString().replace(/\s/g, '_');
        
        try {
            const currentTotalRes = await axios.get(`${FIREBASE_URL}stats/total/${today}.json`);
            const newTotal = (currentTotalRes.data || 0) + 1;
            await axios.put(`${FIREBASE_URL}stats/total/${today}.json`, newTotal);

            const currentFeatRes = await axios.get(`${FIREBASE_URL}stats/features/${featureName}.json`);
            const newFeatCount = (currentFeatRes.data || 0) + 1;
            await axios.put(`${FIREBASE_URL}stats/features/${featureName}.json`, newFeatCount);

            const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            console.log(`\x1b[32m%s\x1b[0m`, `log request : ${featureName} >-< ${category} : ${fullUrl}`);
        } catch (e) {
            // Lanjut jika firebase error
        }
        next();
    };
};

// ==========================================
//             IMPORT FITUR API
// ==========================================
const ytmp4 = require('./download/ytmp4');
const igDownload = require('./download/ig');
const tiktok = require('./download/tiktok');
const npmSearch = require('./search/npm');

// ==========================================
//                 RUTE API
// ==========================================

app.get('/api/download/ytmp4', trackRequest('YTMP4', 'Downloader'), ytmp4);
app.get('/api/download/ig', trackRequest('Instagram', 'Downloader'), igDownload);
app.get('/api/download/tiktok', trackRequest('TikTok', 'Downloader'), tiktok);
app.get('/api/search/npm', trackRequest('NPM Search', 'Search'), npmSearch);

app.get('/api/download/aio', trackRequest('AIO', 'Downloader'), async (req, res) => {
    const { url, apikey } = req.query;
    if (apikey !== CONFIG.apikey) return res.json({ status: false, creator: "DevZx", message: "Apikey salah!" });
    if (!url) return res.json({ status: false, message: "Masukkan URL!" });

    try {
        const cf = await axios.post("https://api.nekolabs.web.id/tools/bypass/cf-turnstile", {
            url: "https://ssvid.net",
            siteKey: "0x4AAAAAABtS0SWRydNIaIZb"
        });
        const response = await axios.post("https://ssvid.net/api/ajax/search?hl=id", new URLSearchParams({
            query: url, cf_token: cf.data.result, vt: "home"
        }), {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        res.json({ status: true, creator: "DevZx", result: response.data });
    } catch (e) {
        res.json({ status: false, message: "AIO Error atau URL tidak didukung." });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const today = new Date().toDateString().replace(/\s/g, '_');
        const totalRes = await axios.get(`${FIREBASE_URL}stats/total/${today}.json`);
        const featRes = await axios.get(`${FIREBASE_URL}stats/features.json`);
        
        const allFeatures = featRes.data || {};
        let topFeature = "None";
        let maxVal = 0;
        
        for (const [name, count] of Object.entries(allFeatures)) {
            if (count > maxVal) {
                maxVal = count;
                topFeature = name;
            }
        }
        res.json({ totalToday: totalRes.data || 0, topFeature });
    } catch (e) {
        res.json({ totalToday: 0, topFeature: "Error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs.html'));
});

// WAJIB UNTUK VERCEL: Export aplikasi Express
module.exports = app;

// JALANKAN SERVER (Hanya aktif jika dijalankan manual/lokal, bukan di Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 1992;
    app.listen(PORT, '0.0.0.0', () => {
        console.clear();
        console.log(`\x1b[36m%s\x1b[0m`, `=========================================`);
        console.log(`\x1b[35m%s\x1b[0m`, `      ${CONFIG.adminName.toUpperCase()} ONLINE      `);
        console.log(`\x1b[36m%s\x1b[0m`, `=========================================`);
        console.log(` PORT    : ${PORT}`);
        console.log(` STATS   : Linked to Firebase Realtime DB`);
        console.log(` PROTECT : Anti-CURL Dashboard Active`);
        console.log(`\x1b[36m%s\x1b[0m`, `=========================================`);
    });
}
