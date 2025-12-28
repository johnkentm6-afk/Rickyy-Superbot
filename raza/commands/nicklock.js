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
        version: "4.6.0",
        role: 1, 
        author: "Gemini",
        description: "Locks all members to a specific nickname and reverts changes.",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        // FIX: Idinagdag ang 'log:user-nickname' dahil ito ang lumalabas sa logs mo
        if (logMessageType === "log:subscribe-nickname" || logMessageType === "log:user-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            
            // Kunin ang ID ng tao (iba ang format depende sa log type)
            const targetID = logMessageData.participant_id || logMessageData.targetID; 

            // Kung ang bagong nickname ay hindi "pogi" (o kung ano man ang ni-lock mo)
            if (logMessageData.nickname !== lockedNick) {
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (err) console.log(`[Nicklock] Error: Hindi maibalik. Check if bot is Admin.`);
                    });
                }, 1000); // 1 second delay para iwas spam block
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

                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                return api.sendMessage("✅ All nicknames locked.", threadID);
            } catch (error) {
                return api.sendMessage("❌ Error syncing. Make sure I am Admin.", threadID, messageID);
            }
        }
    }
};
