import { bot } from "./src/config/setup.js";

bot.client.on("ready", () => {
  console.log(`Logged in as ${bot.client.user.tag}!`);
  (async () => {
    await bot.fetchCommands();
  })();
});

bot.client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const cmd = (await bot.commandName).find(
    (c) => c.command.name === interaction.commandName
  );

  if (cmd) await cmd.exec(interaction);
});

bot.start();
