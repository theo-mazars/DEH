import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { config } from "dotenv";

import Bot from "./src/utils/Bot.js";

config();
const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

(async () => {
  const bot = new Bot();
  await bot.fetchCommands();

  console.log((await bot.command).map(({ command }) => command));

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationCommands(bot.client?.user?.id || process.argv[2]),
      {
        body: (await bot.command).map(({ command }) => command),
      }
    );

    console.log("Successfully reloaded application (/) commands.");
    return;
  } catch (error) {
    console.error(error);
  }
})();
