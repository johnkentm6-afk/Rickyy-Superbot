const fs = require('fs-extra');
const path = require('path');

// Path papunta sa database
const lockPath = path.resolve(__dirname, '..', '..', 'Data', 'nicklock.json');

function getData() {
    try {
        fs.ensureFileSync(lockPath);
        return fs.readJsonSync(lockPath, { throws: false }) || { locks: {} };
    } catch { return { locks: {} }; }
}

function saveData(data) {
    fs.writeJsonSync(lockPath, data, { spaces: 2 });
}

module.exports = {
    config: {
        name: "nicklock",
        aliases: ["nlock"],
        version: "4.0.0", // Reactive Version
        role: 1, // Admin only recommended
        author: "Gemini",
        description: "Locks nickname. Reacts only when changed.",
        category: "Group",
        guide: "{pn} on [name] | off"
    },

    // 🛡️ DITO ANG FINAL DEFENSE (REACTIVE)
    // Gagana lang ito kapag may NAGPALIT ng nickname
    async handleEvent({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const data = getData();

        // Check kung:
        // 1. May lock data sa GC na ito
        // 2. Ang event ay tungkol sa pagpapalit ng nickname
        if (data.locks && data.locks[threadID] && logMessageType === "log:subscribe-nickname") {
            
            const lockedNick = data.locks[threadID].nickname;
            const targetID = logMessageData.participant_id; // Kung sino ang pinalitan
            const newNick = logMessageData.nickname; // Ano ang pinalit

            // Kung ang pinalit na nickname ay HINDI tugma sa naka-lock
            if (newNick !== lockedNick) {
                console.log(`[NICKLOCK] Detected change for ${targetID}. Reverting...`);
                
                // Maghintay ng 1 segundo bago ibalik (para di mag-overlap)
                setTimeout(async () => {
                    try {
                        // Ibalik ang nickname ng SPECIFIC na tao na 'yun lang
                        await api.changeNickname(lockedNick, threadID, targetID);
                        
                        // React 👍 para alam mong gumana
                        api.setMessageReaction("👍", event.messageID, () => {});
                    } catch (err) {
                        console.error("[NICKLOCK ERROR]", err);
                    }
                }, 1000);
            }
        }
    },

    async run({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const data = getData();

        if (args[0] === "off") {
            if (data.locks[threadID]) {
                delete data.locks[threadID];
                saveData(data);
                return api.sendMessage("🔓 Nickname Lock DISABLED. Malaya na silang magpalit.", threadID, messageID);
            }
            return api.sendMessage("Wala namang naka-lock na nickname dito.", threadID, messageID);
        }

        if (args[0] === "on") {
            const nickname = args.slice(1).join(" ");
            if (!nickname) return api.sendMessage("Anong nickname ang i-l-lock?", threadID, messageID);

            // I-save ang lock info
            data.locks[threadID] = { nickname, lockedBy: senderID };
            saveData(data);

            api.sendMessage(`🔒 NICKLOCK ENABLED.\n\nTarget: "${nickname}"\nStatus: Applying to all members one time...`, threadID);

            // 1. INITIAL MASS CHANGE (Isang beses lang gagawin)
            try {
                const info = await api.getThreadInfo(threadID);
                const myID = api.getCurrentUserID();

                // I-loop lahat ng member para i-set ang initial name
                for (const user of info.userInfo) {
                    // Wag galawin ang sarili (Bot) o kung tama na ang nickname
                    if (user.id === myID || user.nickname === nickname) continue;

                    await api.changeNickname(nickname, threadID, user.id);
                    // Maliit na delay para hindi ma-block ni Facebook (anti-spam)
                    await new Promise(r => setTimeout(r, 500)); 
                }

                return api.sendMessage(`✅ Tapos na! Lahat ay "${nickname}" na.\n\nNgayon, babantayan ko na lang kung may magtatangkang magpalit.`, threadID, messageID);
            
            } catch (err) {
                return api.sendMessage("May error sa pagpapalit ng nickname. Siguraduhing hindi restricted ang bot.", threadID, messageID);
            }
        }

        return api.sendMessage("Usage: nicklock on [name] | off", threadID, messageID);
    }
};
