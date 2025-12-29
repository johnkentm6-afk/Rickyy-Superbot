const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "2.6.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Sequential attack with randomized delay and 1-minute auto-unsend status",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');
        const UNSEND_DELAY = 60000; // 1 minute (60,000ms) para sa auto-unsend

        if (!global.attackTimers) global.attackTimers = new Map();

        // 🛑 OFF LOGIC
        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                
                // Ang dati mong "off" message na mag-u-unsend after 1 minute
                return api.sendMessage("𝗣𝗮𝘂𝘀𝗲 𝗺𝘂𝗻𝗮, 𝗸𝗮𝘄𝗮𝘄𝗮 𝗸𝗮 𝗻𝗮 𝗺𝗮𝘀𝘆𝗮𝗱𝗼 𝘀𝗮𝗯𝗶 𝗻𝗴 𝗯𝗼𝘀𝘀 𝗸𝗼𝗻𝗴 𝘀𝗶 𝗥𝗶𝗰𝗸𝘆𝘆.", threadID, (err, info) => {
                    if (!err) setTimeout(() => api.unsendMessage(info.messageID), UNSEND_DELAY);
                }, messageID);
            } else {
                return api.sendMessage("buti nalang pinatay mo sir nakakaawa na", threadID, (err, info) => {
                    if (!err) setTimeout(() => api.unsendMessage(info.messageID), UNSEND_DELAY);
                }, messageID);
            }
        }

        // 🚀 ON LOGIC
        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            if (!targetName) return api.sendMessage("𝗦𝗶𝗻𝗼 𝗮𝗻𝗴 𝗮𝗮𝘁𝗮𝗸𝗶𝗵𝗶𝗻 𝗸𝗼? (Usage: attack on [name])", threadID, messageID);
            
            if (global.attackTimers.has(threadID)) {
                return api.sendMessage("𝗠𝗮𝘆 𝗶𝗻𝗮𝗮𝘁𝗮𝗸𝗲 𝗽𝗮 𝗮𝗸𝗼, '𝗮𝘁𝘁𝗮𝗰𝗸 𝗼𝗳𝗳' 𝗺𝗼 𝗺𝘂𝗻𝗮.", threadID, messageID);
            }

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                } else {
                    return api.sendMessage("❌ Error: gali.txt not found sa data folder.", threadID, messageID);
                }
            } catch (e) {
                return api.sendMessage("❌ Error reading gali.txt file.", threadID, messageID);
            }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt mo.", threadID, messageID);

            // Ang dati mong panimulang message na mag-u-unsend after 1 minute
            api.sendMessage(`tatagal ba sakin yan si "${targetName}" 👊\n sir rickyy? hindi makakatulog sakin yan 🥷🏻.`, threadID, (err, info) => {
                if (!err) setTimeout(() => api.unsendMessage(info.messageID), UNSEND_DELAY);
            });

            let index = 0;

            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                // Human-like Typing
                api.sendTypingIndicator(threadID, () => {
                    setTimeout(() => {
                        api.sendMessage(finalMessage, threadID, (err, info) => {
                            if (!err && info) {
                                // Reaction Delay (1.5s) para iwas automation detection
                                setTimeout(() => {
                                    api.setMessageReaction("😆", info.messageID, () => {}, true);
                                }, 1500);
                            }
                        });
                    }, 1500); 
                });

                // Auto-loop: Balik sa simula kapag naubos ang text
                index = (index + 1) % pambaraList.length;

                // 🎲 RANDOM DELAY: 5 hanggang 10 seconds para hindi ma-detect ni FB
                const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                
                const timer = setTimeout(attackSequence, randomDelay);
                global.attackTimers.set(threadID, timer);
            };

            // Simulan ang sequence pagkatapos ng 2 seconds
            const startTimer = setTimeout(attackSequence, 2000);
            global.attackTimers.set(threadID, startTimer);

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
