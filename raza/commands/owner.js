const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'owner',
    aliases: ['dev', 'creator', 'developer'],
    description: 'Show bot owner information',
    usage: 'owner',
    category: 'Info',
    prefix: false
  },

  async run({ api, event, send, config }) {
    const { threadID, messageID } = event;

    const ownerPics = [
      'https://i.ibb.co/KcxP16kW/597739190-1912110929386224-7660142784435343126-n.jpg',
    ];

    const randomPic = ownerPics[Math.floor(Math.random() * ownerPics.length)];

    const ownerInfo = `
╔═══════════════════════════╗
║   ✨ 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 ✨   ║
╠═══════════════════════════╣
║                           ║
║  👤 𝐍𝐚𝐦𝐞: Rickyy D. Kantutero     ║
║                           ║
╠═══════════════════════════╣
║  📱 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 𝐈𝐧𝐟𝐨:          ║
║                           ║
║  🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:              ║
║  https://www.facebook.com/profile.php?id=61581956827969 ║
║                           ║
║                           ║
║                           ║
║                           ║
╠═══════════════════════════╣
║  🤖 𝐁𝐨𝐭 𝐃𝐞𝐭𝐚𝐢𝐥𝐬:           ║
║                           ║
║  📛 Name: ${config.BOTNAME || 'RAZA BOT'}
║  ⚡ Prefix: ${config.PREFIX || '.'}
║  💻 Version: 2.0.0        ║
║  🛠️ Framework: WS3-FCA    ║
║                           ║
╠═══════════════════════════╣
║  💝 fuckboy to!!          ║
╚═══════════════════════════╝
    `.trim();

    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `owner_${Date.now()}.jpg`);
      
      const response = await axios.get(randomPic, { responseType: 'arraybuffer' });
      fs.writeFileSync(imgPath, Buffer.from(response.data));
      
      api.sendMessage(
        {
          body: ownerInfo,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => {
          try { fs.unlinkSync(imgPath); } catch {}
        },
        messageID
      );
    } catch (error) {
      return send.reply(ownerInfo);
    }
  }
};
