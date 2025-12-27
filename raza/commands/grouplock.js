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
    description: 'Permanent group name lock gamit ang Event Listener',
    usage: 'grouplock on [name] | grouplock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  // 🛡️ ETO ANG PINAKA-IMPORTANTE: Bantay sa log event
  async handleEvent({ api, event }) {
    const data = getGroupLockData();
    const { threadID, logMessageType, logMessageData, messageID } = event;

    // Check kung ang event ay pagpapalit ng pangalan ng grupo
    if (data.locks[threadID] && logMessageType === "log:thread-name") {
      const lockedName = data.locks[threadID].name;
      const newName = logMessageData.name;

      // Kung hindi tugma ang bagong pangalan sa naka-lock
      if (newName !== lockedName) {
        setTimeout(async () => {
          try {
            await api.setTitle(lockedName, threadID);
            // Auto-reaction kapag naibalik ang pangalan
            await api.setMessageReaction("🛡️", messageID);
          } catch (err) {
            console.error("Failed to revert group name:", err);
          }
        }, 2000); // 2 seconds delay gaya ng gusto mo
      }
    }
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID, messageID } = event;
    const data = getGroupLockData();

    if (!args[0]) return send.reply('Usage: !grouplock on [name] | off');

    const command = args[0].toLowerCase();

    if (command === 'off') {
      if (!data.locks[threadID]) return send.reply("Walang active na lock dito.");
      
      delete data.locks[threadID];
      saveGroupLockData(data);
      return send.reply('🔓 Group name lock DISABLED.');
    }

    if (command === 'on') {
      const groupName = args.slice(1).join(' ').trim();
      if (!groupName) return send.reply('Anong pangalan ang i-l-lock ko?');

      // I-save sa database para kahit mag-restart ang bot, active pa rin
      data.locks[threadID] = {
        name: groupName,
        lockedBy: senderID,
        lockedAt: Date.now()
      };
      saveGroupLockData(data);

      try {
        // Unang pag-set ng pangalan
        await api.setTitle(groupName, threadID);
        await api.setMessageReaction("✅", messageID);
        
        return send.reply(
          `🔒 GROUP NAME LOCK ENABLED\n\n` +
          `Pangalan: ${groupName}\n` +
          `Status: Locked Permanently`
        );
      } catch (err) {
        return send.reply("Error: " + err.message);
      }
    }
  }
};
