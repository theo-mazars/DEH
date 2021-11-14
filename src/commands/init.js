import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { config } from "dotenv";

config();
const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

export const initCommands = async (clientID, commands) => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};
