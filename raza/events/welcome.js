module.exports = {
  config: {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.3",
    author: "Rickyy / Gemini",
    description: "Auto-message kapag pumasok ang bot sa thread"
  },

  async run({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData.addedParticipants;

      // Check kung ang bot ang pumasok
      if (addedParticipants.some(participant => participant.userFbId == botID || participant.id == botID)) {
        
        const welcomeMessage = `𝙬𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙩𝙝𝙚 𝙩𝙝𝙧𝙚𝙖𝙙: ${threadID}\n\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: 𝐑𝐢𝐜𝐤𝐲𝐲`;

        return api.sendMessage(welcomeMessage, threadID);
      }
    }
  }
};
