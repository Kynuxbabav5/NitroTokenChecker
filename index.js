const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
moment.locale('tr');
var chalk = require('chalk');

// tokens
const tokens = fs.readFileSync(path.resolve(__dirname, './tokens.txt'), 'utf-8').split(/\r?\n/);

// endpoints
const DISCORD_API_BASE_URL = 'https://discord.com/api/v9';
const USER_DATA_ENDPOINT = DISCORD_API_BASE_URL + '/users/@me/settings';
const BILLING_ENDPOINT = DISCORD_API_BASE_URL + '/users/@me/billing/subscriptions';
const PAYMENT_ENDPOINT = DISCORD_API_BASE_URL + '/users/@me/billing/payments?limit=20';
const GUILD_BOOSTS_ENDPOINT = DISCORD_API_BASE_URL + '/users/@me/guilds/premium/subscription-slots';

// files
const OUTPUT_DIR = `./output/${moment().format('YYYY-MM-DD-HH-mm')}`;
const NİTRO_TOKENS_FILE = path.join(__dirname, OUTPUT_DIR, 'Nitro-Token.txt');
const NITRO_AVAILABLE_FILE = path.join(__dirname, OUTPUT_DIR, 'Nitro-Available-Token.txt');
const NITRO_NOT_AVAILABLE_FILE = path.join(__dirname, OUTPUT_DIR, 'Nitro-Not-Available-Token.txt');
const ERROR_FILE = path.join(__dirname, OUTPUT_DIR, 'Error.txt');
const LOCKED_TOKENS_FILE = path.join(__dirname, OUTPUT_DIR, 'Locked-Token.txt');
const INVALID_TOKENS_FILE = path.join(__dirname, OUTPUT_DIR, 'Invalid-Token.txt');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// colors
const gray = chalk.hex('#68786e');
const orange = chalk.hex('#ff8c00');
const time = chalk.hex('#05cbf7');
const red = chalk.hex('#ff0000');
const purple = chalk.hex('#8106bf');
const pink = chalk.hex('#f019f7');

// counters
let nitroTokens = 0;
let nitroAvailable = 0;
let nitroNotAvailable = 0;
let lockedTokens = 0;
let invalidTokens = 0;
let count = 0;

// title
process.title = ` Nitro Token Checker - Nitro Token: ${nitroTokens} | Nitro Available: ${nitroAvailable} | Nitro Not Available: ${nitroNotAvailable}`;

(async () => {
    console.log(
        chalk.green(`>> You have successfully logged in!\n\n`) +
        chalk.cyan(`>> discord.gg/visacard ${chalk.white("discord.gg/visacard")}`) +
        chalk.cyan(`>> Loaded ${chalk.yellow(tokens.length)} Tokens\n`)
    );
    for (const token of tokens) {
        await getBoosts(token);
    }
    process.stdin.resume();
    console.log(`${time(`[${moment().format('LTS')}]`)} - ${chalk.green('Finished!')}`);
    process.stdin.on('data', () => {
        process.exit(0);
    });
})();

