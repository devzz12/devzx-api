const axios = require('axios');

module.exports = async (req, res) => {
    const { q, apikey } = req.query;

    // Log request ke terminal Termux
    console.log(`[REQUEST] NPM Search | Key: ${apikey} | Query: ${q}`);

    // Proteksi Apikey Wajib
    if (apikey !== 'devzx18') {
        return res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Apikey salah! Gunakan devzx18" 
        });
    }

    if (!q) {
        return res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Masukkan nama package (q)!" 
        });
    }

    try {
        // Mengambil data langsung dari Registry Resmi NPM
        const response = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`);
        const objects = response.data.objects;

        if (!objects || objects.length === 0) {
            return res.json({ 
                status: false, 
                creator: "DevZx", 
                message: "Package tidak ditemukan." 
            });
        }

        // Mapping data sesuai format yang kamu minta
        const results = objects.map(pkg => {
            const p = pkg.package;
            return {
                title: `${p.name}@^${p.version}`,
                author: p.publisher ? p.publisher.username : 'unknown',
                update: p.date,
                links: {
                    homepage: p.links.homepage || '',
                    repository: p.links.repository || '',
                    bugs: p.links.bugs || '',
                    npm: p.links.npm || ''
                }
            };
        });

        // Output JSON sesuai keinginan kamu
        res.json({
            creator: "DevZx",
            status: true,
            result: results
        });

    } catch (e) {
        console.error("NPM Error:", e.message);
        res.json({ 
            status: false, 
            creator: "DevZx", 
            message: "Gagal menghubungkan ke server NPM." 
        });
    }
};