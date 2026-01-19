const CONFIG = {
    adminName: "BANG DEVZZ",
    adminUser: "devzx2010",
    adminPass: "3d72c8418241101",
    ownerKey: "devzx2010", 
    ownerLimit: 10000,
    userKey: "devzx18",    
    userLimit: 500
};

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const FIREBASE_URL = "https://devzx18-default-rtdb.firebaseio.com/";

const trackRequest = (featureName, category) => {
    return async (req, res, next) => {
        const { apikey } = req.query;
        const today = new Date().toDateString().replace(/\s/g, '_');
        
        if (!apikey) return res.status(403).json({ status: false, message: "Apikey mana lek?" });

        let maxLimit = (apikey === CONFIG.ownerKey) ? CONFIG.ownerLimit : (apikey === CONFIG.userKey ? CONFIG.userLimit : 0);
        if (maxLimit === 0) return res.status(403).json({ status: false, message: "Apikey tidak terdaftar!" });

        try {
            const limitRes = await axios.get(`${FIREBASE_URL}limits/${apikey}/${today}.json`);
            const used = limitRes.data || 0;
            if (used >= maxLimit) return res.status(429).json({ status: false, message: "Limit habis lek!" });

            axios.put(`${FIREBASE_URL}limits/${apikey}/${today}.json`, used + 1);
            axios.get(`${FIREBASE_URL}stats/total/${today}.json`).then(r => axios.put(`${FIREBASE_URL}stats/total/${today}.json`, (r.data || 0) + 1));
            axios.get(`${FIREBASE_URL}stats/features/${featureName}.json`).then(r => axios.put(`${FIREBASE_URL}stats/features/${featureName}.json`, (r.data || 0) + 1));
        } catch (e) {}
        next();
    };
};

// --- IMPORT MODULES ---
const mediafire = require('./download/mediafire');
const ytmp4 = require('./download/ytmp4');
const igDownload = require('./download/ig');
const tiktok = require('./download/tiktok');
const npmSearch = require('./search/npm');
const pinterestSearch = require('./search/pinterest'); // <--- Tambahkan ini
const carbon = require('./tools/carbon');
const upskel = require('./tools/upscaler');

app.post('/api/admin/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === CONFIG.adminUser && pass === CONFIG.adminPass) {
        res.json({ status: true, owner: CONFIG.adminName, ownerKey: CONFIG.ownerKey, userKey: CONFIG.userKey });
    } else { res.status(401).json({ status: false, message: "Salah lek!" }); }
});

app.get('/api/stats', async (req, res) => {
    try {
        const today = new Date().toDateString().replace(/\s/g, '_');
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const { data: totalRes } = await axios.get(`${FIREBASE_URL}stats/total/${today}.json`);
        const { data: featRes } = await axios.get(`${FIREBASE_URL}stats/features.json`);
        const { data: usedOwner } = await axios.get(`${FIREBASE_URL}limits/${CONFIG.ownerKey}/${today}.json`);
        const { data: usedUser } = await axios.get(`${FIREBASE_URL}limits/${CONFIG.userKey}/${today}.json`);

        let topFeature = "None", maxVal = 0;
        if (featRes) Object.entries(featRes).forEach(([n, c]) => { if (c > maxVal) { maxVal = c; topFeature = n; }});

        res.json({ totalToday: totalRes || 0, topFeature, ownerLimit: { used: usedOwner || 0, max: CONFIG.ownerLimit }, userLimit: { used: usedUser || 0, max: CONFIG.userLimit }, resetIn: tomorrow - now });
    } catch (e) { res.json({ totalToday: 0, topFeature: "Error" }); }
});

// --- ROUTES TOOLS ---
app.get('/api/tools/carbon', trackRequest('Carbon Code', 'Tools'), async (req, res) => {
    const { code, color } = req.query;
    if (!code) return res.status(400).send("Kodenya mana?");
    try {
        const buffer = await carbon(code, color || "#ADD8E6");
        res.set("Content-Type", "image/png");
        res.send(buffer);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/tools/imgupscaler', trackRequest('ImgUpscaler', 'Tools'), async (req, res) => {
    const { url } = req.query;
    try {
        const result = await upskel.upload(url, 2);
        res.json(result);
    } catch (e) { res.status(500).send(e.message); }
});

// --- ROUTES DOWNLOADER ---
app.get('/api/download/mediafire', trackRequest('MediaFire', 'Downloader'), mediafire);
app.get('/api/download/ytmp4', trackRequest('YTMP4', 'Downloader'), ytmp4);
app.get('/api/download/ig', trackRequest('Instagram', 'Downloader'), igDownload);
app.get('/api/download/tiktok', trackRequest('TikTok', 'Downloader'), tiktok);

// --- ROUTES SEARCH ---
app.get('/api/search/npm', trackRequest('NPM Search', 'Search'), npmSearch);
app.get('/api/search/pinterest', trackRequest('Pinterest Search', 'Search'), pinterestSearch); // <--- Tambahkan ini

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../docs.html')));

module.exports = app;