// Get Boosts Function
async function getBoosts(token) {
    count++;
    try {
        const userData = await fetch(`${USER_DATA_ENDPOINT}`, { headers: { accept: "*/*", authorization: token, "content-type": "application/json", }, method: "GET" });
        if (userData.status !== 200) {
            if (userData.status === 403) {
                lockedTokens++;
                console.log(`${time(`[${moment().format('LTS')}]`)} - [${red(chalk.underline(token.slice(0, 26)))}] | ${chalk.yellow('Locked Token')} - ${gray(`[${count}/${tokens.length}]`)}`);
                fs.appendFileSync(LOCKED_TOKENS_FILE, `${token}\n`);
            } else if (userData.status === 401) {
                invalidTokens++;
                console.log(`${time(`[${moment().format('LTS')}]`)} - [${red(chalk.underline(token.slice(0, 26)))}] | ${chalk.red('Invalid Token')} - ${gray(`[${count}/${tokens.length}]`)}`);
                fs.appendFileSync(INVALID_TOKENS_FILE, `${token}\n`);
            } else {
                console.log(`${time(`[${moment().format('LTS')}]`)} - [${red(chalk.underline(token.slice(0, 26)))}] | ${orange('Error')} - ${gray(`[${count}/${tokens.length}]`)}`);
                fs.appendFileSync(ERROR_FILE, `${token}\n`);
            }
        }
        const subscriptionsData = await fetch(`${BILLING_ENDPOINT}`, { headers: { accept: "*/*", authorization: token, "content-type": "application/json", }, method: "GET" });
        let data = await subscriptionsData.json();
        if (data.length > 0) {
            const guildBoostGet = await fetch(`${GUILD_BOOSTS_ENDPOINT}`, { headers: { accept: "*/*", authorization: token, "content-type": "application/json", }, method: "GET" }).then(json => json.json());
            const timeDifference = new Date(data[0].current_period_end) - new Date();
            const timeDifferenceInSeconds = Math.floor(timeDifference / 1000);
            const timeDifferenceInMinutes = Math.floor(timeDifferenceInSeconds / 60);
            const timeDifferenceInHours = Math.floor(timeDifferenceInMinutes / 60);
            const timeDifferenceInDays = Math.floor(timeDifferenceInHours / 24);
            let boostDataSize = guildBoostGet.filter(x => x.premium_guild_subscription === null).length;
            if (boostDataSize === 0) {
                boostData = `2 Used Boosts`;
            } else if (boostDataSize === 1) {
                boostData = `1 Used - 1 Unused Boost`;
            } else if (boostDataSize === 2) {
                boostData = `2 Unused Boosts`;
            }
            nitroTokens++;
            console.log(`${time(`[${moment().format('LTS')}]`)} - [${purple(chalk.underline(token.slice(0, 26)))}] | Days Left: ${orange(timeDifferenceInDays)} | ${chalk.yellow(boostData)} - ${gray(`[${count}/${tokens.length}]`)}`);
            fs.appendFileSync(NİTRO_TOKENS_FILE, `${token} | Days Left: ${timeDifferenceInDays} | ${boostData}\n`);
        } else {
            const paymentsData = await fetch(`${PAYMENT_ENDPOINT}`, { headers: { accept: "*/*", authorization: token, "content-type": "application/json", }, "method": "GET" }).then(json => json.json());
            if (paymentsData.length > 0) {
                nitroNotAvailable++;
                console.log(`${time(`[${moment().format('LTS')}]`)} - [${purple(chalk.underline(token.slice(0, 26)))}] | ${pink('No Nitro')} - ${chalk.red('Not Available')} - ${gray(`[${count}/${tokens.length}]`)}`);
                fs.appendFileSync(NITRO_NOT_AVAILABLE_FILE, `${token}\n`);
            } else {
                nitroAvailable++;
                console.log(`${time(`[${moment().format('LTS')}]`)} - [${purple(chalk.underline(token.slice(0, 26)))}] | ${pink('No Nitro')} - ${chalk.green('Available')} - ${gray(`[${count}/${tokens.length}]`)}`);
                fs.appendFileSync(NITRO_AVAILABLE_FILE, `${token}\n`);
            }
        }
    } catch (error) {
        console.log(`${time(`[${moment().format('LTS')}]`)} - [${red(chalk.underline(token.slice(0, 26)))}] | ${orange('Error')} | ${error.message} - ${gray(`[${count}/${tokens.length}]`)}`);
        fs.appendFileSync(ERROR_FILE, `${token} | ${error.message}\n`);
    }
    process.title = ` Nitro Token Checker - Nitro Token: ${nitroTokens} | Nitro Available: ${nitroAvailable} | Nitro Not Available: ${nitroNotAvailable}`;
}