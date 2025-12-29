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
    name: 'goibot_event',
    eventType: ['message', 'message_reply'], // Pakikinggan ang chat kahit hindi command
    description: 'Auto reply kahit naka Admin Only mode'
  },

  async run({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body) return;

    // Listahan ng mga salitang magpapa-trigger sa bot
    const triggerWords = ['pst', 'batako', 'pstpst'];
    const input = body.toLowerCase();

    // Check kung ang message ay naglalaman ng trigger words o reply sa bot
    const isTriggered = triggerWords.some(word => input.includes(word));
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (isTriggered || isReplyToBot) {
      let response;
      
      if (senderID === OWNER_UID) {
        response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
      }

      // Mag-send ng message at mag-auto heart reaction
      return api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          api.setMessageReaction("❤️", info.messageID, () => {}, true);
          // I-react din ang message ng user
          api.setMessageReaction("❤️", messageID, () => {}, true);
        }
      }, messageID);
    }
  }
};
        
