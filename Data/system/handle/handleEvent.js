const logs = require('../../utility/logs');
const Send = require('../../utility/send');

async function handleEvent({ api, event, client, Users, Threads, config }) {
  const { threadID, logMessageType, type } = event;
  
  // Tukuyin kung anong uri ng event ang dumarating
  const eventToCHeck = logMessageType || type;
  
  if (!eventToCHeck) return;
  
  // I-log lang kung ito ay isang system event para hindi ma-spam ang console
  if (logMessageType) {
    logs.event(logMessageType, threadID);
  }
  
  for (const [name, eventHandler] of client.events) {
    try {
      if (eventHandler.config.eventType) {
        const types = eventHandler.config.eventType;
        
        if (Array.isArray(types)) {
          if (!types.includes(eventToCHeck)) continue;
        } else if (types !== eventToCHeck) {
          continue;
        }
      }
      
      const send = new Send(api, event);
      
      await eventHandler.run({
        api,
        event,
        send,
        Users,
        Threads,
        config,
        client,
        logMessageType,
        logMessageData: event.logMessageData,
        logMessageBody: event.logMessageBody
      });
    } catch (error) {
      logs.error('EVENT', `Error in ${name}:`, error.message);
    }
  }
}

module.exports = handleEvent;
            
