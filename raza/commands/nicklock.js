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

// 🔁 START / RESUME INTERVAL
async function startNickLock(api, threadID, nickname) {
  if (!global.nickLockIntervals) global.nickLockIntervals = new Map();

  if (global.nickLockIntervals.has(threadID)) {
    clearInterval(global.nickLockIntervals.get(threadID));
  }

  const interval = setInterval(async () => {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      for (const member of threadInfo.userInfo) {
        if (member.id === api.getCurrentUserID()) continue;
        if (member.nickname !== nickname) {
          await api.changeNickname(nickname, threadID, member.id);
        }
      }
    } catch (err) {
      console.error('Nicklock interval error:', err.message);
    }
  }, 2000);

  global.nickLockIntervals.set(threadID, interval);
}

module.exports = {
  config: {
    name: 'nicklock',
    aliases: ['locknick', 'nlock'],
    description: 'Permanent global nickname lock',
    usage: 'nicklock on [nickname] | nicklock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  // 🔁 AUTO RESUME AFTER BOT RESTART
  onLoad({ api }) {
    const data = getNicklockData();
    for (const threadID in data.locks) {
      const nickname = data.locks[threadID].nickname;
      startNickLock(api, threadID, nickname);
      console.log(`[NICKLOCK] Resumed in ${threadID}`);
    }
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID } = event;
    const data = getNicklockData();

    if (!args[0]) {
      return send.reply(
        'Usage:\n' +
        '!nicklock on [nickname]\n' +
        '!nicklock off'
      );
    }

    const command = args[0].toLowerCase();

    // ❌ OFF
    if (command === 'off') {
      if (global.nickLockIntervals?.has(threadID)) {
        clearInterval(global.nickLockIntervals.get(threadID));
        global.nickLockIntervals.delete(threadID);
      }

      delete data.locks[threadID];
      saveNicklockData(data);

      return send.reply('🔓 Global nickname lock DISABLED.');
    }

    // 🔒 ON
    if (command === 'on') {
      const nickname = args.slice(1).join(' ').trim();
      if (!nickname) {
        return send.reply('Please provide a nickname.');
      }

      data.locks[threadID] = {
        nickname,
        lockedBy: senderID,
        lockedAt: Date.now()
      };
      saveNicklockData(data);

      await startNickLock(api, threadID, nickname);

      return send.reply(
        `🔒 GLOBAL NICKLOCK ENABLED\n\n` +
        `All members will ALWAYS be named:\n` +
        `👉 ${nickname}\n\n` +
        `⛔ Will stay locked until you use:\n` +
        `nicklock off`
      );
    }

    return send.reply('Usage:\n!nicklock on [nickname]\n!nicklock off');
  }
};
