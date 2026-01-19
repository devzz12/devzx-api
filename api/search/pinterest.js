const axios = require('axios');

module.exports = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Masukkan query pencarian (q)!" 
        });
    }

    try {
        const response = await axios.get(`https://api.fikmydomainsz.xyz/search/pinterest?q=${encodeURIComponent(q)}`);
        res.json({
            creator: "DevZx",
            status: true,
            result: response.data.result
        });
    } catch (e) {
        res.json({ status: false, creator: "DevZx", message: "Gagal ambil data Pinterest." });
    }
};
