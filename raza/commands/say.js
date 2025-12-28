const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "Samir Œ / Edited for Raza",
    role: 0,
    category: "tts",
    description: "Gagawing boses ang iyong text (Google TTS).",
    usages: "say [text] | say [text] | [lang_code]",
    cooldowns: 5,
    prefix: false
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;

    let text = "";
    let lang = "tl"; // Default ay Tagalog (tl) o palitan ng 'en' para sa English

    // Kunin ang text kung ito ay reply sa isang message
    if (type === "message_reply") {
      text = messageReply.body;
    } else if (args.length > 0) {
      // Check kung may separator na "|" para sa language code
      const fullArgs = args.join(" ");
      if (fullArgs.includes("|")) {
        const splitArgs = fullArgs.split("|").map(arg => arg.trim());
        text = splitArgs[0];
        lang = splitArgs[1] || "tl";
      } else {
        text = fullArgs;
      }
    }

    if (!text) {
      return api.sendMessage("Magbigay ka ng text. Halimbawa: say kamusta ka na | tl", threadID, messageID);
    }

    // Siguraduhing may 'tmp' folder
    const tmpPath = path.join(__dirname, 'cache', `tts_${threadID}.mp3`);
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
      fs.ensureDirSync(path.join(__dirname, 'cache'));
    }

    try {
      // Google TTS API URL
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
      
      const response = await axios({
        method: "get",
        url: ttsUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(tmpPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `🗣️ Voice Message:`,
          attachment: fs.createReadStream(tmpPath)
        }, threadID, () => {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        }, messageID);
      });

      writer.on("error", (err) => {
        console.error(err);
        api.sendMessage("Nagka-error sa pagsulat ng audio file.", threadID, messageID);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("Hindi ma-convert ang text sa boses. Siguraduhing tama ang language code.", threadID, messageID);
    }
  }
};
