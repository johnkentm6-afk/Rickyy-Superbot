const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "3.4.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Sequential attack with 10-15s random delay (No error protection, clean logs)",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');
        const STATUS_MSG_LIFESPAN = 5000; 

        if (!global.attackTimers) global.attackTimers = new Map();

        const safeUnsend = (msgID) => {
            if (!msgID) return;
            try {
                if (typeof api.unsendMessage === 'function') {
                    setTimeout(() => {
                        api.unsendMessage(msgID, (err) => {
                            if (err) {} // Silent unsend fail
                        });
                    }, STATUS_MSG_LIFESPAN);
                }
            } catch (e) {}
        };

        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                
                return api.sendMessage("𝗣𝗮𝘂𝘀𝗲 𝗺𝘂𝗻𝗮, 𝗸𝗮𝘄𝗮𝘄𝗮 𝗸𝗮 𝗻𝗮 𝗺𝗮𝘀𝘆𝗮𝗱𝗼 𝘀𝗮𝗯𝗶 𝗻𝗴 𝗯𝗼𝘀𝘀 𝗸𝗼𝗻𝗴 𝘀𝗶 𝗥𝗶𝗰𝗸𝘆𝘆.", threadID, (err, info) => {
                    if (!err && info) safeUnsend(info.messageID);
                }, messageID);
            } else {
                return api.sendMessage("buti nalang pinatay mo sir nakakaawa na", threadID, (err, info) => {
                    if (!err && info) safeUnsend(info.messageID);
                }, messageID);
            }
        }

        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            if (!targetName) return api.sendMessage("Usage: attack on [name]", threadID, messageID);
            if (global.attackTimers.has(threadID)) return api.sendMessage("May aktibong attack pa, i-off muna.", threadID, messageID);

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                } else {
                    return api.sendMessage("❌ Error: gali.txt not found.", threadID, messageID);
                }
            } catch (e) { return api.sendMessage("❌ Error reading file.", threadID, messageID); }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt.", threadID, messageID);

            api.sendMessage(`tatagal ba sakin yan si "${targetName}" 👊\n sir rickyy? hindi makakatulog sakin yan 🥷🏻.`, threadID, (err, info) => {
                if (!err && info) safeUnsend(info.messageID);
            });

            let index = 0;

            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                try { api.sendTypingIndicator(threadID, () => {}); } catch (e) {}

                setTimeout(() => {
                    // Removed: console.log for "Sending line X of Y" to avoid spam in logs
                    api.sendMessage(finalMessage, threadID, (err, info) => {
                        // Removed: Error protection logic. Loop continues regardless of message failure.
                        if (info) {
                            setTimeout(() => {
                                api.setMessageReaction("😆", info.messageID, () => {}, true);
                            }, 2000); 
                        }
                    });
                }, 2000);

                index = (index + 1) % pambaraList.length;

                // 🎲 RANDOM DELAY: 10 to 15 seconds
                const randomDelay = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
                
                const timer = setTimeout(attackSequence, randomDelay);
                global.attackTimers.set(threadID, timer);
            };

            const startTimer = setTimeout(attackSequence, 3000);
            global.attackTimers.set(threadID, startTimer);

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
                
