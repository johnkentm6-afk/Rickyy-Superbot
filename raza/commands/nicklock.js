const fs = require('fs-extra');
const path = require('path');

const nicklockPath = path.join(__dirname, '../data/nicklock.json');

function getNicklockData() {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    if (!fs.existsSync(nicklockPath)) fs.writeJsonSync(nicklockPath, { locks: {} });
    return fs.readJsonSync(nicklockPath);
  } catch {
    return { locks: {} };
  }
}

function saveNicklockData(data) {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    fs.writeJsonSync(nicklockPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save nicklock data:', err);
  }
}

module.exports = {
  config: {
    name: 'nicklock',
    aliases: ['locknick', 'nlock'],
    description: 'Lock nickname globally - auto restore if changed',
    usage: 'nicklock on [nickname] | nicklock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID } = event;
    const data = getNicklockData();

    if (!args[0]) return send.reply('Usage:\n!nicklock on [nickname]\n!nicklock off');

    const command = args[0].toLowerCase();

    if (command === 'off') {
      // Disable the nickname lock
      delete data.locks[threadID];
      saveNicklockData(data);
      return send.reply('🔓 Global nickname lock disabled.');
    }

    if (command === 'on') {
      const nickname = args.slice(1).join(' ').trim();
      if (!nickname) return send.reply('Please provide the nickname to lock for everyone.');

      // Lock the nickname for all members
      data.locks[threadID] = { nickname, lockedBy: senderID, lockedAt: Date.now() };
      saveNicklockData(data);

      // Get current thread info and set all members' nicknames
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.userInfo;

        // Change each member's nickname to the locked nickname
        for (const member of members) {
          if (member.id !== api.getCurrentUserID()) {
            await api.changeNickname(nickname, threadID, member.id);
          }
        }
      } catch (err) {
        console.error('Error setting nicknames:', err.message);
      }

      // Set up an event listener to detect nickname changes
      global.nickLockListeners = global.nickLockListeners || new Map();
      if (!global.nickLockListeners.has(threadID)) {
        global.nickLockListeners.set(threadID, (changeEvent) => {
          if (changeEvent.threadID === threadID && changeEvent.nickname !== nickname) {
            api.changeNickname(nickname, threadID, changeEvent.senderID); // Restore nickname
          }
        });
        api.listenEvent(global.nickLockListeners.get(threadID)); // Add listener to detect nickname changes
      }

      return send.reply(`🔒 Global nickname lock ENABLED\nAll members will always have the nickname: ${nickname}`);
    }

    return send.reply('Usage:\n!nicklock on [nickname]\n!nicklock off');
  }
};
