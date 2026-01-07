const axios = require('axios');
const cheerio = require('cheerio');
const { lookup } = require('mime-types');

async function mediafire(req, res) {
    const { url, apikey } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Mana link MediaFire-nya lek?" });

    try {
        if (!url.includes('www.mediafire.com')) throw new Error('Link bukan MediaFire asli lek!');
        
        const { data } = await axios.get(`https://api.nekolabs.web.id/px?url=${encodeURIComponent(url)}`);
        const $ = cheerio.load(data.result.content);
        const raw = $('div.dl-info');
        
        const filename = $('.dl-btn-label').attr('title') || raw.find('div.intro div.filename').text().trim() || "unknown";
        const ext = filename.split('.').pop() || "";
        const mimetype = lookup(ext.toLowerCase()) || "application/octet-stream";
        
        const filesize = raw.find('ul.details li:nth-child(1) span').text().trim();
        const uploaded = raw.find('ul.details li:nth-child(2) span').text().trim();
        
        const dl = $('a#downloadButton').attr('href');
        if (!dl) throw new Error('Link download gak ketemu lek!');
        
        res.json({
            status: true,
            creator: "BANG DEVZX",
            result: {
                filename,
                filesize,
                mimetype,
                uploaded,
                download_url: dl
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

module.exports = mediafire;
