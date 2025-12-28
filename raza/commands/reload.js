module.exports = {
  config: {
    name: 'reload',
    aliases: ['load', 'rl'],
    description: 'Reload commands or events without restarting bot',
    usage: 'reload [command/event name] | reload all | reload events | reload cmds',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, client }) {
    const { loadCommands, loadEvents, reloadCommand, reloadEvent, loadNewCommand } = require('../../Data/system/handle/handleRefresh');
    const path = require('path');
    const fs = require('fs-extra');
    
    const commandsPath = path.join(__dirname);
    const eventsPath = path.join(__dirname, '../events');
    
    const target = args[0]?.toLowerCase();
    const secondArg = args[1]?.toLowerCase();
    
    if (!target) {
      return send.reply(`≿━━━━༺🔄༻━━━━≾
𝐑𝐄𝐋𝐎𝐀𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃
≿━━━━༺🔄༻━━━━≾

📌 𝐔𝐬𝐚𝐠𝐞:
• .reload all - Reload everything
• .reload cmds - Reload all commands
• .reload events - Reload all events
• .reload [name] - Reload specific command
• .reload event [name] - Reload specific event
• .reload new [name] - Load new command

📊 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐬:
• Commands: ${client.commands.size}
• Events: ${client.events.size}
≿━━━━༺🔄༻━━━━≾`);
    }
    
    if (target === 'all') {
      const cmdResult = await loadCommands(client, commandsPath);
      const evtResult = await loadEvents(client, eventsPath);
      
      return send.reply(`≿━━━━༺✅༻━━━━≾
𝐀𝐋𝐋 𝐑𝐄𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📦 Commands: ${client.commands.size}
📡 Events: ${client.events.size}
≿━━━━༺✅༻━━━━≾`);
    }
    
    if (target === 'commands' || target === 'cmds' || target === 'cmd') {
      const result = await loadCommands(client, commandsPath);
      
      if (result.success) {
        return send.reply(`≿━━━━༺✅༻━━━━≾
𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐑𝐄𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📦 Total: ${result.count} commands
≿━━━━༺✅༻━━━━≾`);
      } else {
        return send.reply(`❌ Error: ${result.error}`);
      }
    }
    
    if (target === 'events' || target === 'evt') {
      const result = await loadEvents(client, eventsPath);
      
      if (result.success) {
        return send.reply(`≿━━━━༺✅༻━━━━≾
𝐄𝐕𝐄𝐍𝐓𝐒 𝐑𝐄𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📡 Total: ${result.count} events
≿━━━━༺✅༻━━━━≾`);
      } else {
        return send.reply(`❌ Error: ${result.error}`);
      }
    }
    
    if (target === 'event' && secondArg) {
      const result = await reloadEvent(client, eventsPath, secondArg);
      
      if (result.success) {
        return send.reply(`≿━━━━༺✅༻━━━━≾
𝐄𝐕𝐄𝐍𝐓 𝐑𝐄𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📡 Event: ${result.name}
≿━━━━༺✅༻━━━━≾`);
      } else {
        return send.reply(`❌ ${result.error}`);
      }
    }
    
    if (target === 'new' && secondArg) {
      const result = await loadNewCommand(client, commandsPath, secondArg);
      
      if (result.success) {
        return send.reply(`≿━━━━༺✅༻━━━━≾
𝐍𝐄𝐖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📦 Command: ${result.name}
📊 Total: ${client.commands.size}
≿━━━━༺✅༻━━━━≾`);
      } else {
        return send.reply(`❌ ${result.error}`);
      }
    }
    
    const result = await reloadCommand(client, commandsPath, target);
    
    if (result.success) {
      return send.reply(`≿━━━━༺✅༻━━━━≾
𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐑𝐄𝐋𝐎𝐀𝐃𝐄𝐃!
≿━━━━༺✅༻━━━━≾

📦 Command: ${result.name}
≿━━━━༺✅༻━━━━≾`);
    } else {
      return send.reply(`❌ ${result.error}`);
    }
  }
};
