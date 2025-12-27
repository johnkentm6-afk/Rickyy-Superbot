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
    description: 'I-lock ang nickname ng lahat kahit hindi admin ang bot.',
    usage: 'nicklock on [nickname] | nicklock off',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },

  // Bantay sa mga nagpapalit ng nickname (Kahit hindi admin ang bot)
  async handleEvent({ api, event }) {
    const data = getNicklockData();
    const { threadID, logMessageType, logMessageData, messageID } = event;

    if (data.locks[threadID] && logMessageType === "log:subscribe-nickname") {
      const lockedNickname = data.locks[threadID].nickname;
      const targetID = logMessageData.participant_id;

      // Kung ang binagong nickname ay hindi match sa lock
      if (logMessageData.nickname !== lockedNickname) {
        setTimeout(async () => {
          try {
            await api.changeNickname(lockedNickname, threadID, targetID);
            // Auto-react 👍 kapag naibalik ng bot ang nickname
            await api.setMessageReaction("👍", messageID); 
          } catch (err) {
            console.error("Hindi mapalitan ang nickname:", err.message);
          }
        }, 2000); // 2 seconds delay
      }
    }
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID, messageID } = event;
    const data = getNicklockData();

    if (!args[0]) return send.reply('Gamitin: !nicklock on [name] o !nicklock off');

    const command = args[0].toLowerCase();

    if (command === 'off') {
      if (!data.locks[threadID]) return send.reply("Walang active na nicklock dito.");
      delete data.locks[threadID];
      saveNicklockData(data);
      return send.reply('🔓 Nickname lock is now DISABLED.');
    }

    if (command === 'on') {
      const nickname = args.slice(1).join(' ').trim();
      if (!nickname) return send.reply('Pakilagay ang nickname na i-l-lock.');

      data.locks[threadID] = { nickname, lockedBy: senderID };
      saveNicklockData(data);

      send.reply(`⏳ Naka-lock na sa "${nickname}". Pinapalitan ko na ang lahat...`);

      try {
        const info = await api.getThreadInfo(threadID);
        // Isang beses na mass-change para sa lahat ng members
        for (const id of info.participantIDs) {
          if (id === api.getCurrentUserID()) continue; // Iwasan ang bot nickname
          
          await api.changeNickname(nickname, threadID, id);
          await new Promise(res => setTimeout(res, 700)); // Safety delay
        }
        
        // Mag-react ang bot sa command mo pagtapos
        await api.setMessageReaction("✅", messageID);
        return send.reply(`✅ Tapos na! Lahat ay naka-set na sa "${nickname}".`);
      } catch (e) {
        return send.reply("Medyo nagka-error sa pag-change: " + e.message);
      }
    }
  }
};
