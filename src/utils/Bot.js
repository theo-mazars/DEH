import Discord, { Intents } from "discord.js";
import { readdirSync } from "fs";
import dotenv from "dotenv";

import { initCommands } from "../commands/init.js";
import getFreeEpicGames from "../features/getFreeEpicGames.js";

class Bot {
  constructor() {
    this.client = new Discord.Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });
  }

  start() {
    dotenv.config();
    this.client.login(process.env.TOKEN);
    getFreeEpicGames(this.client);
  }

  get commands() {
    return readdirSync("./src/commands")
      .filter((file) => file.endsWith(".cmd.js"))
      .map((file) => file.replace(".cmd.js", ""));
  }

  get commandName() {
    this.fetchCommands();
    return this.command;
  }

  async fetchCommands() {
    this.command = Promise.all(
      this.commands?.map(async (c) => {
        const { command, exec } = await import(
          `${process.cwd()}/src/commands/${c}.cmd.js`
        );

        return { command, exec };
      }) || []
    );
  }

  async resetCommands() {
    this.fetchCommands();
    await initCommands(
      this.client.user.id,
      (await this.command).map(({ command }) => command)
    );
  }
}

export default Bot;
