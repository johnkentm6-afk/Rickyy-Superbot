const fs = require('fs-extra');
const path = require('path');

const dataPath = path.resolve(__dirname, '..', '..', 'Data', 'locks.json');

module.exports = {
    config: {
        name: "autolock",
        eventType: ["log:thread-name", "log:subscribe-nickname"],
        version: "1.2.0",
        author: "Gemini"
    },

    async run({ api, event, logMessageType, logMessageData }) {
        const { threadID, messageID } = event;
        if (!fs.existsSync(dataPath)) return;
        
        let data;
        try { data = fs.readJsonSync(dataPath); } catch (e) { return; }

        // --- 1. GROUP NAME LOCK (Gumagana na ito) ---
        if (logMessageType === "log:thread-name" && data.group?.[threadID]) {
            const lockedName = data.group[threadID].name;
            if (logMessageData.name !== lockedName) {
                setTimeout(async () => {
                    try {
                        await api.setTitle(lockedName, threadID);
                        await api.setMessageReaction("🛡️", messageID);
                    } catch (e) { console.log("G-Lock Error"); }
                }, 1500);
            }
        }

        // --- 2. NICKNAME LOCK (Updated Fix) ---
        if (logMessageType === "log:subscribe-nickname" && data.nick?.[threadID]) {
            const lockedNick = data.nick[threadID].name;
            
            // Mas siguradong paraan para makuha ang ID ng member na binago ang nick
            const targetID = logMessageData.participant_id || Object.keys(event.mentions)[0] || event.author;
            const newNick = logMessageData.nickname;

            // Kung ang pinalit ay hindi yung naka-lock, o kung tinanggal ang nickname (empty)
            if (newNick !== lockedNick) {
                setTimeout(async () => {
                    try {
                        // Siguraduhin na may targetID bago tawagin ang API
                        if (targetID) {
                            await api.changeNickname(lockedNick, threadID, targetID);
                            await api.setMessageReaction("👍", messageID);
                        }
                    } catch (e) { 
                        console.log("N-Lock Error: Baka hindi Admin ang bot."); 
                    }
                }, 1500);
            }
        }
    }
};
