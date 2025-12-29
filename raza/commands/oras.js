const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "oras",
    aliases: ["ilangoras", "ilang-oras-kana-sa-gc"],
    version: "1.0.5",
    role: 0,
    author: "Rickyy / Gemini",
    description: "Sasagot sa Tagalog kung gaano na katagal online ang bot",
    category: "System",
    usages: "ilang oras kana sa gc",
    cooldowns: 5,
    prefix: false 
  },

  run: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      // 1. React ng Heart (❤️) sa command ng user
      api.setMessageReaction("❤️", messageID, (err) => {}, true);

      // 2. Calculate Uptime (Parehas sa uptime.js mo)
      const uptimeInSeconds = (Date.now() - global.startTime) / 1000;
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);

      // 3. Tagalog Translation Logic
      const toTagalog = (num, unit) => {
        if (num === 0) return "";
        let nText = "";
        
        // Basic translation for common numbers
        const names = {
          1: "isang", 2: "dalawang", 3: "tatlong", 4: "apat na", 5: "limang",
          10: "sampung", 20: "dalawampung", 25: "dalawampu't limang"
        };

        nText = names[num] || `${num} na`;

        if (unit === "day") return `${nText} araw`;
        if (unit === "hour") return `${nText} oras`;
        if (unit === "min") return `${nText} minuto`;
        return "";
      };

      let dayTxt = toTagalog(days, "day");
      let hourTxt = toTagalog(hours, "hour");
      let minTxt = toTagalog(minutes, "min");

      // 4. Buuin ang Sentence
      let output = "";
      let parts = [dayTxt, hourTxt, minTxt].filter(Boolean);

      if (parts.length === 0) {
        output = "Kaka-online ko lang sir Rickyy.";
      } else if (parts.length === 1) {
        output = `${parts[0]} na ako rito sir.`;
      } else {
        const huli = parts.pop();
        output = `${parts.join(", ")} at ${huli} na ako rito sir.`;
      }

      // 5. Send Response
      return api.sendMessage(output, threadID, messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("Hindi ko mabilang sir, parang nahihilo ako.", threadID);
    }
  },
};
        
