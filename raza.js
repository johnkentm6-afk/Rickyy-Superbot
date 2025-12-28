const ws3fca = require('./Data/raza-fca');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');
const axios = require('axios');

const logs = require('./Data/utility/logs');
const listen = require('./Data/system/listen');
const { loadCommands, loadEvents } = require('./Data/system/handle/handleRefresh');
const UsersController = require('./Data/system/controllers/users');
const ThreadsController = require('./Data/system/controllers/threads');
const CurrenciesController = require('./Data/system/controllers/currencies');

const configPath = path.join(__dirname, 'Data/config/envconfig.json');
const appstatePath = path.join(__dirname, 'appstate.json');
const commandsPath = path.join(__dirname, 'raza/commands');
const eventsPath = path.join(__dirname, 'raza/events');

let config = {};
let api = null;
let client = {
  commands: new Map(),
  events: new Map(),
  replies: new Map(),
  cooldowns: new Map()
};

// Global storage para sa timers (importante para sa stop commands ng ibang scripts)
global.rageModeTimers = new Map();

function loadConfig() {
  try {
    config = fs.readJsonSync(configPath);
    global.config = config;
  } catch (error) {
    logs.error('CONFIG', 'Failed to load config:', error.message);
    config = {
      BOTNAME: 'RAZA BOT',
      PREFIX: '.',
      ADMINBOT: ['61582493356125'],
      TIMEZONE: 'Asia/Karachi',
      PREFIX_ENABLED: true,
      REACT_DELETE_EMOJI: '😡',
      ADMIN_ONLY_MODE: false,
      AUTO_ISLAMIC_POST: false,
      AUTO_GROUP_MESSAGE: false
    };
    global.config = config;
  }
}

function saveConfig() {
  try {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    global.config = config;
  } catch (error) {
    logs.error('CONFIG', 'Failed to save config:', error.message);
  }
}

async function startBot() {
  logs.banner();
  loadConfig();
  
  let appstate;
  try {
    appstate = fs.readJsonSync(appstatePath);
  } catch (error) {
    logs.error('APPSTATE', 'Failed to load appstate.json');
    logs.error('APPSTATE', 'Please provide valid appstate through the web panel');
    return;
  }
  
  logs.info('BOT', 'Starting RAZA BOT...');
  logs.info('BOT', `Timezone: ${config.TIMEZONE}`);
  logs.info('BOT', `Prefix: ${config.PREFIX}`);
  
  ws3fca.login(appstate, {
    listenEvents: true,
    selfListen: false,
    autoMarkRead: true,
    autoMarkDelivery: false,
    forceLogin: true
  }, async (err, loginApi) => {
    if (err) {
      logs.error('LOGIN', 'Failed to login:', err.message || err);
      return;
    }
    
    api = loginApi;
    global.api = api;
    global.startTime = Date.now();
    
    logs.success('LOGIN', 'Successfully logged in!');
    
    const Users = new UsersController(api);
    const Threads = new ThreadsController(api);
    const Currencies = new CurrenciesController(api);
    
    global.Users = Users;
    global.Threads = Threads;
    global.Currencies = Currencies;
    
    await loadCommands(client, commandsPath);
    await loadEvents(client, eventsPath);
    
    global.client = client;
    
    // Inalis na ang setupSchedulers() dito
    
    const listener = listen({
      api,
      client,
      Users,
      Threads,
      Currencies,
      config
    });
    
    api.listenMqtt(listener);
    
    const uniqueCommands = new Set();
    client.commands.forEach((cmd, key) => {
      if (cmd.config && cmd.config.name) {
        uniqueCommands.add(cmd.config.name.toLowerCase());
      }
    });
    const actualCommandCount = uniqueCommands.size;
    const actualEventCount = client.events.size;
    
    logs.success('BOT', `${config.BOTNAME} is now online!`);
    logs.info('BOT', `Commands loaded: ${actualCommandCount}`);
    logs.info('BOT', `Events loaded: ${actualEventCount}`);
    
    const adminID = config.ADMINBOT[0];
    if (adminID) {
      try {
        await api.sendMessage(`${config.BOTNAME} is now online!
─────────────────
Commands: ${actualCommandCount}
Events: ${actualEventCount}
Prefix: ${config.PREFIX}
─────────────────
Type ${config.PREFIX}help for commands`, adminID);
      } catch (e) {
        logs.warn('NOTIFY', 'Could not send startup message to admin');
      }
    }
  });
}

process.on('unhandledRejection', (reason, promise) => {
  logs.warn('UNHANDLED', 'Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
  logs.error('EXCEPTION', 'Uncaught Exception:', error.message);
});

module.exports = {
  startBot,
  getApi: () => api,
  getApi: () => api,
  getClient: () => client,
  getConfig: () => config,
  saveConfig,
  loadConfig,
  reloadCommands: () => loadCommands(client, commandsPath),
  reloadEvents: () => loadEvents(client, eventsPath)
};

if (require.main === module) {
  startBot();
}
