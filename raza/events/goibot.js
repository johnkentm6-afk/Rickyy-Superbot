const OWNER_UID = '61581956827969';

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
    eventType: ["message", "message_reply"], 
    description: 'Auto reply kahit naka Admin Only mode',
    credits: 'RICKYY'
  },

  async handleEvent({ api, event }) {
    const { threadID, messageID, senderID, body, type, messageReply } = event;
    
    // Siguraduhin na may laman ang message
    if (!body) return;

    const triggerWords = ['pst', 'batako', 'pstpst'];
    const input = body.toLowerCase();
    const botID = api.getCurrentUserID();

    // 1. Check kung naglalaman ng trigger word
    const isTriggered = triggerWords.some(word => input.includes(word));
    
    // 2. Check kung reply ito sa bot
    const isReplyToBot = type === "message_reply" && messageReply.senderID === botID;

    if (isTriggered || isReplyToBot) {
      // Huwag pansinin kung ang bot mismo ang nag-chat (iwas loop)
      if (senderID === botID) return;

      let response;
      if (senderID === OWNER_UID) {
        response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
      }

      return api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          // Heart reaction sa reply ng bot
          api.setMessageReaction("❤️", info.messageID, () => {}, true);
          // Heart reaction sa message ng user
          api.setMessageReaction("❤️", messageID, () => {}, true);
        }
      }, messageID);
    }
  }
};
