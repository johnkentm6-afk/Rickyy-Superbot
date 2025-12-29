const handleCommand = require('./handle/handleCommand');
const handleEvent = require('./handle/handleEvent');
const handleReaction = require('./handle/handleReaction');
const handleReply = require('./handle/handleReply');
const handleNotification = require('./handle/handleNotification');
const handleCreateDatabase = require('./handle/handleCreateDatabase');
const handleAutoDetect = require('./handle/handleAutoDetect');
const logs = require('../utility/logs');
const path = require('path');

// NILINIS: Inalis ang resendModule try-catch block para mawala ang error sa logs.

function listen({ api, client, Users, Threads, Currencies, config }) {
  return async (err, event) => {
    if (err) {
      logs.error('LISTEN', err.message || err);
      return;
    }
    
    if (!event) return;
    
    try {
      await handleCreateDatabase({ api, event, Users, Threads });
      
      switch (event.type) {
        case 'message':
        case 'message_reply': {
          const body = event.body ? event.body.toLowerCase() : "";
          const botID = api.getCurrentUserID();
          
          // NILINIS: Inalis ang manual "Admin Filter" dito para hindi na mag-conflict sa goibot event.
          // Ang Admin Only mode ay dapat hinahawakan sa loob ng handleCommand.js para hindi ma-block ang events.

          await handleCommand({
            api, event, client, Users, Threads, Currencies, config
          });
          
          await handleAutoDetect({
            api, event, client, Users, Threads, config
          });
          
          if (event.type === 'message_reply') {
            await handleReply({
              api, event, client, Users, Threads, config
            });
          }
          break;
        }
          
        case 'event':
          await handleEvent({
            api, event, client, Users, Threads, config
          });
          
          await handleNotification({ api, event, config });
          break;
          
        case 'message_reaction':
          await handleReaction({ api, event, config });
          break;
          
        default:
          break;
      }
    } catch (error) {
      logs.error('LISTEN', error.message);
    }
  };
}

module.exports = listen;
