const axios = require('axios');

module.exports = async (req, res) => {
    const { url, apikey } = req.query;

    console.log(`[REQUEST] TikTok DL | Link: ${url} | Key: ${apikey}`);

    if (apikey !== 'devzx18') {
        return res.json({ status: false, creator: "DevZx", message: "Apikey salah!" });
    }

    if (!url) return res.json({ status: false, message: "Masukkan parameter url!" });

    try {
        const response = await axios.get(`https://ditzz-hosting-eta.vercel.app/download/tiktok?apikey=ditzz&url=${encodeURIComponent(url)}`);
        res.json({
            status: true,
            creator: "DevZx",
            result: response.data.result
        });
    } catch (e) {
        res.json({ status: false, message: "Scraper Error atau API Scraper Down." });
    }
}; 