module.exports.config = {
    name: "fyt2",
    version: "1.2.0",
    role: 2, 
    credits: "... - Long LTD",
    description: "Looping Rage Mode with Auto-Reaction",
    commandCategory: "group",
    usages: "fyt2 [pangalan] | fyt2 stop",
    cooldowns: 15
};

if (!global.rageModeTimers) global.rageModeTimers = new Map();

module.exports.run = async function({ api, args, event }) {
    const { threadID, messageID } = event;
    const say = args.join(" ");
    
    // Check kung 'stop' o 'off' ang command
    if (args[0] === "stop" || args[0] === "off") {
        if (global.rageModeTimers.has(threadID)) {
            clearInterval(global.rageModeTimers.get(threadID));
            global.rageModeTimers.delete(threadID);
            return api.sendMessage("pause muna kawawa kana masyado sabi ng boss kong si rickyy.", threadID, messageID);
        } else {
            return api.sendMessage("walang active na rage mode sa thread na ito.", threadID, messageID);
        }
    }

    if (!say) return api.sendMessage("sino ang raratratin ko? (Usage: fyt2 [name])", threadID, messageID);

    if (global.rageModeTimers.has(threadID)) {
        return api.sendMessage("Rage mode is already running in this thread.", threadID, messageID);
    }

    let r = 15000; // 15 seconds delay base sa variable 'r' mo
    let messages = [
        `${say} antaba mo`,
        `${say} papalag kaba`,
        `${say} batokbatokan kita`,
        `${say} taba mo`,
        `${say} wala ka mama`,
        `${say} oo papa mo namatay dahil sa konat ko`,
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

    api.sendMessage(`copy bubugbogin ko na'to "${say}"\nno mercy hahaha 🥷🏻.`, threadID);

    let index = 0;
    const interval = setInterval(async () => {
        // I-send ang message
        api.sendMessage(messages[index], threadID, (err, info) => {
            if (!err) {
                api.setMessageReaction("😆", info.messageID, () => {}, true);
            }
        });

        index++;

        // LOOP LOGIC: Kung umabot na sa dulo, ibalik sa simula
        if (index >= messages.length) {
            index = 0; 
        }
    }, r);

    global.rageModeTimers.set(threadID, interval);
};
