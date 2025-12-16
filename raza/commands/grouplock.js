const fs = require('fs-extra');
const path = require('path');

const groupLockPath = path.join(__dirname, '../data/grouplock.json');

function getGroupLockData() {
  try {
    fs.ensureDirSync(path.dirname(groupLockPath));
    if (!fs.existsSync(groupLockPath)) fs.writeJsonSync(groupLockPath, { locks: {} });
    return fs.readJsonSync(groupLockPath);
  } catch {
    return { locks: {} };
  }
}

function saveGroupLockData(data) {
  try {
    fs.ensureDirSync(path.dirname(groupLockPath));
    fs.writeJsonSync(groupLockPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save grouplock data:', err);
  }
}

module.exports = {
  config: {
    name: 'grouplock',
    aliases: ['lockgroup', 'glock'],
    description: 'Lock group name - auto restore if changed',
    usage: 'grouplock on [group name] | grouplock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID } = event;
    const data = getGroupLockData();

    if (!args[0]) return send.reply('Usage:\n!grouplock on [group name]\n!grouplock off');

    const command = args[0].toLowerCase();

    if (command === 'off') {
      // Stop group name lock
      if (global.groupLockIntervals?.has(threadID)) {
        clearInterval(global.groupLockIntervals.get(threadID));
        global.groupLockIntervals.delete(threadID);
      }
      delete data.locks[threadID];
      saveGroupLockData(data);
      return send.reply('🔓 Group name lock disabled.');
    }

    if (command === 'on') {
      const groupName = args.slice(1).join(' ').trim();
      if (!groupName) return send.reply('Please provide the group name to lock.');

      data.locks[threadID] = { name: groupName, lockedBy: senderID, lockedAt: Date.now() };
      saveGroupLockData(data);

      if (!global.groupLockIntervals) global.groupLockIntervals = new Map();
      if (global.groupLockIntervals.has(threadID)) clearInterval(global.groupLockIntervals.get(threadID));

      const interval = setInterval(async () => {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          if (threadInfo.threadName !== groupName) {
            await api.setTitle(groupName, threadID);
          }
        } catch (err) {
          console.error('Grouplock interval error:', err.message);
        }
      }, 2000); // every 2 seconds

      global.groupLockIntervals.set(threadID, interval);

      return send.reply(`🔒 Group name lock ENABLED\nGroup name will be: ${groupName}`);
    }

    return send.reply('Usage:\n!grouplock on [group name]\n!grouplock off');
  }
};
