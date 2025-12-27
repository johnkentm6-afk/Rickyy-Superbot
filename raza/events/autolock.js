const fs = require('fs-extra');
const path = require('path');

const dataPath = path.resolve(__dirname, '..', '..', 'Data', 'locks.json');

module.exports = {
    config: {
        name: "autolock",
        eventType: ["log:thread-name", "log:subscribe-nickname"],
        version: "1.0.0",
        author: "Gemini"
    },

    // Pinalitan ang 'handleEvent' ng 'run' para sa RDX engine
    async run({ api, event }) {
        const { threadID, logMessageType, logMessageData, messageID } = event;
        
        if (!fs.existsSync(dataPath)) return;
        const data = fs.readJsonSync(dataPath);

        // 1. Bantay sa Group Name
        if (logMessageType === "log:thread-name" && data.group && data.group[threadID]) {
            const lockedName = data.group[threadID].name;
            if (logMessageData.name !== lockedName) {
                setTimeout(async () => {
                    try {
                        await api.setTitle(lockedName, threadID);
                        await api.setMessageReaction("🛡️", messageID);
                    } catch (e) { console.log(e) }
                }, 2000);
            }
        }

        // 2. Bantay sa Nicknames (Reactive - yung nagpalit lang ang itatama)
        if (logMessageType === "log:subscribe-nickname" && data.nick && data.nick[threadID]) {
            const lockedNick = data.nick[threadID].name;
            const targetID = logMessageData.participant_id;
            
            if (logMessageData.nickname !== lockedNick) {
                setTimeout(async () => {
                    try {
                        await api.changeNickname(lockedNick, threadID, targetID);
                        await api.setMessageReaction("👍", messageID);
                    } catch (e) { console.log(e) }
                }, 2000);
            }
        }
    }
};
