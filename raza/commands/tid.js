module.exports = {
  config: {
    name: 'tid',
    aliases: ['threadid', 'gid'],
    description: 'Get the thread/group ID',
    usage: 'tid',
    category: 'Utility',
    prefix: false
  },
  
  async run({ api, event, send }) {
    const { threadID, isGroup } = event;
    
    return send.reply(`${isGroup ? 'Group' : 'Thread'} ID:
─────────────────
${threadID}`);
  }
};
