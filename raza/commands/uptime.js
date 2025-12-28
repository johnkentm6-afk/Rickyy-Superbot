const os = require("os");
const fs = require("fs-extra");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "status"],
    version: "1.0.2",
    role: 0,
    credits: "Priyansh / Edited for Raza",
    description: "Check bot runtime and system status in PH time",
    category: "System",
    usages: "{pn}",
    cooldowns: 5,
    prefix: false 
  },

  run: async function ({ api, event }) {
    try {
      // Calculate Uptime using global.startTime from raza.js
      const uptimeInSeconds = (Date.now() - global.startTime) / 1000;
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
      const secondsLeft = Math.floor(uptimeInSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;

      // Memory Info
      const totalMemoryGB = os.totalmem() / 1024 ** 3;
      const freeMemoryGB = os.freemem() / 1024 ** 3;
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;

      // Philippine Date and Time
      const date = moment.tz("Asia/Manila").format("MMMM DD, YYYY");
      const time = moment.tz("Asia/Manila").format("hh:mm:ss A");

      const timeStart = Date.now();
      const infoMsg = await api.sendMessage("🔎| Checking system status...", event.threadID);

      const ping = Date.now() - timeStart;
      let pingStatus = ping < 1000 ? "✅| Smooth" : "⛔| Laggy";

      const systemInfo = `♡   ∩_∩
 （„• ֊ •„)♡
╭─∪∪────────────⟡
│ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗜𝗡𝗙𝗢
├───────────────⟡
│ ⏰ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘
│  ${uptimeFormatted}
├───────────────⟡
│ 👑 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢
│𝙾𝚂: ${os.type()} ${os.arch()}
│𝙽𝙾𝙳𝙴: ${process.version}
│𝚁𝙰𝙼: ${usedMemoryGB.toFixed(2)} GB / ${totalMemoryGB.toFixed(2)} GB
│𝙷𝙴𝙰𝙿: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
├───────────────⟡
│ ✅ 𝗢𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢
│𝙳𝙰𝚃𝙴: ${date}
│𝚃𝙸𝙼𝙴: ${time}
│𝙿𝙸𝙽𝙶: ${ping}𝚖𝚜
│𝚂𝚃𝙰𝚃𝚄𝚂: ${pingStatus}
│𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: 𝐑𝐢𝐜𝐤𝐲𝐲
╰───────────────⟡
`;

      return api.sendMessage(systemInfo, event.threadID, event.messageID);

    } catch (error) {
      console.error("Uptime Error:", error);
      api.sendMessage("❌ Error retrieving system info.", event.threadID);
    }
  },
};
