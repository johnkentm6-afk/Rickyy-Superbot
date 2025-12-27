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

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData, author, messageID } = event;
        if (!fs.existsSync(dataPath)) return;
        const data = fs.readJsonSync(dataPath);

        // 1. Bantay sa Group Name
        if (logMessageType === "log:thread-name" && data.group[threadID]) {
            const lockedName = data.group[threadID].name;
            if (logMessageData.name !== lockedName) {
                setTimeout(async () => {
                    await api.setTitle(lockedName, threadID);
                    await api.setMessageReaction("🛡️", messageID); // Auto-reaction
                }, 2000);
            }
        }

        // 2. Bantay sa Nicknames
        if (logMessageType === "log:subscribe-nickname" && data.nick[threadID]) {
            const lockedNick = data.nick[threadID].name;
            const targetID = logMessageData.participant_id;
            if (logMessageData.nickname !== lockedNick) {
                setTimeout(async () => {
                    await api.changeNickname(lockedNick, threadID, targetID);
                    await api.setMessageReaction("👍", messageID); // Auto-reaction
                }, 2000);
            }
        }
    }
};
