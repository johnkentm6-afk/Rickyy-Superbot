const fs = require('fs-extra');
const path = require('path');

// Siguraduhin na ang path ay papunta sa "Data" folder na nakita ko sa screenshot mo
const groupLockPath = path.join(__dirname, '../Data/grouplock.json');

function getData() {
    if (!fs.existsSync(groupLockPath)) fs.writeJsonSync(groupLockPath, { locks: {} });
    return fs.readJsonSync(groupLockPath);
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

    // Ito ang taga-bantay
    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        if (data.locks[threadID] && logMessageType === "log:thread-name") {
            const lockedName = data.locks[threadID].name;
            if (logMessageData.name !== lockedName) {
                return api.setTitle(lockedName, threadID, (err) => {
                    if (!err) api.setMessageReaction("🛡️", event.messageID);
                });
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, senderID } = event;
        let data = getData();

        if (args[0] === "off") {
            delete data.locks[threadID];
            fs.writeJsonSync(groupLockPath, data);
            return api.sendMessage("🔓 Group name lock disabled.", threadID);
        }

        if (args[0] === "on") {
            const name = args.slice(1).join(" ");
            if (!name) return api.sendMessage("Pakilagay ang pangalan.", threadID);

            data.locks[threadID] = { name: name };
            fs.writeJsonSync(groupLockPath, data);

            await api.setTitle(name, threadID);
            return api.sendMessage(`🔒 Group name locked to: ${name}`, threadID);
        }

        return api.sendMessage("Usage: grouplock on [name] | off", threadID);
    }
};
