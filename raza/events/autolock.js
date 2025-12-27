const fs = require('fs-extra');
const path = require('path');

// Siguraduhing tama ang path papunta sa iyong Data folder
const dataPath = path.resolve(__dirname, '..', '..', 'Data', 'locks.json');

module.exports = {
    config: {
        name: "autolock",
        // Pakikinggan nito ang pagpapalit ng pangalan ng grupo at nicknames
        eventType: ["log:thread-name", "log:subscribe-nickname"],
        version: "1.1.0",
        author: "Gemini"
    },

    // Ginawang 'run' ang pangalan para tumugma sa handleEvent.js mo
    async run({ api, event, logMessageType, logMessageData }) {
        const { threadID, messageID } = event;
        
        // Check kung may database file na
        if (!fs.existsSync(dataPath)) return;
        
        let data;
        try {
            data = fs.readJsonSync(dataPath);
        } catch (e) {
            return;
        }

        // --- 1. LOGIC PARA SA GROUP NAME LOCK ---
        if (logMessageType === "log:thread-name" && data.group && data.group[threadID]) {
            const lockedName = data.group[threadID].name;
            
            // Kung ang pinalit na pangalan ay hindi tugma sa naka-lock
            if (logMessageData.name !== lockedName) {
                setTimeout(async () => {
                    try {
                        await api.setTitle(lockedName, threadID);
                        // Mag-auto react bilang kumpirmasyon
                        await api.setMessageReaction("🛡️", messageID);
                    } catch (e) {
                        console.log("Group Lock Error:", e.message);
                    }
                }, 1500); // Maikling delay para iwas spam block
            }
        }

        // --- 2. LOGIC PARA SA NICKNAME LOCK ---
        if (logMessageType === "log:subscribe-nickname" && data.nick && data.nick[threadID]) {
            const lockedNick = data.nick[threadID].name;
            const targetID = logMessageData.participant_id; // Ang taong binago ang nickname
            
            // Kung ang bagong nickname ay hindi tugma sa naka-lock
            if (logMessageData.nickname !== lockedNick) {
                setTimeout(async () => {
                    try {
                        // Itatama lang ang nickname ng taong nagpalit
                        await api.changeNickname(lockedNick, threadID, targetID);
                        await api.setMessageReaction("👍", messageID);
                    } catch (e) {
                        console.log("Nick Lock Error:", e.message);
                    }
                }, 1500);
            }
        }
    }
};
