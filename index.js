const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const configPath = path.join(__dirname, 'Data/config/envconfig.json');
const appstatePath = path.join(__dirname, 'appstate.json');

let botModule = null;
let botStarted = false;

// IN-UPDATE: Personal Brand Details
const BRAND_NAME = "RICKYY-BoT";
const BRAND_OWNER = "Rickyy";
const BRAND_FB = "facebook.com/messages/t/870028318834373";

function getConfig() {
  try {
    return fs.readJsonSync(configPath);
  } catch {
    return {
      BOTNAME: 'RICKYY',
      PREFIX: '&',
      ADMINBOT: ['61581956827969'],
      TIMEZONE: 'Asia/Manila',
      PREFIX_ENABLED: false,
      REACT_DELETE_EMOJI: '😠',
      ADMIN_ONLY_MODE: true,
      APPROVE_ONLY: false,
      SELF_LISTEN: true
    };
  }
}

function saveConfig(config) {
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

function getAppstate() {
  try {
    return fs.readJsonSync(appstatePath);
  } catch {
    return null;
  }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

app.get('/', (req, res) => {
  const config = getConfig();
  const hasAppstate = fs.existsSync(appstatePath);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  // IN-UPDATE: Ginawang Manila Time
  const time = moment().tz('Asia/Manila').format('hh:mm:ss A');
  const date = moment().tz('Asia/Manila').format('DD/MM/YYYY');
  
  let commandCount = 0;
  let eventCount = 0;
  try {
    const commandsPath = path.join(__dirname, 'raza/commands');
    const eventsPath = path.join(__dirname, 'raza/events');
    commandCount = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length;
    eventCount = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length;
  } catch {}
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME} - Control Panel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #e94560; margin-bottom: 30px; }
    .header h1 { font-size: 2.5em; color: #e94560; text-shadow: 0 0 20px rgba(233, 69, 96, 0.5); }
    .status-bar { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-bottom: 30px; }
    .status-item { background: rgba(255,255,255,0.1); padding: 15px 25px; border-radius: 10px; text-align: center; }
    .status-item span { display: block; font-size: 0.9em; color: #aaa; }
    .status-item strong { font-size: 1.3em; color: #4ecca3; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
    .card { background: rgba(255,255,255,0.05); border-radius: 15px; padding: 25px; border: 1px solid rgba(255,255,255,0.1); }
    .card h2 { color: #e94560; margin-bottom: 20px; font-size: 1.3em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; color: #aaa; font-size: 0.9em; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(0,0,0,0.3); color: #fff; }
    .toggle { display: flex; align-items: center; gap: 10px; }
    .toggle input[type="checkbox"] { width: 50px; height: 25px; appearance: none; background: #333; border-radius: 25px; position: relative; cursor: pointer; }
    .toggle input[type="checkbox"]:checked { background: #4ecca3; }
    .toggle input[type="checkbox"]::before { content: ''; position: absolute; width: 21px; height: 21px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: 0.3s; }
    .toggle input[type="checkbox"]:checked::before { left: 27px; }
    .btn { padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; transition: 0.3s; margin: 5px; }
    .btn-primary { background: #e94560; color: #fff; }
    .btn-success { background: #4ecca3; color: #000; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 15px; display: none; }
    .alert-success { background: rgba(78, 204, 163, 0.2); border: 1px solid #4ecca3; color: #4ecca3; }
    .bot-status { display: inline-block; padding: 5px 15px; border-radius: 20px; }
    .bot-online { background: rgba(78, 204, 163, 0.2); color: #4ecca3; }
    .bot-offline { background: rgba(233, 69, 96, 0.2); color: #e94560; }
    a { color: #4ecca3; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <p>Control Panel - Manage your Messenger Bot</p>
      <p style="margin-top: 10px;">
        <span class="bot-status ${botStarted ? 'bot-online' : 'bot-offline'}">
          ${botStarted ? 'BOT ONLINE' : 'BOT OFFLINE'}
        </span>
      </p>
      <div style="margin-top: 15px; color: #aaa; font-size: 0.9em;">
        <p>Owner: <span style="color: #4ecca3;">${BRAND_OWNER}</span></p>
        <p>Support: <a href="https://${BRAND_FB}">Message Admin</a></p>
      </div>
    </div>
    
    <div class="status-bar">
      <div class="status-item"><span>Time (PHT)</span><strong>${time}</strong></div>
      <div class="status-item"><span>Date</span><strong>${date}</strong></div>
      <div class="status-item"><span>Uptime</span><strong>${hours}h ${minutes}m ${seconds}s</strong></div>
      <div class="status-item"><span>Commands</span><strong>${commandCount}</strong></div>
      <div class="status-item"><span>Events</span><strong>${eventCount}</strong></div>
    </div>
    
    <div id="alert" class="alert"></div>
    
    <div class="grid">
      <div class="card">
        <h2>Bot Configuration</h2>
        <form id="configForm">
          <div class="form-group">
            <label>Bot Name</label>
            <input type="text" name="BOTNAME" value="${config.BOTNAME}" required>
          </div>
          <div class="form-group">
            <label>Prefix</label>
            <input type="text" name="PREFIX" value="${config.PREFIX}" required>
          </div>
          <div class="form-group">
            <label>Admin UIDs</label>
            <input type="text" name="ADMINBOT" value="${config.ADMINBOT.join(',')}" required>
          </div>
          <div class="form-group toggle">
            <input type="checkbox" name="ADMIN_ONLY_MODE" ${config.ADMIN_ONLY_MODE ? 'checked' : ''}>
            <label>Admin Only Mode</label>
          </div>
          <div class="form-group toggle">
            <input type="checkbox" name="SELF_LISTEN" ${config.SELF_LISTEN ? 'checked' : ''}>
            <label>Self Listen</label>
          </div>
          <button type="submit" class="btn btn-primary">Save Configuration</button>
        </form>
      </div>
      
      <div class="card">
        <h2>AppState Management</h2>
        <form id="appstateForm">
          <div class="form-group">
            <label>AppState JSON</label>
            <textarea name="appstate" style="width:100%; min-height:150px; background:rgba(0,0,0,0.3); color:#fff; border-radius:8px; padding:10px;">${hasAppstate ? JSON.stringify(getAppstate(), null, 2) : ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary">Save AppState</button>
        </form>
      </div>
      
      <div class="card">
        <h2>Bot Control</h2>
        <button onclick="startBot()" class="btn btn-success">Start Bot</button>
        <button onclick="reloadCommands()" class="btn btn-primary">Reload Commands</button>
        <button onclick="reloadEvents()" class="btn btn-primary">Reload Events</button>
      </div>
    </div>
  </div>
  
  <script>
    async function startBot() {
      const res = await fetch('/api/start', { method: 'POST' });
      location.reload();
    }
    async function reloadCommands() { await fetch('/api/reload/commands', { method: 'POST' }); alert('Reloaded!'); }
    async function reloadEvents() { await fetch('/api/reload/events', { method: 'POST' }); alert('Reloaded!'); }
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const config = {
        BOTNAME: formData.get('BOTNAME'),
        PREFIX: formData.get('PREFIX'),
        ADMINBOT: formData.get('ADMINBOT').split(',').map(s => s.trim()),
        ADMIN_ONLY_MODE: formData.get('ADMIN_ONLY_MODE') === 'on',
        SELF_LISTEN: formData.get('SELF_LISTEN') === 'on',
        TIMEZONE: 'Asia/Manila'
      };
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      alert('Config Saved!');
    });
  </script>
</body>
</html>
  `);
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);
    if (botModule) botModule.loadConfig();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/start', async (req, res) => {
  try {
    if (!botModule) botModule = require('./raza');
    botModule.startBot();
    botStarted = true;
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/commands', async (req, res) => {
  if (botModule) await botModule.reloadCommands();
  res.json({ success: true });
});

app.post('/api/reload/events', async (req, res) => {
  if (botModule) await botModule.reloadEvents();
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RICKYY BOT Control Panel running on port ${PORT}`);
  if (fs.existsSync(appstatePath)) {
    setTimeout(() => {
      botModule = require('./raza');
      botModule.startBot();
      botStarted = true;
    }, 2000);
  }
});
