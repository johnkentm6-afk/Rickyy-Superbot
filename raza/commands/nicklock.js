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
        version: "4.9.2",
        role: 1, 
        author: "Gemini / Edited for Raza",
        description: "Pinipigilan ang pagpapalit ng nickname sa GC na may mas mabagal na delay.",
        category: "Group",
        usages: "nicklock on [pangalan] | nicklock off",
        prefix: false
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        if (logMessageType === "log:user-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; 
            const newNick = logMessageData.nickname;

            if (newNick !== lockedNick) {
                // 3.5 seconds delay bago ibalik
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (err) {
                            console.log(`[Nicklock] Error: Cannot revert nickname in ${threadID}.`);
                        }
                    });
                }, 3500); 
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();

        if (!args[0]) return api.sendMessage("Usage: nicklock on [name] or nicklock off", threadID, messageID);

        if (args[0] === "off") {
            if (!data.locks[threadID]) return api.sendMessage("🔓 Walang naka-lock na nickname rito.", threadID, messageID);
            delete data.locks[threadID];
            saveData(data);
            return api.sendMessage("🔓 Nicklock is now OFF.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("⚠️ Kulang ang name. Example: nicklock on POGI", threadID, messageID);

            data.locks[threadID] = { nickname };
            saveData(data);

            api.sendMessage(`🛡️ Nicklock ON. Sini-sync ang lahat sa "${nickname}"... (Please wait, slow sync enabled)`, threadID);

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const participantIDs = threadInfo.participantIDs;

                for (let userID of participantIDs) {
                    api.changeNickname(nickname, threadID, userID);
                    await new Promise(r => setTimeout(r, 2000)); 
                }
                return api.sendMessage("Lahat ng kasalukuyang bata mo sir rickyy ay naka-sync na✅.", threadID, messageID);
            } catch (e) {
                return api.sendMessage("lock saved✅. Babantayan ko na ang mga magpapalit simula ngayon.", threadID, messageID);
            }
        }
    }
}; // <--- Siguraduhing kasama ito hanggang dito
