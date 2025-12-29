const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "3.1.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Sequential attack with safe auto-unsend",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        // Siguraduhin na tama ang folder: raza/commands/data/gali.txt
        const galiPath = path.join(__dirname, 'data', 'gali.txt');
        const STATUS_MSG_LIFESPAN = 5000; // 5 seconds bago burahin

        console.log(`[ATTACK] Command triggered in thread: ${threadID}`);

        if (!global.attackTimers) global.attackTimers = new Map();

        // Helper function para safe na mag-unsend (Iwas crash)
        const safeUnsend = (msgID) => {
            if (!msgID) return;
            try {
                // Check kung may unsend function ang API mo
                if (typeof api.unsendMessage === 'function') {
                    setTimeout(() => {
                        api.unsendMessage(msgID, (err) => {
                            if (err) console.log("[ATTACK] Failed to unsend (ignore):", err.message);
                        });
                    }, STATUS_MSG_LIFESPAN);
                } else {
                    console.log("[ATTACK] API does not support unsendMessage. Skipping unsend.");
                }
            } catch (e) {
                console.log("[ATTACK] Error in unsend logic:", e.message);
            }
        };

        // 🛑 OFF LOGIC
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
                    console.log(`[ATTACK] Loaded ${pambaraList.length} lines from gali.txt`);
                } else {
                    console.log("[ATTACK] gali.txt not found!");
                    return api.sendMessage("❌ Error: gali.txt not found sa data folder.", threadID, messageID);
                }
            } catch (e) {
                console.log("[ATTACK] Error reading file:", e.message);
                return api.sendMessage("❌ Error reading gali.txt file.", threadID, messageID);
            }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt mo.", threadID, messageID);

            // Send INTRO message -> tapos UNSEND after 5 seconds
            api.sendMessage(`tatagal ba sakin yan si "${targetName}" 👊\n sir rickyy? hindi makakatulog sakin yan 🥷🏻.`, threadID, (err, info) => {
                if (!err && info) safeUnsend(info.messageID);
            });

            let index = 0;

            // Attack Loop
            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                api.sendTypingIndicator(threadID, () => {
                    api.sendMessage(finalMessage, threadID, (err, info) => {
                        if (err) {
                            console.log("[ATTACK] Error sending message:", err);
                            return; // Skip reaction if send failed
                        }
                        if (info) {
                            setTimeout(() => {
                                api.setMessageReaction("😆", info.messageID, (err) => {}, true);
                            }, 1500);
                        }
                    });
                });

                index = (index + 1) % pambaraList.length;

                // Random delay: 5 to 10 seconds
                const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                
                const timer = setTimeout(attackSequence, randomDelay);
                global.attackTimers.set(threadID, timer);
            };

            // Start delay
            const startTimer = setTimeout(attackSequence, 2000);
            global.attackTimers.set(threadID, startTimer);

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
