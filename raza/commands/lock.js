const fs = require('fs-extra');
const path = require('path');

const dataPath = path.resolve(__dirname, '..', '..', 'Data', 'locks.json');

function getData() {
    if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { group: {}, nick: {} });
    return fs.readJsonSync(dataPath);
}

module.exports = {
    config: {
        name: "lock",
        version: "1.0.0",
        role: 0,
        author: "Gemini",
        description: "Lock Group Name or Nicknames",
        category: "Group",
        guide: "{pn} group [name] | {pn} nick [name] | {pn} off [group/nick]",
        countdown: 5
    },

    async run({ api, event, args, send }) {
        const { threadID, messageID } = event;
        let data = getData();
        const type = args[0]?.toLowerCase();

        if (type === "off") {
            const subType = args[1]?.toLowerCase();
            if (subType === "group") delete data.group[threadID];
            else if (subType === "nick") delete data.nick[threadID];
            else return send.reply("Gamitin: lock off group O lock off nick");
            
            fs.writeJsonSync(dataPath, data);
            return send.reply(`🔓 Disabled ${subType} lock.`);
        }

        if (type === "group") {
            const name = args.slice(1).join(" ");
            if (!name) return send.reply("Anong pangalan ng grupo?");
            data.group[threadID] = { name: name };
            fs.writeJsonSync(dataPath, data);
            await api.setTitle(name, threadID);
            return send.reply(`🔒 Group Name locked to: ${name}`);
        }

        if (type === "nick") {
            const name = args.slice(1).join(" ");
            if (!name) return send.reply("Anong nickname ang i-l-lock sa lahat?");
            data.nick[threadID] = { name: name };
            fs.writeJsonSync(dataPath, data);
            
            send.reply("⏳ Nagsisimulang palitan ang lahat...");
            const info = await api.getThreadInfo(threadID);
            for (const id of info.participantIDs) {
                if (id != api.getCurrentUserID()) {
                    await api.changeNickname(name, threadID, id);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            return send.reply(`🔒 All nicknames locked to: ${name}`);
        }

        return send.reply("Gamitin:\n!lock group [name]\n!lock nick [name]\n!lock off group/nick");
    }
};
