const fs = require('fs-extra');
const path = require('path');

const lockPath = path.resolve(__dirname, '..', '..', 'Data', 'grouplock.json');

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

function startForceCheck(api, threadID, lockedName) {
    if (global.groupLockTimers.has(threadID)) {
        clearInterval(global.groupLockTimers.get(threadID));
    }

    const interval = setInterval(async () => {
        try {
            const info = await api.getThreadInfo(threadID);
            if (info.threadName !== lockedName) {
                await api.setTitle(lockedName, threadID);
            }
        } catch (err) {}
    }, 10000);

    global.groupLockTimers.set(threadID, interval);
}

module.exports = {
    config: {
        name: "grouplock",
        aliases: ["glock", "set"],
        version: "4.0.0",
        role: 2,
        author: "Gemini",
        description: "Silent Hybrid Lock: Events + Force Interval",
        category: "Group",
        guide: "{pn} g [name] | off"
    },

    onLoad({ api }) {
        const data = getData();
        if (data.locks) {
            Object.keys(data.locks).forEach(threadID => {
                const name = data.locks[threadID].name;
                startForceCheck(api, threadID, name);
            });
        }
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        if (data.locks && data.locks[threadID] && logMessageType === "log:thread-name") {
            const lockedName = data.locks[threadID].name;
            if (logMessageData.name !== lockedName) {
                api.setTitle(lockedName, threadID, (err) => {
                    if (!err) api.setMessageReaction("🛡️", event.messageID, () => {});
                });
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        const data = getData();

        // Usage: set off
        if (args[0] === "off") {
            if (global.groupLockTimers.has(threadID)) {
                clearInterval(global.groupLockTimers.get(threadID));
                global.attackTimers && global.attackTimers.delete(threadID); // Safety
                global.groupLockTimers.delete(threadID);
            }
            if (data.locks[threadID]) {
                delete data.locks[threadID];
                saveData(data);
            }
            // Tinanggal ang message reply para silent
            return;
        }

        // Usage: set g [name]
        if (args[0] === "g") {
            const name = args.slice(1).join(" ");
            if (!name) return;

            data.locks[threadID] = { name: name };
            saveData(data);

            await api.setTitle(name, threadID);
            startForceCheck(api, threadID, name);

            // Tinanggal ang message reply para silent
            return;
        }
    }
};
