const axios = require('axios');

module.exports = async (req, res) => {
    const { url, apikey } = req.query;

    // Proteksi Apikey sesuai CONFIG di index.js
    if (apikey !== 'devzx18') {
        return res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Apikey salah! Gunakan devzx18" 
        });
    }

    if (!url) {
        return res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Masukkan parameter url!" 
        });
    }

    try {
        // Step 1: Bypass Cloudflare Turnstile untuk mendapatkan token valid
        const cf = await axios.post(
            "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
            {
                url: "https://ssvid.net",
                siteKey: "0x4AAAAAABtS0SWRydNIaIZb"
            },
            { headers: { "Content-Type": "application/json" } }
        );

        const cfToken = cf.data.result;

        if (!cfToken) {
            return res.json({ 
                status: false, 
                creator: "DevZx", 
                message: "Gagal mendapatkan CF Token dari bypasser." 
            });
        }

        // Step 2: Request data download ke ssvid.net menggunakan token hasil bypass
        const response = await axios.post(
            "https://ssvid.net/api/ajax/search?hl=id",
            new URLSearchParams({
                query: url,
                cf_token: cfToken,
                vt: "home"
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Origin": "https://ssvid.net",
                    "Referer": "https://ssvid.net/",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
                }
            }
        );

        // Mengirimkan hasil akhir ke user
        res.json({
            status: true,
            creator: "DevZx",
            result: response.data
        });

    } catch (e) {
        console.error("AIO Error:", e.message);
        res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Terjadi kesalahan pada server AIO atau URL tidak didukung." 
        });
    }
};