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
        version: "4.1.0",
        role: 1, 
        author: "Gemini",
        description: "Reverts own nickname changes even if bot is not admin.",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        
        if (logMessageType === "log:subscribe-nickname") {
            const data = getData();
            if (!data.locks || !data.locks[threadID]) return;

            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; // Ang taong nabago ang nick
            const editorID = author; // Ang taong nagbago

            // LOGIC: Ibabalik lang kung ang nagbago ay ang mismong may-ari ng nickname
            // o kung ang binago ay ang nickname ng bot.
            if (logMessageData.nickname !== lockedNick) {
                if (targetID === editorID || targetID === api.getCurrentUserID()) {
                    setTimeout(() => {
                        api.changeNickname(lockedNick, threadID, targetID, (err) => {
                            if (err) console.log("Hindi maibalik: Limitasyon ng Messenger (Dapat Admin ang bot para sa iba).");
                        });
                    }, 1500);
                }
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();

        if (args[0] === "off") {
            delete data.locks[threadID];
            saveData(data);
            return api.sendMessage("🔓 Nickname lock OFF.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Usage: nicklock on [name]", threadID, messageID);

            data.locks[threadID] = { nickname };
            saveData(data);
            return api.sendMessage(`🛡️ Nicklock ON: "${nickname}"\n\n(Note: Mababantayan ko lang ang mga nagpapalit ng sarili nilang pangalan kung hindi ako Admin.)`, threadID, messageID);
        }
    }
};
