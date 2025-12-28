const chalk = require('chalk');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

const logDir = path.join(__dirname, '../system/database/botdata/logs');
fs.ensureDirSync(logDir);

// In-update ang Brand details para sa iyong pangalan
const BRAND_NAME = "RICKYY-SUPERBOT";
const BRAND_OWNER = "Rickyy";
const BRAND_FB = "facebook.com/messages/t/870028318834373";

// Inayos ang Timezone sa Asia/Manila (PST)
const getTime = () => moment().tz('Asia/Manila').format('hh:mm:ss A');
const getDate = () => moment().tz('Asia/Manila').format('DD/MM/YYYY');
const getDateTime = () => `${getTime()} || ${getDate()}`;

const writeLog = (type, message) => {
  const date = moment().tz('Asia/Manila').format('YYYY-MM-DD');
  const logFile = path.join(logDir, `${date}.log`);
  const logEntry = `[${getDateTime()}] [${type}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
};

const printBanner = () => {
  console.log('');
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║') + chalk.yellow.bold('               RICKYY-SUPERBOT                 ') + chalk.blue('║'));
  console.log(chalk.blue('╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.blue('║') + chalk.yellow(' Owner: ') + chalk.blue.bold('Rickyy') + chalk.yellow('                                  ') + chalk.blue('║'));
  console.log(chalk.blue('║') + chalk.yellow(' Status: ') + chalk.blue.bold('ONLINE / ACTIVE') + chalk.yellow('                        ') + chalk.blue('║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════╝'));
  console.log('');
};

const logs = {
  banner: printBanner,
  
  info: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.blue(`[${getTime()}]`), chalk.yellow(`[${title}]`), chalk.blue(message));
    writeLog('INFO', `[${title}] ${message}`);
  },

  success: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.yellow(`[${getTime()}]`), chalk.blue.bold(`[${title}]`), chalk.green.bold(message));
    writeLog('SUCCESS', `[${title}] ${message}`);
  },

  error: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.red(`[${getTime()}]`), chalk.redBright(`[${title}]`), chalk.red(message));
    writeLog('ERROR', `[${title}] ${message}`);
  },

  warn: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.yellow(`[${getTime()}]`), chalk.yellowBright(`[${title}]`), chalk.yellow(message));
    writeLog('WARN', `[${title}] ${message}`);
  },

  command: (name, user, threadID) => {
    console.log(
      chalk.blue(`[${getTime()}]`),
      chalk.yellow.bold('[COMMAND]'),
      chalk.blue.bold(`${name}`),
      chalk.yellow('by'),
      chalk.blue(user),
      chalk.yellow('in'),
      chalk.blue(threadID)
    );
    writeLog('COMMAND', `${name} by ${user} in ${threadID}`);
  },

  event: (type, threadID) => {
    console.log(
      chalk.yellow(`[${getTime()}]`),
      chalk.blue.bold('[EVENT]'),
      chalk.yellow.bold(type),
      chalk.blue('in'),
      chalk.yellow(threadID)
    );
    writeLog('EVENT', `${type} in ${threadID}`);
  },
  
  getBrand: () => ({ name: BRAND_NAME, owner: BRAND_OWNER, fb: BRAND_FB })
};

module.exports = logs;
