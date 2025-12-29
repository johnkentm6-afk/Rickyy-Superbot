const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "banat", // Pinalitan ang name ng command para tumugma sa trigger mo
        aliases: ["attack"], // Nilagay ko rito ang attack para backup
        version: "4.1.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Silent Sequential attack with 10-15s random delay",
        category: "group",
        usages: "banat g [name] | banat off",
        cooldowns: 5,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID } = event;
        const galiPath = path.join(__dirname, 'data', 'gali.txt');

        if (!global.attackTimers) global.attackTimers = new Map();

        // 🛑 TRIGGER: banat off
        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearTimeout(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
            }
            return;
        }

        // 🚀 TRIGGER: banat g [name]
        if (args[0] === "g") {
            const targetName = args.slice(1).join(" ");
            
            // Safety checks
            if (!targetName) return;
            if (global.attackTimers.has(threadID)) return;

            let pambaraList = [];
            try {
                if (fs.existsSync(galiPath)) {
                    const content = fs.readFileSync(galiPath, 'utf-8');
                    pambaraList = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                }
            } catch (e) { return; }

            if (pambaraList.length === 0) return;

            let index = 0;

            const attackSequence = async () => {
                if (!global.attackTimers.has(threadID)) return;

                const finalMessage = `${targetName} ${pambaraList[index]}`;
                
                try { api.sendTypingIndicator(threadID, () => {}); } catch (e) {}

                setTimeout(() => {
                    api.sendMessage(finalMessage, threadID, (err, info) => {
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

            // Simulan agad ang loop (1 second delay)
            const startTimer = setTimeout(attackSequence, 1000);
            global.attackTimers.set(threadID, startTimer);

        } else {
            return; 
        }
    }
};
