module.exports.config = {
    name: "fyt2",
    version: "1.0.0",
    hasPermission: 2,
    credits: "... - Long LTD",
    description: "Rage Mode",
    commandCategory: "group",
    usages: "fyt2",
    cooldowns: 10,
    dependencies: {
        "fs-extra": "",
        "axios": ""
    }
}

let interval; // Variable to hold the interval reference
let isRunning = false; // Flag to check if it's already running

module.exports.run = async function({ api, args, Users, event }) {
    var say = args.join(" ");
    var n = say;
    let r = 7000;  // Set delay to 7 seconds (7000 ms)

    // Function to send a message to the thread
    var sendMessage = function(msg) { 
        api.sendMessage(msg, event.threadID); 
    };

    // List of messages to be sent
    let messages = [
        `${n} antaba mo`,
        `${n} papalag kaba`,
        `${n} batokbatokan kita`,
        `${n} taba mo`,
        `${n} wala ka mama`,
        `${n} oo papa ma namatay dahil sa konat ko`,
        `${n} nanay mo kinantot ko habang naka tingin ka`,
        `${n} bading amp hahaa`,
        `${n} nanay mo shockla`,
        `${n} bading ka nga?`,
        `${n} gooding🤣🤣🤣`,
        `${n} hwhahahahaa`,
        `${n} */silent 1`,
        `${n} */silent 2`,
        `${n} */silent 3`,
        `${n} */silent 4`,
        `${n} */silent 5`,
        `${n} */silent 6`,
        `${n} */silent 7`,
        `${n} */silent 8`,
        `${n} */silent 9`,
        `${n} */silent 10`
    ];

    if (args.includes('stop')) {
        // If 'stop' is triggered, clear the interval and stop the messages
        if (isRunning) {
            clearInterval(interval);
            sendMessage(`${n} The rage mode has been stopped.`);
            isRunning = false; // Reset flag
        }
        return; // Stop the execution here
    }

    // If rage mode isn't running yet, start it
    if (!isRunning) {
        isRunning = true; // Set flag to prevent multiple intervals

        let index = 0;
        interval = setInterval(() => {
            if (index < messages.length) {
                sendMessage(messages[index]);
                index++;
            } else {
                clearInterval(interval);  // Stop the interval after all messages are sent
                isRunning = false; // Reset flag
            }
        }, r);  // Set interval to 7 seconds (7000ms)
    } else {
        sendMessage(`${n} Rage mode is already running.`);
    }
};
