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
        version: "4.5.0",
        role: 1, 
        author: "Gemini",
        description: "Locks all members to a specific nickname and reverts changes.",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        // Makikinig sa kahit anong palit ng nickname
        if (logMessageType === "log:subscribe-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; // Ang taong nabago ang nickname

            // Kung ang bagong nickname ay hindi tugma sa naka-lock na pangalan
            if (logMessageData.nickname !== lockedNick) {
                // Delay para hindi ma-spam ng Messenger
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (err) {
                            console.log(`[Nicklock] Hindi maibalik ang nick ni ${targetID}. Kailangan ng Admin privileges.`);
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
            return api.sendMessage("🔓 Nickname lock is now DISABLED for this group.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Usage: nicklock on [name]", threadID, messageID);

            // Save muna ang settings
            data.locks[threadID] = { nickname };
            saveData(data);

            api.sendMessage(`🛡️ Nicklock ENABLED: Changing all members to "${nickname}"...`, threadID);

            // Kuhanin ang listahan ng lahat ng members sa thread
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;

                // Loop para palitan ang nickname ng lahat
                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID, (err) => {
                        if (err) console.log(`[Nicklock] Error sa pagpalit kay ${userID}`);
                    });
                    // Konting delay para hindi ma-ban ang bot sa sobrang bilis na request
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                return api.sendMessage("✅ All nicknames have been synced and locked.", threadID);
            } catch (error) {
                return api.sendMessage("❌ Failed to get member list. Make sure I am an Admin.", threadID, messageID);
            }
        }
    }
};
