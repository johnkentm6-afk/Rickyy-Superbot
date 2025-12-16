const fs = require('fs-extra');
const path = require('path');

const groupLockPath = path.join(__dirname, '../data/grouplock.json');

function getGroupLockData() {
  try {
    fs.ensureDirSync(path.dirname(groupLockPath));
    if (!fs.existsSync(groupLockPath)) {
      fs.writeJsonSync(groupLockPath, { locks: {} });
    }
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

// 🔁 START / RESUME GROUP LOCK
function startGroupLock(api, threadID, groupName) {
  if (!global.groupLockIntervals) global.groupLockIntervals = new Map();

  if (global.groupLockIntervals.has(threadID)) {
    clearInterval(global.groupLockIntervals.get(threadID));
  }

  const interval = setInterval(async () => {
    try {
      const info = await api.getThreadInfo(threadID);
      if (info.threadName !== groupName) {
        await api.setTitle(groupName, threadID);
      }
    } catch (err) {
      // DO NOT STOP — just log
      console.error(`[GROUPLOCK] ${threadID}:`, err.message);
    }
  }, 2000);

  global.groupLockIntervals.set(threadID, interval);
}

module.exports = {
  config: {
    name: 'grouplock',
    aliases: ['lockgroup', 'glock'],
    description: 'Permanent group name lock (UNLIMITED)',
    usage: 'grouplock on [group name] | grouplock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  // 🔁 AUTO RESUME AFTER BOT RESTART / RECONNECT
  onLoad({ api }) {
    const data = getGroupLockData();
    for (const threadID in data.locks) {
      const name = data.locks[threadID].name;
      startGroupLock(api, threadID, name);
      console.log(`[GROUPLOCK] Resumed in ${threadID}`);
    }
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID } = event;
    const data = getGroupLockData();

    if (!args[0]) {
      return send.reply(
        'Usage:\n' +
        '!grouplock on [group name]\n' +
        '!grouplock off'
      );
    }

    const command = args[0].toLowerCase();

    // ❌ OFF
    if (command === 'off') {
      if (global.groupLockIntervals?.has(threadID)) {
        clearInterval(global.groupLockIntervals.get(threadID));
        global.groupLockIntervals.delete(threadID);
      }

      delete data.locks[threadID];
      saveGroupLockData(data);

      return send.reply('🔓 Group name lock DISABLED.');
    }

    // 🔒 ON
    if (command === 'on') {
      const groupName = args.slice(1).join(' ').trim();
      if (!groupName) {
        return send.reply('Please provide a group name.');
      }

      data.locks[threadID] = {
        name: groupName,
        lockedBy: senderID,
        lockedAt: Date.now()
      };
      saveGroupLockData(data);

      startGroupLock(api, threadID, groupName);

      return send.reply(
        `🔒 GROUP NAME LOCK ENABLED\n\n` +
        `Group name will ALWAYS be:\n` +
        `👉 ${groupName}\n\n` +
        `⛔ This lock is PERMANENT\n` +
        `Use "grouplock off" to stop`
      );
    }

    return send.reply('Usage:\n!grouplock on [group name]\n!grouplock off');
  }
};
