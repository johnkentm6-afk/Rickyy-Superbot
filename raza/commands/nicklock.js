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
