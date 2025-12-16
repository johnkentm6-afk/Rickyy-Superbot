const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'lockgroup',
    aliases: ['lock', 'lockgc', 'groupnamelock', 'nicknamelock'],
    description: 'Lock group name or nicknames of members with auto-restore',
    usage: 'lockgroup [groupname/nickname] [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, Threads }) {
    const { threadID, senderID } = event;

    // Get thread info
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();

    // Check bot admin
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be an admin to lock group settings.');
    }

    // Check user admin
    if (!adminIDs.includes(senderID)) {
      return send.reply('Only group admins can use this command.');
    }

    const settings = Threads.getSettings(threadID);
    const target = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();
    const enable = action === 'on' || action === 'enable' || action === 'true';

    if (!target) {
      return send.reply(`LOCK STATUS
Name Lock: ${settings.lockGroupName ? 'ON' : 'OFF'}
Nickname Lock: ${settings.lockNicknames ? 'ON' : 'OFF'}
Usage: lockgroup [groupname/nickname] [on/off]`);
    }

    // =========================
    // 🔹 GROUP NAME LOCK
    // =========================
    if (target === 'groupname') {
      if (enable) {
        Threads.setSettings(threadID, {
          lockGroupName: true,
          originalGroupName: threadInfo.threadName
        });

        send.reply(`✅ Group name lock ENABLED\nOriginal Name: ${threadInfo.threadName}`);

        // Start auto-restore interval
        if (!global.groupNameLockIntervals) global.groupNameLockIntervals = new Map();

        if (global.groupNameLockIntervals.has(threadID)) clearInterval(global.groupNameLockIntervals.get(threadID));

        const interval = setInterval(async () => {
          const currentInfo = await api.getThreadInfo(threadID);
          if (currentInfo.threadName !== settings.originalGroupName) {
            await api.setTitle(settings.originalGroupName, threadID);
          }
        }, 2000); // 2 seconds

        global.groupNameLockIntervals.set(threadID, interval);

      } else {
        Threads.setSettings(threadID, { lockGroupName: false, originalGroupName: null });
        if (global.groupNameLockIntervals?.has(threadID)) {
          clearInterval(global.groupNameLockIntervals.get(threadID));
          global.groupNameLockIntervals.delete(threadID);
        }
        send.reply('❌ Group name lock DISABLED');
      }
      return;
    }

    // =========================
    // 🔹 NICKNAME LOCK
    // =========================
    if (target === 'nickname') {
      const allMembers = threadInfo.userInfo;
      const nicknames = {};

      // Save original nicknames
      allMembers.forEach(member => {
        if (member.nickname) nicknames[member.id] = member.nickname;
      });

      if (enable) {
        Threads.setSettings(threadID, { lockNicknames: true, originalNicknames: nicknames });
        send.reply('✅ Nickname lock ENABLED\nOriginal nicknames saved.');

        if (!global.nicknameLockIntervals) global.nicknameLockIntervals = new Map();
        if (global.nicknameLockIntervals.has(threadID)) clearInterval(global.nicknameLockIntervals.get(threadID));

        const interval = setInterval(async () => {
          const currentThread = await api.getThreadInfo(threadID);
          const savedNicknames = Threads.getSettings(threadID).originalNicknames || {};

          for (const member of currentThread.userInfo) {
            const originalNick = savedNicknames[member.id];
            if (originalNick && member.nickname !== originalNick) {
              await api.setNickname(originalNick, threadID, member.id);
            }
          }
        }, 2000); // 2 seconds

        global.nicknameLockIntervals.set(threadID, interval);

      } else {
        Threads.setSettings(threadID, { lockNicknames: false, originalNicknames: {} });
        if (global.nicknameLockIntervals?.has(threadID)) {
          clearInterval(global.nicknameLockIntervals.get(threadID));
          global.nicknameLockIntervals.delete(threadID);
        }
        send.reply('❌ Nickname lock DISABLED');
      }
      return;
    }

    return send.reply('Usage: lockgroup [groupname/nickname] [on/off]');
  }
};
