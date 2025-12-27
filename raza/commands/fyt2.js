module.exports.config = {
    name: "fyt2",
    version: "1.1.0",
    role: 2, // Mapapansin mo pinalitan ko ng 'role' base sa standard ng raza engine mo
    credits: "... - Long LTD",
    description: "Rage Mode with Auto-Reaction",
    commandCategory: "group",
    usages: "fyt2 [pangalan] | fyt2 stop",
    cooldowns: 15
};

// Ginagamit ang 'global' para hindi mag-reset ang timer at status
if (!global.rageModeTimers) global.rageModeTimers = new Map();

module.exports.run = async function({ api, args, event }) {
    const { threadID, messageID } = event;
    const say = args.join(" ");
    
    // Check kung 'stop' ang command
    if (args[0] === "stop") {
        if (global.rageModeTimers.has(threadID)) {
            clearInterval(global.rageModeTimers.get(threadID));
            global.rageModeTimers.delete(threadID);
            return api.sendMessage("pause muna kawawa kana masyado sabi ng boss kong si rickyy.", threadID, messageID);
        } else {
            return api.sendMessage("walang active na rage mode sa thread na ito.", threadID, messageID);
        }
    }

    if (!say) return api.sendMessage("sino ang raratratin ko? (Usage: fyt2 [name])", threadID, messageID);

    // Kung tumatakbo na sa thread na ito, huwag nang ulitin
    if (global.rageModeTimers.has(threadID)) {
        return api.sendMessage("Rage mode is already running in this thread.", threadID, messageID);
    }

    let r = 15000; // 10 seconds delay para safe sa spam
    let messages = [
        `${say} antaba mo`,
        `${say} papalag kaba`,
        `${say} batokbatokan kita`,
        `${say} taba mo`,
        `${say} wala ka mama`,
        `${say} oo papa ma namatay dahil sa konat ko`,
        `${say} nanay mo kinantot ko habang naka tingin ka`,
        `${say} bading amp hahaa`,
        `${say} nanay mo shockla`,
        `${say} bading ka nga?`,
        `${say} gooding🤣🤣🤣`,
        `${say} hwhahahahaa`,
        `${say} */silent 1`,
        `${say} */silent 2`,
        `${say} */silent 3`,
        `${say} */silent 4`,
        `${say} */silent 5`,
        `${say} */silent 6`,
        `${say} */silent 7`,
        `${say} */silent 8`,
        `${say} */silent 9`,
        `${say} */silent 10`
    ];

    api.sendMessage(`copy bubugbogin ko na'to "${say}"\nDelay: none hahaha🥷🏻.`, threadID);

    let index = 0;
    const interval = setInterval(async () => {
        if (index < messages.length) {
            // I-send ang message at kunin ang info para sa reaction
            api.sendMessage(messages[index], threadID, (err, info) => {
                if (!err) {
                    // Auto reaction (😆)
                    api.setMessageReaction("😆", info.messageID, () => {}, true);
                }
            });
            index++;
        } else {
            // Kapag tapos na ang listahan, itigil na ang timer
            clearInterval(global.rageModeTimers.get(threadID));
            global.rageModeTimers.delete(threadID);
            api.sendMessage(`✅ Finished rattling ${say}.`, threadID);
        }
    }, r);

    // I-save ang interval reference sa global map
    global.rageModeTimers.set(threadID, interval);
};
