const fs = require('fs-extra');
const path = require('path');

const lockPath = path.join(__dirname, '../../Data/nicklock.json');

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
        version: "4.9.5",
        role: 1, 
        author: "Gemini / Edited for Raza",
        description: "Papalitan ang lahat pero ang nickname lang ng bot ang ilo-lock.",
        category: "Group",
        usages: "nicklock on [pangalan] | nicklock off",
        prefix: false
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        // Bantayan lang kung may nagpalit ng nickname
        if (logMessageType === "log:user-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; 
            const newNick = logMessageData.nickname;
            const botID = api.getCurrentUserID();

            // CHECK: Kung ang pinalitan ay ang BOT at hindi tugma sa lock name
            if (targetID === botID && newNick !== lockedNick) {
                // 3.5 seconds delay bago ibalik ang pangalan ng bot
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, botID, (err) => {
                        if (err) console.log(`[Nicklock] Error reverting bot name.`);
                    });
                }, 3500); 
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();
        const botID = api.getCurrentUserID();

        if (!args[0]) return api.sendMessage("Usage: nicklock on [name] or nicklock off", threadID, messageID);

        if (args[0] === "off") {
            if (!data.locks[threadID]) return api.sendMessage("🔓 Walang naka-lock na nickname ang bot dito.", threadID, messageID);
            delete data.locks[threadID];
            saveData(data);
            return api.sendMessage("🔓 Bot Nicklock is now OFF.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("⚠️ Kulang ang name. Example: nicklock on RICKYY BOT", threadID, messageID);

            // I-save sa database para sa bot lang
            data.locks[threadID] = { nickname };
            saveData(data);

            api.sendMessage(`🛡️ Sini-sync ang lahat sa "${nickname}"... (Bot nickname will be locked)`, threadID);

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;

                // Isang beses na pagpapalit sa LAHAT ng members
                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID);
                    await new Promise(r => setTimeout(r, 2000)); // Safe delay
                }
                
                return api.sendMessage("Lahat ng kasalukuyang bata mo sir rickyy ay naka-sync na✅. Ang nickname ko ay naka-lock na rin.", threadID, messageID);
            } catch (e) {
                // Kung mag-error, siguraduhin na ang BOT man lang ay mapalitan
                api.changeNickname(nickname, threadID, botID);
                return api.sendMessage("lock saved✅. Babantayan ko na ang nickname ko simula ngayon.", threadID, messageID);
            }
        }
    }
};
