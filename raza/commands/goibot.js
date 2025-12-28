const OWNER_UID = '61581956827969';
const OWNER_NAME = 'RICKYY';

const funnyResponses = [
  "hi master😊",
  "oo pogi ka bakit? 🙂",
  "yes master aso yan sila💕",
  "wala namang bitaw yan sila 😏",
  "haha oo mukang timba sila ✨",
  "wag master maawa ka sa kanila🙂",
  "tignan mo yung isa master ang pangit haha 🥺",
  "dog sila? gsgo haha😊",
  "patuwarin ko sila ? 💅",
  "haha mukang kamatis siya ?✨"
];

const ownerResponses = [
  "duraan ko naba sila ?",
  "hahahaa oo ang papangit nila",
  "yes? oo moka talaga yan silang timba ng boysen",
  "yes my master rickyy?",
  "hahahaa rickyyontop",
  "walang makakapalag sa konat mo",
];

module.exports = {
  config: {
    name: 'goibot',
    aliases: ['pst', 'batako'], // Dito mo palitan ang 'bot' kung gusto mo ng ibang tawag
    description: 'Simpleng reply bot na may auto heart reaction',
    usage: 'bot [any message]',
    category: 'Utility',
    prefix: false
  },

  async run({ api, event }) {
    const { threadID, messageID, senderID } = event;
    
    let response;
    if (senderID === OWNER_UID) {
      response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
    } else {
      response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
    }

    // Mag-send ng message at i-react ang sariling reply
    return api.sendMessage(response, threadID, (err, info) => {
      if (!err) {
        api.setMessageReaction("❤️", info.messageID, () => {}, true);
      }
    }, messageID);
  },

  async handleReply({ api, event }) {
    const { threadID, messageID, senderID } = event;
    
    let response;
    if (senderID === OWNER_UID) {
      response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
    } else {
      response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
    }

    // I-react muna ang message mo (yung reply mo sa bot)
    api.setMessageReaction("❤️", messageID, () => {}, true);

    // Pagkatapos, mag-reply ang bot at i-react din ang sarili niyang reply
    return api.sendMessage(response, threadID, (err, info) => {
      if (!err) {
        api.setMessageReaction("❤️", info.messageID, () => {}, true);
      }
    }, messageID);
  }
};
