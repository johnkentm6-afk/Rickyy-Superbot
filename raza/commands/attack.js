const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "2.3.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Direct sequential attack mode with clean off and auto-loop",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');

        if (!global.attackTimers) global.attackTimers = new Map();

        // 🛑 CLEAN OFF LOGIC
        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                // Inalis ang dating mahabang message at ginawang simple
                return api.sendMessage("𝗔𝘁𝘁𝗮𝗰𝗸 𝗠𝗼𝗱𝗲: 𝗢𝗙𝗙.", threadID, messageID);
            } else {
                return api.sendMessage("Walang aktibong attack sa grupong ito.", threadID, messageID);
            }
        }

        // 🚀 ON LOGIC
        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            if (!targetName) return api.sendMessage("Usage: attack on [name]", threadID, messageID);
            if (global.attackTimers.has(threadID)) return api.sendMessage("May aktibong attack pa, i-off mo muna ang luma.", threadID, messageID);

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                } else {
                    return api.sendMessage("❌ Error: gali.txt not found.", threadID, messageID);
                }
            } catch (e) {
                return api.sendMessage("❌ Error reading file.", threadID, messageID);
            }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt.", threadID, messageID);

            let index = 0;

            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                api.sendTypingIndicator(threadID, () => {
                    setTimeout(() => {
                        api.sendMessage(finalMessage, threadID, (err, info) => {
                            if (!err && info) {
                                setTimeout(() => {
                                    api.setMessageReaction("😆", info.messageID, () => {}, true);
                                }, 1500);
                            }
                        }, messageID);
                    }, 1500); 
                });

                // 🔄 AUTO-LOOP LOGIC: Pag umabot sa dulo ng gali.txt, babalik sa index 0
                index = (index + 1) % pambaraList.length;

                // Randomized Delay (10-15s) para hindi ma-detect
                const nextDelay = Math.floor(Math.random() * 5000) + 10000;
                
                const timer = setTimeout(attackSequence, nextDelay);
                global.attackTimers.set(threadID, timer);
            };

            attackSequence();

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
