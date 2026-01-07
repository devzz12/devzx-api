const axios = require('axios');
const FormData = require('form-data');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const HIDENG = {
  origin: 'https://imgupscaler.com',
  referer: 'https://imgupscaler.com/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
};

const upskel = {
  upload: async (url, scaleRadio = 2) => {
    // Validasi scale (hanya boleh 2 atau 4)
    const scale = [2, 4].includes(Number(scaleRadio)) ? Number(scaleRadio) : 2;
    
    // Ambil gambar dari URL user
    const { data: buffer } = await axios.get(url, { responseType: 'arraybuffer' });
    
    const form = new FormData();
    form.append('myfile', Buffer.from(buffer), {
        filename: Date.now() + '.jpg',
        contentType: 'image/jpeg'
    });
    form.append('scaleRadio', scale);

    // Kirim ke API Upscaler
    const res = await axios.post('https://get1.imglarger.com/api/UpscalerNew/UploadNew', form, {
        headers: { ...form.getHeaders(), ...HIDENG }
    });

    const jobId = res.data?.data?.code;
    if (!jobId) throw new Error('Gagal upload ke server Upscaler lek!');
    
    return upskel.checkStatus(jobId, scale);
  },
  
  checkStatus: async (jobId, scaleRadio) => {
    // Retry sampai 20 kali (sekitar 1-2 menit)
    for (let i = 1; i <= 20; i++) {
      const res = await axios.post('https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew', 
        { code: jobId, scaleRadio },
        { headers: { ...HIDENG, 'content-type': 'application/json' } }
      );

      const data = res.data?.data;
      if (data && data.status === 'success') {
        return {
          status: true,
          creator: "DevZx Premier",
          result: data.downloadUrls[0], // Ambil link gambar HD-nya
          info: {
             fileName: data.originalfilename,
             mime: data.imagemimetype,
             size: data.filesize
          }
        };
      }
      // Tunggu 5 detik sebelum cek lagi
      await sleep(5000);
    }
    throw new Error('Upscale timeout! Servernya lagi sibuk lek.');
  }
};

module.exports = upskel;
