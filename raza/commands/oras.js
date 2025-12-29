const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "oras",
    aliases: ["ilang oras kana sa gc", "ilang oras kana sa lgc"],
    version: "1.0.6",
    role: 2,
    author: "Rickyy / Gemini",
    description: "Sasagot sa Tagalog kung gaano na katagal online ang bot",
    category: "System",
    usages: "ilang oras kana sa gc",
    cooldowns: 5,
    prefix: false 
  },

  handleEvent: async function ({ api, event }) {
    const { body, senderID } = event;
    if (!body) return;

    const adminConfig = global.config.ADMINBOT || [];
    if (!adminConfig.includes(senderID)) return;

    // Trigger kung tinype mo ang eksaktong nasa usage mo
    if (body.toLowerCase() === "ilang oras kana sa gc") {
      return this.run({ api, event });
    }
  },

  run: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      api.setMessageReaction("❤️", messageID, (err) => {}, true);

      if (!global.startTime) return;

      const uptimeInSeconds = (Date.now() - global.startTime) / 1000;
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);

      const toTagalog = (num, unit) => {
        if (num === 0) return "";
        let nText = "";
        
        // Pinahabang listahan para maging puro salita ang output
        const names = {
          1: "isang", 2: "dalawang", 3: "tatlong", 4: "apat na", 5: "limang",
          6: "anim na", 7: "pitong", 8: "walong", 9: "siyam na", 10: "sampung",
          11: "labing-isang", 12: "labindalawang", 13: "labintatlong", 14: "labing-apat na", 15: "labinlimang",
          20: "dalawampung", 25: "dalawampu't limang", 30: "tatlumpung", 40: "apatnapung", 50: "limanpumung",
          60: "animnapung"
        };

        // Kung wala sa listahan sa itaas, gagamit pa rin ng numero (safety catch)
        nText = names[num] || `${num} na`;

        if (unit === "day") return `${nText} araw`;
        if (unit === "hour") return `${nText} oras`;
        if (unit === "min") return `${nText} minuto`;
        return "";
      };

      let dayTxt = toTagalog(days, "day");
      let hourTxt = toTagalog(hours, "hour");
      let minTxt = toTagalog(minutes, "min");

      let output = "";
      let parts = [dayTxt, hourTxt, minTxt].filter(Boolean);

      if (parts.length === 0) {
        output = "kaka-online ko lang sir Rickyy.";
      } else if (parts.length === 1) {
        output = `${parts[0]} na ako rito sir.`;
      } else {
        const huli = parts.pop();
        output = `${parts.join(", ")} at ${huli} na ako rito sir.`;
      }

      return api.sendMessage(output, threadID, messageID);

    } catch (error) {
      console.error(error);
    }
  },
};
