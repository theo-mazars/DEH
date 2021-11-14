export const command = {
  name: "ping",
  description: "Replies with Pong!",
};

export const exec = async (interaction) => {
  await interaction.reply("Pong!");
};

export default exec;
