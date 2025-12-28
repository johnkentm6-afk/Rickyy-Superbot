const logs = require('../../utility/logs');

async function handleNotification({ api, event, config }) {
  const { logMessageType, logMessageData, threadID } = event;
  const adminID = config.ADMINBOT[0];
  
  if (!adminID) return;
  
  try {
    // NOTIFICATION PARA SA ADMIN LANG: Kapag ang bot ay na-add sa bagong group
    if (logMessageType === 'log:subscribe') {
      const addedParticipants = logMessageData.addedParticipants || [];
      const botID = api.getCurrentUserID();
      const botAdded = addedParticipants.some(p => p.userFbId === botID);
      
      if (botAdded) {
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (e) {
          threadInfo = { threadName: 'Unknown Group' };
        }
        
        const groupName = threadInfo.threadName || 'Unknown Group';
        const memberCount = threadInfo.participantIDs?.length || 0;
        
        const message = `BOT ADDED TO NEW GROUP!
─────────────────
Group: ${groupName}
Thread ID: ${threadID}
Members: ${memberCount}
─────────────────
Use .approve ${threadID} to approve`;
        
        // I-pm ang admin, huwag sa group chat
        api.sendMessage(message, adminID);
        logs.info('NOTIFICATION', `Bot added to group: ${groupName} (${threadID})`);
      }
    }
    
    // NOTIFICATION PARA SA ADMIN LANG: Kapag ang bot ay na-kick o tinanggal
    if (logMessageType === 'log:unsubscribe') {
      const leftParticipantFbId = logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();
      
      if (leftParticipantFbId === botID) {
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (e) {
          threadInfo = { threadName: 'Unknown Group' };
        }
        
        const groupName = threadInfo.threadName || 'Unknown Group';
        
        const message = `BOT REMOVED FROM GROUP!
─────────────────
Group: ${groupName}
Thread ID: ${threadID}
─────────────────`;
        
        api.sendMessage(message, adminID);
        logs.info('NOTIFICATION', `Bot removed from group: ${groupName} (${threadID})`);
      }
    }

    // PAKITANDAAN: Inalis na natin ang logic para sa "Member Left" (taong umalis) 
    // at "Admin Added" (taong ginawang admin) para hindi na mag-spam sa GC.

  } catch (error) {
    logs.error('NOTIFICATION', error.message);
  }
}

module.exports = handleNotification;
