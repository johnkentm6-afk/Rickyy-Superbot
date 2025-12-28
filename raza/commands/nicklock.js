const fs = require('fs-extra');
const path = require('path');

const lockPath = path.resolve(__dirname, '..', '..', 'Data', 'nicklock.json');

function getData() {
    try {
        if (!fs.existsSync(lockPath)) fs.writeJsonSync(lockPath, { locks: {} });
        return fs.readJsonSync(lockPath);
    } catch (e) { return { locks: {} }; }
}

function saveData(data) {
    fs.writeJsonSync(lockPath, data, { spaces: 2 });
}

module.exports = {
    config: {
        name: "nicklock",
        aliases: ["nlock"],
        version: "4.9.0",
        role: 1, 
        author: "Gemini",
        description: "Reverts nickname changes. (Note: Can only revert others if Bot is Admin)",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        if (logMessageType === "log:user-nickname" || logMessageType === "log:subscribe-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; 
            const newNick = logMessageData.nickname;
            const botID = api.getCurrentUserID();

            if (newNick !== lockedNick) {
                // Kung ang bot ang pinalitan ang nickname, ibabalik niya agad (Kahit hindi Admin)
                if (targetID === botID) {
                    return api.changeNickname(lockedNick, threadID, botID);
                }

                // Kung ibang member ang pinalitan, susubukan niyang ibalik (Gagana lang kung Admin siya)
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (err && targetID !== botID) {
                            console.log(`[Nicklock] Cannot revert ${targetID}: Bot is not Admin.`);
                        }
                    });
                }, 1500);
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();

        if (args[0] === "off") {
            delete data.locks[threadID];
            saveData(data);
            return api.sendMessage("🔓 Nicklock OFF.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Usage: nicklock on [name]", threadID, messageID);

            data.locks[threadID] = { nickname };
            saveData(data);

            // Susubukan palitan ang lahat (Mag-eerror sa log ang mga hindi bot kung hindi Admin)
            api.sendMessage(`🛡️ Nicklock ON: Synchronizing to "${nickname}"...`, threadID);

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;

                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID);
                    await new Promise(r => setTimeout(r, 500)); 
                }
            } catch (e) {
                // Kung hindi makuha ang thread info, palitan na lang ang sarili
                api.changeNickname(nickname, threadID, api.getCurrentUserID());
            }
            return api.sendMessage("✅ Nicklock activated. (Bot will strictly protect its own name; others require Admin status)", threadID);
        }
    }
};
