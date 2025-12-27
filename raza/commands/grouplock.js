const fs = require('fs-extra');
const path = require('path');

// Siguraduhin na tama ang path papunta sa Data folder mo
const lockPath = path.resolve(__dirname, '..', '..', 'Data', 'grouplock.json');

// Global variable para sa mga timers
if (!global.groupLockTimers) global.groupLockTimers = new Map();

function getData() {
    try {
        fs.ensureFileSync(lockPath);
        const data = fs.readJsonSync(lockPath, { throws: false });
        return data || { locks: {} };
    } catch {
        fs.writeJsonSync(lockPath, { locks: {} });
        return { locks: {} };
    }
}

function saveData(data) {
    fs.writeJsonSync(lockPath, data, { spaces: 2 });
}

// 🛡️ FORCE CHECK FUNCTION (Interval)
function startForceCheck(api, threadID, lockedName) {
    // Patayin muna kung may existing timer para hindi mag-doble
    if (global.groupLockTimers.has(threadID)) {
        clearInterval(global.groupLockTimers.get(threadID));
    }

    const interval = setInterval(async () => {
        try {
            const info = await api.getThreadInfo(threadID);
            // Kapag mali ang pangalan, ibalik agad
            if (info.threadName !== lockedName) {
                await api.setTitle(lockedName, threadID);
                console.log(`[FORCE-LOCK] Reverted group name in ${threadID}`);
            }
        } catch (err) {
            // Tahimik lang pag error para di mag-spam sa logs
        }
    }, 10000); // Check every 10 seconds (Safe sa rate limit)

    global.groupLockTimers.set(threadID, interval);
}

module.exports = {
    config: {
        name: "grouplock",
        aliases: ["glock"],
        version: "3.0.0",
        role: 2, // 0 = All users, 1 = Admin only
        author: "Gemini",
        description: "Hybrid Lock: Events + Force Interval",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    // 1. AUTO-START PAGKA-LOAD NG BOT
    onLoad({ api }) {
        const data = getData();
        if (data.locks) {
            Object.keys(data.locks).forEach(threadID => {
                const name = data.locks[threadID].name;
                startForceCheck(api, threadID, name);
                console.log(`[GROUPLOCK] Resumed protection for Thread: ${threadID}`);
            });
        }
    },

    // 2. INSTANT REACTION (Event Listener)
    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        if (data.locks && data.locks[threadID] && logMessageType === "log:thread-name") {
            const lockedName = data.locks[threadID].name;
            if (logMessageData.name !== lockedName) {
                // Instant revert (Event based)
                api.setTitle(lockedName, threadID, (err) => {
                    if (!err) api.setMessageReaction("🛡️", event.messageID, () => {});
                });
            }
        }
    },

    // 3. COMMAND CONTROLS
    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();

        if (args[0] === "off") {
            if (global.groupLockTimers.has(threadID)) {
                clearInterval(global.groupLockTimers.get(threadID));
                global.groupLockTimers.delete(threadID);
            }
            if (data.locks[threadID]) {
                delete data.locks[threadID];
                saveData(data);
                return api.sendMessage("Lock has been DISABLED na a-awa naman ako.", threadID, messageID);
            }
            return api.sendMessage("Wala namang naka-lock dito.", threadID, messageID);
        }

        if (args[0] === "on") {
            const name = args.slice(1).join(" ");
            if (!name) return api.sendMessage("Anong pangalan ang i-l-lock ko?", threadID, messageID);

            // Save sa database
            data.locks[threadID] = { name: name };
            saveData(data);

            // Set Title Agad
            await api.setTitle(name, threadID);

            // Simulan ang Force Check
            startForceCheck(api, threadID, name);

            return api.sendMessage(`lock on🔒 palitan nyo na mga pangt : "${name}"\n\nmakunat na spares ko:\n1. Miro (Instant)\n2. rickyy superficial `, threadID, messageID);
        }

        return api.sendMessage("Usage: grouplock on [name] | grouplock off", threadID, messageID);
    }
};
