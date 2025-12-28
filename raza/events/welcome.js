module.exports = {
  config: {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.1",
    author: "Rickyy / Gemini",
    description: "Auto-message kapag pumasok ang bot sa GC"
  },

  async run({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    // Siguraduhin na ang event ay log:subscribe (may pumasok sa GC)
    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData.addedParticipants;

      // Check kung ang bot ang kasama sa mga na-add
      if (addedParticipants.some(participant => participant.userFbId == botID || participant.id == botID)) {
        
        const botName = global.config.BOTNAME || "Raza Bot";
        const prefix = global.config.PREFIX || "/";

        const welcomeMessage = `Connected Successfully! ✅\n\nWelcome to the thread: "${threadID}"\n\nI am ${botName}, your assistant bot. Type "${prefix}help" to see my commands.\n\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: 𝐑𝐢𝐜𝐤𝐲𝐲`;

        // Mag-send ng message pagpasok na pagpasok
        return api.sendMessage(welcomeMessage, threadID);
      }
    }
  }
};
