const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 📦 เก็บ commands
client.commands = new Collection();
const commands = [];

// ======================
// 📂 โหลด commands จากโฟลเดอร์
// ======================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (!command.data || !command.execute) {
    console.log(`❌ ${file} ไม่มี data หรือ execute`);
    continue;
  }

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// ======================
// 📂 กันหลุด
// ======================
if (!process.env.TOKEN) {
  console.error("❌ ไม่พบ TOKEN");
  process.exit(1);
}

// ======================
// 🚀 Deploy Slash Commands
// ======================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ กำลังโหลด Slash Commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash Command พร้อมใช้');
  } catch (error) {
    console.error(error);
  }
})();

// ======================
// 📡 โหลด handler
// ======================
require('./handlers/interactionHandler')(client);

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const tokenRegex = /[A-Za-z\d]{24}\.[\w-]{6}\.[\w-]{27}/;

  if (tokenRegex.test(message.content)) {
    message.delete().catch(() => {});
    message.channel.send('🚨 ห้ามส่ง Token!');
  }
});

// ======================
// ✅ READY
// ======================
client.once('clientReady', () => {
  console.log(`✅ บอทออนไลน์: ${client.user.tag}`);
});

client.login(process.env.TOKEN);

