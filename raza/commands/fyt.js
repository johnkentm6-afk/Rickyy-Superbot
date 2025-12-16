const fs = require('fs-extra');
const path = require('path');

const activeTargets = new Map();
const galiPath = path.join(__dirname, 'data/gali.txt');

function getGaliMessages() {
  try {
    const content = fs.readFileSync(galiPath, 'utf8');
    return content.split('\n').filter(m => m.trim());
  } catch {
    return ['T3RRRR1111 B3H3N K111 L0D333 😂😂🖕'];
  }
}

function getRandomMessage() {
  const messages = getGaliMessages();
  return messages[Math.floor(Math.random() * messages.length)];
}

async function startTagging(api, threadID, targetUID, cachedName) {
  const key = `${threadID}_${targetUID}`;
  if (activeTargets.has(key)) return false;

  const userName = cachedName || 'User';

  const interval = setInterval(async () => {
    try {
      const tag = `@${userName}`;
      const message = `${tag} ${getRandomMessage()}`;

      await api.sendMessage({
        body: message,
        mentions: [{
          tag,
          id: targetUID,
          fromIndex: 0
        }]
      }, threadID);

    } catch (err) {
      // 👉 AUTO STOP KAPAG NA-KICK
      if (
        err?.error === 1545012 ||
        err?.message?.includes('not part') ||
        err?.message?.includes('conversation')
      ) {
        clearInterval(interval);
        activeTargets.delete(key);
        console.log(`[FYT AUTO-STOP] User removed from thread: ${targetUID}`);
        return;
      }

      // 👉 iwas "undefined" spam
      console.error('[FYT ERROR]', err?.message || err);
    }
  }, 5000); // ✅ 5 SECONDS

  activeTargets.set(key, interval);
  return true;
}

function stopTagging(threadID, targetUID) {
  const key = `${threadID}_${targetUID}`;
  if (!activeTargets.has(key)) return false;

  clearInterval(activeTargets.get(key));
  activeTargets.delete(key);
  return true;
}

module.exports = {
  config: {
    name: 'fyt',
    aliases: ['fuckytag'],
    description: 'Non-stop tagging until off or kicked',
    usage: 'fyt on @mention | fyt off @mention',
    category: 'Fun',
    adminOnly: false,
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config, Users }) {
    const { threadID, senderID, mentions } = event;

    if (!args.length) {
      return send.reply(
`Usage:
━━━━━━━━━━━━
fyt on @user
fyt off @user
━━━━━━━━━━━━`
      );
    }

    const action = args[0].toLowerCase();
    if (!['on', 'off'].includes(action)) {
      return send.reply('Use only "on" or "off"');
    }

    const mentionIDs = Object.keys(mentions || {});
    if (!mentionIDs.length) {
      return send.reply('Please tag someone!');
    }

    const targetUID = mentionIDs[0];
    let targetName = 'User';

    try {
      targetName = await Users.getValidName(targetUID, 'User');
    } catch {}

    if (action === 'on') {
      const isAdmin = config.ADMINBOT?.includes(senderID);
      if (!isAdmin) {
        const info = await api.getThreadInfo(threadID);
        if (!info.adminIDs.some(a => a.id === senderID)) {
          return send.reply('Admins only 😅');
        }
      }

      const started = await startTagging(api, threadID, targetUID, targetName);
      if (!started) {
        return send.reply(`${targetName} already on FYT 😈`);
      }

      return send.reply(
`🔥 FYT ACTIVATED 🔥
Target: ${targetName}
Speed: 5 seconds
Mode: NON-STOP 😈

Use: fyt off @${targetName}`
      );
    }

    // OFF
    const stopped = stopTagging(threadID, targetUID);
    if (!stopped) return send.reply('Not running.');

    return send.reply(`✅ FYT STOPPED\nTarget: ${targetName}`);
  }
};
