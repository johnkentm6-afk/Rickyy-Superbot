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
      // Stop global nicklock
      if (global.nickLockIntervals?.has(threadID)) {
        clearInterval(global.nickLockIntervals.get(threadID));
        global.nickLockIntervals.delete(threadID);
      }
      delete data.locks[threadID];
      saveNicklockData(data);
      return send.reply('🔓 Global nickname lock disabled.');
    }

    if (command === 'on') {
      const nickname = args.slice(1).join(' ').trim();
      if (!nickname) return send.reply('Please provide the nickname to lock for everyone.');

      // Save lock data
      data.locks[threadID] = { nickname, lockedBy: senderID, lockedAt: Date.now(), changedMembers: new Set() };
      saveNicklockData(data);

      // Start interval for nickname locking
      if (!global.nickLockIntervals) global.nickLockIntervals = new Map();
      if (global.nickLockIntervals.has(threadID)) clearInterval(global.nickLockIntervals.get(threadID));

      const interval = setInterval(async () => {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const members = threadInfo.userInfo;

          let allChanged = true;

          for (const member of members) {
            if (member.id === api.getCurrentUserID()) continue; // skip bot

            if (!data.locks[threadID].changedMembers.has(member.id) && member.nickname !== nickname) {
              // Change the nickname only if it hasn't been changed yet for this member
              await api.changeNickname(nickname, threadID, member.id);
              data.locks[threadID].changedMembers.add(member.id); // Mark this member as changed
              allChanged = false; // If any member's nickname is not yet changed, continue
            }
          }

          // If all members' nicknames have been updated, stop the interval
          if (allChanged) {
            clearInterval(global.nickLockIntervals.get(threadID));
            global.nickLockIntervals.delete(threadID);
          }

        } catch (err) {
          console.error('Nicklock interval error:', err.message);
        }
      }, 2000); // every 2 seconds

      global.nickLockIntervals.set(threadID, interval);

      return send.reply(`🔒 Global nickname lock ENABLED\nAll members will have the nickname: ${nickname}`);
    }

    return send.reply('Usage:\n!nicklock on [nickname]\n!nicklock off');
  }
};
