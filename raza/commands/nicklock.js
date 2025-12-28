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
        version: "4.7.0",
        role: 1, 
        author: "Gemini",
        description: "Locks all members to a specific nickname and strictly reverts changes.",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        // Kinukuha ang log:user-nickname base sa Render logs mo
        if (logMessageType === "log:user-nickname" || logMessageType === "log:subscribe-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; // Ang ID ng taong binago ang nick

            // TRICK: Force revert kung ang bagong nickname ay hindi eksaktong kapareho ng lock name
            if (logMessageData.nickname !== lockedNick) {
                // Maikling delay para hindi mag-loop ang bot sa sarili niyang action
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (err) console.log(`[Nicklock] Failed to revert for ${targetID}. Bot might not be admin.`);
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
            return api.sendMessage("🔓 Nickname lock is now DISABLED.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Usage: nicklock on [name]", threadID, messageID);

            data.locks[threadID] = { nickname };
            saveData(data);

            api.sendMessage(`🛡️ Nicklock ENABLED: Syncing all members to "${nickname}"...`, threadID);

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;

                // Sync nicknames of all members
                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID);
                    await new Promise(resolve => setTimeout(resolve, 700)); // Delay para iwas spam
                }
                return api.sendMessage("✅ All nicknames are now locked.", threadID);
            } catch (error) {
                return api.sendMessage("❌ Error during sync. Ensure I am a Group Admin.", threadID, messageID);
            }
        }
    }
};
