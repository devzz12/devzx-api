const CONFIG = {
    adminName: "DevZx Premier",
    adminUser: "devzx2010",      // Username untuk login dashboard
    adminPass: "3d72c8418241101",   // Password untuk login dashboard
    apikey: "devzx18",
    limit: 500               // Batas limit per hari
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
//      KONFIGURASI FIREBASE STATS & LIMIT
// ==========================================
const FIREBASE_URL = "https://devzx18-default-rtdb.firebaseio.com/";

const trackRequest = (featureName, category) => {
    return async (req, res, next) => {
        const { apikey } = req.query;
        const today = new Date().toDateString().replace(/\s/g, '_');
        
        // 1. Validasi Apikey
        if (apikey !== CONFIG.apikey) {
            return res.status(403).json({ status: false, error: "Apikey salah lek!" });
        }

        try {
            // 2. Cek & Update Limit di Firebase
            const limitRes = await axios.get(`${FIREBASE_URL}limits/${apikey}/${today}.json`);
            const used = limitRes.data || 0;

            if (used >= CONFIG.limit) {
                return res.status(429).json({ 
                    status: false, 
                    message: "Limit mu habis lek! Tunggu besok lagi." 
                });
            }

            // Tambah hit limit di Firebase
            await axios.put(`${FIREBASE_URL}limits/${apikey}/${today}.json`, used + 1);

            // 3. Update Stats Total Global
            const currentTotalRes = await axios.get(`${FIREBASE_URL}stats/total/${today}.json`);
            const newTotal = (currentTotalRes.data || 0) + 1;
            await axios.put(`${FIREBASE_URL}stats/total/${today}.json`, newTotal);

            // 4. Update Stats per Fitur (Untuk Top API)
            const currentFeatRes = await axios.get(`${FIREBASE_URL}stats/features/${featureName}.json`);
            const newFeatCount = (currentFeatRes.data || 0) + 1;
            await axios.put(`${FIREBASE_URL}stats/features/${featureName}.json`, newFeatCount);

            console.log(`\x1b[32m%s\x1b[0m`, `log request : ${featureName} >-< ${category}`);
        } catch (e) {
            // Lanjut jika firebase error
        }
        next();
    };
};

// ==========================================
//               IMPORT FITUR API
// ==========================================
const mediafire = require('./download/mediafire');
const ytmp4 = require('./download/ytmp4');
const igDownload = require('./download/ig');
const tiktok = require('./download/tiktok');
const npmSearch = require('./search/npm');
const carbon = require('./tools/carbon');
const upskel = require('./tools/upscaler');

// ==========================================
//               RUTE ADMIN LOGIN
// ==========================================
app.post('/api/admin/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === CONFIG.adminUser && pass === CONFIG.adminPass) {
        res.json({ 
            status: true, 
            message: "Login Berhasil!",
            owner: CONFIG.adminName,
            apikey: CONFIG.apikey,
            limit: CONFIG.limit
        });
    } else {
        res.status(401).json({ status: false, message: "Username/Password salah lek!" });
    }
});

// ==========================================
//                 RUTE API
// ==========================================

app.get('/api/download/mediafire', trackRequest('MediaFire', 'Downloader'), mediafire);
app.get('/api/download/ytmp4', trackRequest('YTMP4', 'Downloader'), ytmp4);
app.get('/api/download/ig', trackRequest('Instagram', 'Downloader'), igDownload);
app.get('/api/download/tiktok', trackRequest('TikTok', 'Downloader'), tiktok);
app.get('/api/search/npm', trackRequest('NPM Search', 'Search'), npmSearch);

// Endpoint Tools Carbon
app.get('/api/tools/carbon', trackRequest('Carbon Code', 'Tools'), async (req, res) => {
    const { code, color, apikey } = req.query;
    if (apikey !== CONFIG.apikey) return res.status(403).json({ status: false, error: "Apikey salah!" });
    if (!code) return res.status(400).json({ status: false, error: "Mana kodenya lek?" });

    try {
        const buffer = await carbon(code, color || "#ADD8E6");
        res.set("Content-Type", "image/png");
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
});

// Endpoint Tools ImgUpscaler
app.get('/api/tools/imgupscaler', trackRequest('ImgUpscaler', 'Tools'), async (req, res) => {
    const { url, scale, apikey } = req.query;
    if (apikey !== CONFIG.apikey) return res.status(403).json({ status: false, error: "Apikey salah!" });
    if (!url) return res.status(400).json({ status: false, error: "Link gambarnya mana?" });

    try {
        const result = await upskel.upload(url, scale || 2);
        res.json(result);
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
});

// AIO Downloader
app.get('/api/download/aio', trackRequest('AIO', 'Downloader'), async (req, res) => {
    const { url, apikey } = req.query;
    if (apikey !== CONFIG.apikey) return res.status(403).json({ status: false, message: "Apikey salah!" });
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
        res.json({ status: false, message: "AIO Error" });
    }
});

// API Statistik (Untuk Dashboard)
app.get('/api/stats', async (req, res) => {
    try {
        const today = new Date().toDateString().replace(/\s/g, '_');
        const totalRes = await axios.get(`${FIREBASE_URL}stats/total/${today}.json`);
        const featRes = await axios.get(`${FIREBASE_URL}stats/features.json`);
        const limitRes = await axios.get(`${FIREBASE_URL}limits/${CONFIG.apikey}/${today}.json`);

        const allFeatures = featRes.data || {};
        let topFeature = "None";
        let maxVal = 0;

        for (const [name, count] of Object.entries(allFeatures)) {
            if (count > maxVal) {
                maxVal = count;
                topFeature = name;
            }
        }
        res.json({ 
            totalToday: totalRes.data || 0, 
            topFeature,
            limitUsed: limitRes.data || 0,
            limitMax: CONFIG.limit
        });
    } catch (e) {
        res.json({ totalToday: 0, topFeature: "Error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs.html'));
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 1992;
    app.listen(PORT, '0.0.0.0', () => {
        console.clear();
        console.log(`\x1b[36m%s\x1b[0m`, `=========================================`);
        console.log(`\x1b[35m%s\x1b[0m`, `       ${CONFIG.adminName.toUpperCase()} ONLINE       `);
        console.log(`\x1b[36m%s\x1b[0m`, `=========================================`);
        console.log(` PORT    : ${PORT}`);
        console.log(` LIMIT   : ${CONFIG.limit}/day`);
        console.log(` STATS   : Linked to Firebase`);
        console.log(`=========================================`);
    });
}
