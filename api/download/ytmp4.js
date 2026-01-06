const axios = require('axios');

module.exports = async (req, res) => {
    const { url, quality, apikey } = req.query;
    const targetQuality = quality || '360P';

    if (apikey !== 'devzx18') {
        return res.json({ status: false, creator: "DevZx", message: "Apikey salah!" });
    }

    if (!url) return res.json({ status: false, message: "Masukkan URL YouTube!" });

    // Extract videoId dari URL
    let videoId = "";
    if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    } else {
        return res.json({ status: false, message: "URL YouTube tidak valid!" });
    }

    const apiUrl = 'https://api.vidssave.com/api/contentsite_api/media/parse';
    const params = new URLSearchParams({
        auth: '20250901majwlqo',
        domain: 'api-ak.vidssave.com',
        origin: 'source',
        link: `https://youtube.com/watch?v=${videoId}`
    });

    try {
        const response = await axios.post(apiUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 1) {
            const resources = response.data.data.resources;
            const selected = resources.find(r => r.quality === targetQuality) || resources[0];
            
            if (selected && selected.download_url) {
                return res.json({
                    status: true,
                    creator: "DevZx",
                    result: {
                        title: response.data.data.title,
                        downloadUrl: selected.download_url,
                        quality: selected.quality,
                        size: selected.size
                    }
                });
            }
        }
        res.json({ status: false, message: response.data.msg || 'No download link found' });
    } catch (error) {
        res.json({ status: false, message: error.message });
    }
};