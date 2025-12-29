const handleCommand = require('./handle/handleCommand');
const handleEvent = require('./handle/handleEvent');
const handleReaction = require('./handle/handleReaction');
const handleReply = require('./handle/handleReply');
const handleNotification = require('./handle/handleNotification');
const handleCreateDatabase = require('./handle/handleCreateDatabase');
const handleAutoDetect = require('./handle/handleAutoDetect');
const logs = require('../utility/logs');

function listen({ api, client, Users, Threads, Currencies, config }) {
  return async (err, event) => {
    if (err) return;
    if (!event) return;
    
    try {
      await handleCreateDatabase({ api, event, Users, Threads });
      
      const botID = api.getCurrentUserID();
      // 🛡️ ADMIN & SELF-LISTEN CHECK:
      // isAdmin = true kung ikaw ang nag-chat O kung ang BOT mismo ang nag-chat.
      const isAdmin = config.ADMINBOT.includes(event.senderID) || event.senderID === botID;

      switch (event.type) {
        case 'message':
        case 'message_reply': {
          
          // Gatekeeper: Kung hindi Admin at hindi rin ang Bot mismo, ignore ang message.
          if (!isAdmin) return; 

          // Handlers para sa Admin at sa Bot (Self-Listen)
          await handleCommand({ api, event, client, Users, Threads, Currencies, config });
          await handleAutoDetect({ api, event, client, Users, Threads, config });
          await handleEvent({ api, event, client, Users, Threads, config });

          if (event.type === 'message_reply') {
            await handleReply({ api, event, client, Users, Threads, config });
          }
          break;
        }

        case 'event':
          await handleEvent({ api, event, client, Users, Threads, config });
          await handleNotification({ api, event, config });
          break;

        case 'message_reaction':
          // Papayagan ang reaction triggers kung Admin o ang Bot mismo.
          if (isAdmin) {
            await handleReaction({ api, event, config });
          }
          break;
      }
    } catch (error) {
      logs.error('LISTEN', error.message);
    }
  };
}

module.exports = listen;
