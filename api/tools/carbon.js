const axios = require('axios');

async function carbon(code, backgroundColor = "#ADD8E6") {
   const payload = {
      code,
      backgroundColor,
      lineNumbers: true
   };

   const response = await axios.post("https://carbonara.solopov.dev/api/cook", payload, {
      responseType: 'arraybuffer'
   });

   return Buffer.from(response.data);
}

module.exports = carbon;
