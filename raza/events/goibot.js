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
    description: 'Auto reply with smart loop protection for Self-Listen',
    credits: 'RICKYY'
  },

  async run({ api, event }) {
    const { threadID, messageID, senderID, body, type, messageReply } = event;
    
    if (!body || typeof body !== "string") return;

    const triggerWords = ['pst', 'batako', 'pstpst'];
    const input = body.toLowerCase();
    const botID = api.getCurrentUserID();

    // --- SMART LOOP PROTECTION ---
    // 1. Kung ang message ay reply sa sarili niyang reply, STALEMATE. Hihinto na ang bot.
    if (type === "message_reply" && messageReply && messageReply.senderID === botID && senderID === botID) {
        return;
    }

    // 2. Logic para sa triggers
    const isTriggered = triggerWords.some(word => input.includes(word));
    const isReplyToBot = type === "message_reply" && messageReply && messageReply.senderID === botID;

    if (isTriggered || isReplyToBot) {
      let response;
      
      // Check kung ikaw ang nag-chat (Owner UID) o yung Bot account mismo
      if (senderID === OWNER_UID || senderID === botID) {
        response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
      }

      // Mag-send ng message
      return api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          // React sa bot message
          api.setMessageReaction("❤️", info.messageID, () => {}, true);
          // React sa user/bot account message
          api.setMessageReaction("❤️", messageID, () => {}, true);
        }
      }, messageID);
    }
  }
};
