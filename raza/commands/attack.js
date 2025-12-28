const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "attack",
        version: "1.6.0",
        author: "Rickyy / Gemini",
        role: 2,
        description: "Sequential attack mode gamit ang gali.txt",
        category: "group",
        usages: "attack on [name] | attack off",
        cooldowns: 15,
        prefix: false
    },

    run: async function({ api, args, event }) {
        const { threadID, messageID } = event;
        
        // Path papunta sa gali.txt base sa folder structure mo
        const galiPath = path.join(__dirname, 'data', 'gali.txt');

        if (!global.attackTimers) global.attackTimers = new Map();

        // OFF LOGIC
        if (args[0] === "off") {
            if (global.attackTimers.has(threadID)) {
                clearInterval(global.attackTimers.get(threadID));
                global.attackTimers.delete(threadID);
                return api.sendMessage("𝗣𝗮𝘂𝘀𝗲 𝗺𝘂𝗻𝗮, 𝗸𝗮𝘄𝗮𝘄𝗮 𝗸𝗮 𝗻𝗮 𝗺𝗮𝘀𝘆𝗮𝗱𝗼 𝘀𝗮𝗯𝗶 𝗻𝗴 𝗯𝗼𝘀𝘀 𝗸𝗼𝗻𝗴 𝘀𝗶 𝗥𝗶𝗰𝗸𝘆𝘆. ✅", threadID, messageID);
            } else {
                return api.sendMessage("𝗪𝗮𝗹𝗮𝗻𝗴 𝗮𝗰𝘁𝗶𝘃𝗲 𝗻𝗮 𝗮𝘁𝘁𝗮𝗰𝗸 𝗺𝗼𝗱𝗲 𝘀𝗮 𝘁𝗵𝗿𝗲𝗮𝗱 𝗻𝗮 𝗶𝘁𝗼.", threadID, messageID);
            }
        }

        // ON LOGIC
        if (args[0] === "on") {
            const targetName = args.slice(1).join(" ");
            
            if (!targetName) return api.sendMessage("𝗦𝗶𝗻𝗼 𝗮𝗻𝗴 𝗮𝗮𝘁𝗮𝗸𝗶𝗵𝗶𝗻 𝗸𝗼? (Usage: attack on [name])", threadID, messageID);

            if (global.attackTimers.has(threadID)) {
                return api.sendMessage("𝗠𝗮𝘆 𝗶𝗻𝗮𝗮𝘁𝗮𝗸𝗲 𝗽𝗮 𝗮𝗸𝗼, '𝗮𝘁𝘁𝗮𝗰𝗸 𝗼𝗳𝗳' 𝗺𝗼 𝗺𝘂𝗻𝗮.", threadID, messageID);
            }

            // BASAHIN ANG GALI.TXT
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

            api.sendMessage(`𝗖𝗼𝗽𝘆! 𝗔𝘁𝘁𝗮𝗰𝗸𝗶𝗻𝗴: "${targetName}" 👊\n𝗡𝗼 𝗺𝗲𝗿𝗰𝘆 𝗵𝗮𝗵𝗮𝗵𝗮 🥷🏻.`, threadID);

            let index = 0;
            let delay = 15000; // 15 seconds delay

            const interval = setInterval(async () => {
                // SUNOD-SUNOD NA PAG-SEND MULA SA GALI.TXT
                const finalMessage = `${targetName} ${pambaraList[index]}`;

                api.sendMessage(finalMessage, threadID, (err, info) => {
                    if (!err && info) {
                        api.setMessageReaction("😆", info.messageID, () => {}, true);
                    }
                });

                index++;
                
                // Pag umabot na sa dulo, balik sa simula
                if (index >= pambaraList.length) {
                    index = 0; 
                }
            }, delay);

            global.attackTimers.set(threadID, interval);
        } else {
            return api.sendMessage("Usage: attack on [name] | attack off", threadID, messageID);
        }
    }
};
                
