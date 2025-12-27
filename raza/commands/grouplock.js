const fs = require('fs-extra');
const path = require('path');

// Gagamit tayo ng path.resolve para mas sigurado ang lokasyon sa Render
const groupLockPath = path.resolve(__dirname, '..', 'Data', 'grouplock.json');

function getData() {
    try {
        // Siguraduhin na gawa na ang folder at file bago basahin
        fs.ensureFileSync(groupLockPath);
        
        const content = fs.readFileSync(groupLockPath, 'utf8');
        if (!content) {
            fs.writeJsonSync(groupLockPath, { locks: {} });
            return { locks: {} };
        }
        return JSON.parse(content);
    } catch (error) {
        console.error("Error sa pagbasa ng Data:", error);
        return { locks: {} };
    }
}

function saveData(data) {
    fs.writeJsonSync(groupLockPath, data, { spaces: 2 });
}

module.exports = {
    config: {
        name: "grouplock",
        version: "1.0.0",
        role: 0,
        author: "Gemini",
        description: "Lock group name permanently",
        category: "Group",
        guide: "{pn} on [name] | off",
        countdown: 5
    },

    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        if (data.locks && data.locks[threadID] && logMessageType === "log:thread-name") {
            const lockedName = data.locks[threadID].name;
            if (logMessageData.name !== lockedName) {
                // 2 seconds delay gaya ng request mo
                setTimeout(async () => {
                    try {
                        await api.setTitle(lockedName, threadID);
                        await api.setMessageReaction("🛡️", event.messageID);
                    } catch (err) {
                        console.error("Auto-revert error:", err);
                    }
                }, 2000);
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID } = event;
        let data = getData();

        if (args[0] === "off") {
            if (!data.locks[threadID]) return api.sendMessage("Walang active na lock dito.", threadID, messageID);
            delete data.locks[threadID];
            saveData(data);
            return api.sendMessage("🔓 Group name lock disabled.", threadID, messageID);
        }

        if (args[0] === "on") {
            const name = args.slice(1).join(" ");
            if (!name) return api.sendMessage("Pakilagay ang pangalan na i-l-lock.", threadID, messageID);

            data.locks[threadID] = { name: name };
            saveData(data);

            try {
                await api.setTitle(name, threadID);
                await api.setMessageReaction("✅", messageID);
                return api.sendMessage(`🔒 Group name locked to: ${name}`, threadID, messageID);
            } catch (err) {
                return api.sendMessage("Error sa pag-set ng pangalan: " + err.message, threadID, messageID);
            }
        }

        return api.sendMessage("Usage: grouplock on [name] | off", threadID, messageID);
    }
};
