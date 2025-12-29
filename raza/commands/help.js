module.exports = {
  config: {
    name: 'help',
    aliases: ['h', 'menu', 'cmds'],
    description: 'Ipakita ang listahan ng mga commands',
    usage: 'help [command] | help [page] | help all',
    category: 'Utility',
    prefix: false
  },
  
  async run({ api, event, args, send, client, config }) {
    if (args[0]) {
      const input = args[0].toLowerCase();
      
      if (input === 'all') {
        return showAllCommands({ api, event, send, client, config });
      }
      
      if (!isNaN(input)) {
        const page = parseInt(input);
        return showPagedCommands({ api, event, send, client, config, page });
      }
      
      let command = client.commands.get(input);
      
      if (!command) {
        for (const [name, cmd] of client.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(input)) {
            command = cmd;
            break;
          }
        }
      }
      
      if (!command) {
        return send.reply(`❌ Hindi nahanap ang command na "${input}".`);
      }
      
      const cfg = command.config;
      return send.reply(`COMMAND: ${cfg.name.toUpperCase()}
─────────────────
Description: ${cfg.description || 'No description'}
Usage: ${cfg.usage || cfg.name}
Aliases: ${cfg.aliases?.join(', ') || 'None'}
Category: ${cfg.category || 'Other'}
Admin Only: ${cfg.adminOnly ? 'Yes' : 'No'}
─────────────────
𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗥𝗶𝗰𝗸𝘆𝘆 𝗗. 𝗞𝗮𝗻𝘁𝘂𝘁𝗲𝗿𝗼`);
    }
    
    return showPagedCommands({ api, event, send, client, config, page: 1 });
  }
};

function showPagedCommands({ api, event, send, client, config, page }) {
  const uniqueCommands = new Map();
  
  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }
  
  const commandsArray = Array.from(uniqueCommands.values());
  const commandsPerPage = 10;
  const totalPages = Math.ceil(commandsArray.length / commandsPerPage);
  
  if (page < 1 || page > totalPages) {
    return send.reply(`Invalid page. Gamitin ang page 1-${totalPages}`);
  }
  
  const startIdx = (page - 1) * commandsPerPage;
  const pageCommands = commandsArray.slice(startIdx, startIdx + commandsPerPage);
  
  let msg = `『 ${config.BOTNAME} COMMANDS 』
─────────────────
Page: ${page}/${totalPages}
Total: ${commandsArray.length} commands
─────────────────\n\n`;
  
  pageCommands.forEach(cmd => {
    msg += `╰┈➤ ${cmd.name}\n`;
  });
  
  msg += `\n─────────────────
𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: 𝐑𝐢𝐜𝐤𝐲𝐲`;
  
  return send.reply(msg);
}

function showAllCommands({ api, event, send, client, config }) {
  const categories = {};
  const uniqueCommands = new Map();
  
  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }
  
  for (const [name, cfg] of uniqueCommands) {
    const cat = cfg.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cfg);
  }
  
  let msg = `『 ${config.BOTNAME} ALL COMMANDS 』
─────────────────
Total: ${uniqueCommands.size} commands
─────────────────\n`;
  
  const categoryOrder = ['Admin', 'Group', 'Friend', 'Economy', 'Media', 'Fun', 'Profile', 'Utility', 'System', 'Other'];
  const categoryEmojis = {
    'Admin': '👑', 'Group': '👥', 'Friend': '🤝', 'Economy': '💰', 
    'Media': '🎵', 'Fun': '💕', 'Profile': '👤', 'Utility': '🔧', 
    'System': '⚙️', 'Other': '📋'
  };
  
  for (const cat of categoryOrder) {
    if (!categories[cat]) continue;
    const emoji = categoryEmojis[cat] || '📋';
    msg += `\n${emoji} ${cat.toUpperCase()}\n`;
    categories[cat].forEach(c => { msg += `╰┈➤ ${c.name}\n`; });
  }
  
  for (const cat in categories) {
    if (!categoryOrder.includes(cat)) {
      msg += `\n📋 ${cat.toUpperCase()}\n`;
      categories[cat].forEach(c => { msg += `╰┈➤ ${c.name}\n`; });
    }
  }
  
  msg += `\n─────────────────
𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗥𝗶𝗰𝗸𝘆𝘆 𝗗. 𝗞𝗮𝗻𝘁𝘂𝘁𝗲𝗿𝗼`;
  
  return send.reply(msg);
}
