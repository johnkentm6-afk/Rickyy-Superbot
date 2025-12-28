module.exports = {
  config: {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    author: "Rickyy / Gemini",
    description: "Mag-memessage ang bot kapag may bagong sali o kapag isinali ang bot sa GC."
  },

  async run({ api, event, Threads }) {
    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();

    // Check kung ang bot ang isinali sa GC
    if (logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
      
      // Kunin ang pangalan ng bot mula sa config
      const botName = global.config.BOTNAME || "Raza Bot";

      const welcomeMessage = `Connected Successfully!✅\n\nWelcome to the thread: "${threadID}"\n\nI am ${botName}, your assistant bot. Type "${global.config.PREFIX}help" to see my commands.\n\nPowered By: Rickyy`;

      // Mag-send ng message pagpasok na pagpasok
      return api.sendMessage(welcomeMessage, threadID);
    } 
    
    // Optional: Kung gusto mo ring may welcome message para sa IBANG tao (hindi bot)
    else {
      // Dito mo pwedeng ilagay ang logic kung gusto mong i-welcome pati ibang members
      // Pero sa ngayon, logic lang para sa bot ang nilagay ko gaya ng request mo.
    }
  }
};
