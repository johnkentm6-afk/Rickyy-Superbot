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

  async run({ api, event }) {
    const { threadID, messageID, senderID, body, type, messageReply } = event;
    
    // 1. Siguraduhin na may text ang message
    if (!body || typeof body !== "string") return;

    const triggerWords = ['pst', 'batako', 'pstpst'];
    const input = body.toLowerCase();
    const botID = api.getCurrentUserID();

    // 2. Iwasan ang loop (Huwag sasagot sa sarili)
    if (senderID === botID) return;

    // 3. Logic para sa trigger words
    const isTriggered = triggerWords.some(word => input.includes(word));
    
    // 4. Logic para sa reply sa bot
    const isReplyToBot = type === "message_reply" && messageReply && messageReply.senderID === botID;

    if (isTriggered || isReplyToBot) {
      let response;
      
      // Check kung owner ang nag-chat
      if (senderID === OWNER_UID) {
        response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
      }

      // Mag-send ng message at mag-heart react
      return api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          // Heart reaction sa message ng bot
          api.setMessageReaction("❤️", info.messageID, () => {}, true);
          // Heart reaction sa message ng user
          api.setMessageReaction("❤️", messageID, () => {}, true);
        }
      }, messageID);
    }
  }
};
