const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "3.2.0", // Updated version
        author: "Rickyy / Gemini",
        role: 2,
        description: "Sequential attack (Non-blocking typing indicator)",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');
        const STATUS_MSG_LIFESPAN = 5000; // 5 seconds bago burahin ang intro/off msg

        console.log(`[ATTACK] Triggered in thread: ${threadID}`);

        if (!global.attackTimers) global.attackTimers = new Map();

        // --- SAFE UNSEND FUNCTION ---
        const safeUnsend = (msgID) => {
            if (!msgID) return;
            try {
                if (typeof api.unsendMessage === 'function') {
                    setTimeout(() => {
                        api.unsendMessage(msgID, (err) => {
                            if (err) console.log("[ATTACK] Unsend ignore:", err.message);
                        });
                    }, STATUS_MSG_LIFESPAN);
                }
            } catch (e) {
                console.log("[ATTACK] Unsend error:", e.message);
            }
        };

        // --- OFF LOGIC ---
        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                console.log(`[ATTACK] Stopped in thread ${threadID}`);
                
                return api.sendMessage("𝗣𝗮𝘂𝘀𝗲 𝗺𝘂𝗻𝗮, 𝗸𝗮𝘄𝗮𝘄𝗮 𝗸𝗮 𝗻𝗮 𝗺𝗮𝘀𝘆𝗮𝗱𝗼 𝘀𝗮𝗯𝗶 𝗻𝗴 𝗯𝗼𝘀𝘀 𝗸𝗼𝗻𝗴 𝘀𝗶 𝗥𝗶𝗰𝗸𝘆𝘆.", threadID, (err, info) => {
                    if (!err && info) safeUnsend(info.messageID);
                }, messageID);
            } else {
                return api.sendMessage("buti nalang pinatay mo sir nakakaawa na", threadID, (err, info) => {
                    if (!err && info) safeUnsend(info.messageID);
                }, messageID);
            }
        }

        // --- ON LOGIC ---
        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            if (!targetName) return api.sendMessage("Usage: attack on [name]", threadID, messageID);
            
            if (global.attackTimers.has(threadID)) {
                return api.sendMessage("May aktibong attack pa, i-off muna.", threadID, messageID);
            }

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    console.log(`[ATTACK] Loaded ${pambaraList.length} lines.`);
                } else {
                    return api.sendMessage("❌ Error: gali.txt not found.", threadID, messageID);
                }
            } catch (e) {
                return api.sendMessage("❌ Error reading file.", threadID, messageID);
            }

            if (pambaraList.length === 0) return api.sendMessage("❌ Walang laman ang gali.txt.", threadID, messageID);

            // Send INTRO (tatagal ba...)
            api.sendMessage(`tatagal ba sakin yan si "${targetName}" 👊\n sir rickyy? hindi makakatulog sakin yan 🥷🏻.`, threadID, (err, info) => {
                if (!err && info) safeUnsend(info.messageID);
            });

            let index = 0;

            // --- ATTACK LOOP ---
            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                // FIX: Fire-and-forget typing indicator (Wag na antayin ang callback)
                // Para sigurado tayong tutuloy ang message sending kahit mag-fail ang typing api
                try { api.sendTypingIndicator(threadID, () => {}); } catch (e) {}

                // Delay nang konti (1.5s) para kunyari nagta-type, tapos SEND AGAD
                setTimeout(() => {
                    console.log(`[ATTACK] Sending line ${index + 1}...`); // Debug log
                    api.sendMessage(finalMessage, threadID, (err, info) => {
                        if (err) {
                            console.error("[ATTACK] Send Failed:", err);
                        } else if (info) {
                            // Reaction logic
                            setTimeout(() => {
                                api.setMessageReaction("😆", info.messageID, () => {}, true);
                            }, 1500);
                        }
                    });
                }, 1500);

                // Auto-loop index
                index = (index + 1) % pambaraList.length;

                // Next Timer (Random 5-10s)
                const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                const timer = setTimeout(attackSequence, randomDelay);
                global.attackTimers.set(threadID, timer);
            };

            // Start loop (2s delay start)
            const startTimer = setTimeout(attackSequence, 2000);
            global.attackTimers.set(threadID, startTimer);

        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
