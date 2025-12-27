const fs = require('fs-extra');
const path = require('path');

const lockPath = path.resolve(__dirname, '..', '..', 'Data', 'nicklock.json');

if (!global.nickLockTimers) global.nickLockTimers = new Map();

function getData() {
    try {
        fs.ensureFileSync(lockPath);
        return fs.readJsonSync(lockPath, { throws: false }) || { locks: {} };
    } catch { return { locks: {} }; }
}

function saveData(data) {
    fs.writeJsonSync(lockPath, data, { spaces: 2 });
}

// 🛡️ FORCE CHECK NICKNAMES
function startNickCheck(api, threadID, lockedNick) {
    if (global.nickLockTimers.has(threadID)) clearInterval(global.nickLockTimers.get(threadID));

    const interval = setInterval(async () => {
        try {
            const info = await api.getThreadInfo(threadID);
            const myID = api.getCurrentUserID();

            // Check lahat ng members
            info.userInfo.forEach(async (user) => {
                // Wag pakialaman ang sarili (bot) para di mag-error
                if (user.id === myID) return;

                if (user.nickname !== lockedNick) {
                    await api.changeNickname(lockedNick, threadID, user.id);
                }
            });
        } catch (e) { }
    }, 20000); // Check every 20 seconds (Para iwas ban)

    global.nickLockTimers.set(threadID, interval);
}

module.exports = {
    config: {
        name: "nicklock",
        aliases: ["nlock"],
        version: "3.0.0",
        role: 1, // Mas maganda kung Admin lang gagamit nito
        author: "Gemini",
        description: "Hybrid Nickname Lock",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    // 1. RESUME AFTER RESTART
    onLoad({ api }) {
        const data = getData();
        if (data.locks) {
            Object.keys(data.locks).forEach(threadID => {
                startNickCheck(api, threadID, data.locks[threadID].nickname);
            });
        }
    },

    // 2. INSTANT EVENT LISTENER
    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        if (data.locks && data.locks[threadID] && logMessageType === "log:subscribe-nickname") {
            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id;

            if (logMessageData.nickname !== lockedNick) {
                // Wait 1 sec then revert
                setTimeout(() => {
                    api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (!err) api.setMessageReaction("👍", event.messageID, () => {});
                    });
                }, 1000);
            }
        }
    },

    // 3. MAIN COMMAND
    async run({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const data = getData();

        if (args[0] === "off") {
            if (global.nickLockTimers.has(threadID)) {
                clearInterval(global.nickLockTimers.get(threadID));
                global.nickLockTimers.delete(threadID);
            }
            if (data.locks[threadID]) {
                delete data.locks[threadID];
                saveData(data);
                return api.sendMessage("🔓 Nickname Lock DISABLED.", threadID, messageID);
            }
            return api.sendMessage("Wala namang naka-lock.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Anong nickname ang i-l-lock?", threadID, messageID);

            data.locks[threadID] = { nickname, lockedBy: senderID };
            saveData(data);

            // Initial Mass Change
            api.sendMessage("⏳ Locking nicknames...", threadID);
            const info = await api.getThreadInfo(threadID);
            for (const user of info.userInfo) {
                if (user.id !== api.getCurrentUserID()) {
                    await api.changeNickname(nickname, threadID, user.id);
                    await new Promise(r => setTimeout(r, 500)); // Delay para di spam
                }
            }

            // Start Force Check
            startNickCheck(api, threadID, nickname);
            return api.sendMessage(`🔒 ALL NICKNAMES LOCKED TO: "${nickname}"`, threadID, messageID);
        }

        return api.sendMessage("Usage: nicklock on [name] | off", threadID, messageID);
    }
};
