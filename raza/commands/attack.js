const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "2.1.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Fast but safe sequential attack mode",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');

        if (!global.attackTimers) global.attackTimers = new Map();

        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                return api.sendMessage("𝗣𝗮𝘂𝘀𝗲 𝗺𝘂𝗻𝗮, 𝗸𝗮𝘄𝗮𝘄𝗮 𝗸𝗮 𝗻𝗮 𝗺𝗮𝘀𝘆𝗮𝗱𝗼 𝘀𝗮𝗯𝗶 𝗻𝗴 𝗯𝗼𝘀𝘀 𝗸𝗼𝗻𝗴 𝘀𝗶 𝗥𝗶𝗰𝗸𝘆𝘆.", threadID, messageID);
            } else {
                return api.sendMessage("Buti nalang pinatay mo sir, nakakaawa na.", threadID, messageID);
            }
        }

        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            if (!targetName) return api.sendMessage("𝗦𝗶𝗻𝗼 𝗮𝗻𝗴 𝗮𝗮𝘁𝗮𝗸𝗶𝗵𝗶𝗻 𝗸𝗼? (Usage: attack on [name])", threadID, messageID);
            if (global.attackTimers.has(threadID)) return api.sendMessage("𝗠𝗮𝘆 𝗶𝗻𝗮𝗮𝘁𝗮𝗸𝗲 𝗽𝗮 𝗮𝗸𝗼, '𝗮𝘁𝘁𝗮𝗰𝗸 𝗼𝗳𝗳' 𝗺𝗼 𝗺𝘂𝗻𝗮.", threadID, messageID);

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                } else {
                    return api.sendMessage("❌ Error: gali.txt not found sa data folder.", threadID, messageID);
                }
            } catch (e) {
                return api.sendMessage("❌ Error reading gali.txt.", threadID, messageID);
            }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt mo.", threadID, messageID);

            api.sendMessage(`Tatagal ba sakin yan si "${targetName}" 👊\nSir Rickyy? Hindi makakatulog sakin yan 🥷🏻.`, threadID);

            let index = 0;

            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                // 1. Typing Indicator (Binabaan ko sa 1.5 seconds para mabilis)
                api.sendTypingIndicator(threadID, () => {
                    setTimeout(() => {
                        // 2. Send Message
                        api.sendMessage(finalMessage, threadID, (err, info) => {
                            if (!err && info) {
                                // 3. Reaction Delay (1.5 seconds pagkatapos ng message)
                                setTimeout(() => {
                                    api.setMessageReaction("😆", info.messageID, () => {}, true);
                                }, 1500);
                            }
                        }, messageID);
                    }, 1500); 
                });

                index = (index + 1) % pambaraList.length;

                // 4. RANDOM DELAY BETWEEN 10 TO 15 SECONDS
                // Math.random() * (max - min) + min
                const nextDelay = Math.floor(Math.random() * 5000) + 10000; 
                
                const timer = setTimeout(attackSequence, nextDelay);
                global.attackTimers.set(threadID, timer);
            };

            // Simulan ang unang attack pagkalipas ng 2 seconds
            const firstTimer = setTimeout(attackSequence, 2000);
            global.attackTimers.set(threadID, firstTimer);

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
