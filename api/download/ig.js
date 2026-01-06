const axios = require('axios');
const FormData = require('form-data');

module.exports = async (req, res) => {
    const { url, apikey } = req.query;

    if (apikey !== 'devzx18') {
        return res.json({ status: false, creator: "DevZx", message: "Apikey salah!" });
    }

    if (!url) return res.json({ status: false, message: "Masukkan URL Instagram!" });

    try {
        const form = new FormData();
        form.append('url', url);

        const headers = {
            ...form.getHeaders(),
            "accept": "*/*",
            "origin": "https://inflact.com",
            "referer": "https://inflact.com/instagram-downloader/video/",
            "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
            "x-client-signature": "89920bc36cc88a8e033f62d4f1ebe221a7c53b3b5ef32836e5196ae6c5be6b3d",
            "x-client-token": "eyJ0aW1lc3RhbXAiOjE3Njc1MDcwMzQsImNsaWVudElkIjoiYWMwY2EwZWQ5ZDJlYTZlMWViNGZjMjcyNGY3NDQwOWMiLCJub25jZSI6Ijk4NTJjYmEyYmZiNDkyMGIyNGIyNjlkMDEwYWYzMzE2In0="
        };

        const { data: response } = await axios.post('https://inflact.com/downloader/api/downloader/post/', form, { headers });

        if (!response.data || !response.data.post) {
            return res.json({ status: false, message: "Gagal mengambil data, mungkin link salah atau private." });
        }

        const result = {
            id: response?.data?.post?.id,
            shortcode: response?.data?.post?.shortcode,
            username: response?.data?.post?.owner?.username,
            caption: response?.data?.post?.edge_media_to_caption?.edges?.[0]?.node?.text,
            taken_at_timestamp: response?.data?.post?.taken_at_timestamp,
            like_count: response?.data?.post?.edge_media_preview_like?.count,
            comment_count: response?.data?.post?.edge_media_to_parent_comment?.count,
            is_video: response?.data?.post?.is_video,
            media_urls: response?.data?.post?.edge_sidecar_to_children?.edges?.map(edge => edge?.node?.video_url || edge?.node?.display_url) || [response?.data?.post?.video_url || response?.data?.post?.display_url]
        };

        res.json({
            status: true,
            creator: "DevZx",
            result
        });

    } catch (e) {
        res.json({ status: false, message: "Server Instagram Error: " + e.message });
    }
};