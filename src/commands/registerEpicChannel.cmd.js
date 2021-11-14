import prisma from "../config/database.js";
import { prismaValidator } from "../config/databaseError.js";

export const command = {
  name: "register-channel",
  description: "Registers a channel for the bot to post epic games discounts.",
  options: [
    {
      type: 7, // https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
      name: "channel",
      description: "The channel in which the updates will be sent",
      required: true,
      channelTypes: [0], //https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    },
  ],
};

export const exec = async (interaction) => {
  const channel = interaction.options._hoistedOptions[0].value;

  const findChannel = await prisma.channels.findUnique({
    where: {
      channel,
    },
  });

  if (prismaValidator(findChannel).prismaError) {
    return interaction.reply(
      `An error occurred with the database, the team is already working on it`
    );
  }

  const query = findChannel
    ? await prisma.channels.update({
        data: {
          active: !findChannel.active,
        },
        where: { channel },
      })
    : await prisma.channels
        .create({
          data: {
            channel,
            server: interaction.guildId,
            register: new Date(),
          },
        })
        .catch((err) => err);

  if (query !== null && !prismaValidator(query).prismaError) {
    await interaction.reply(`Channel <#${channel}> registered!`);
  } else {
    await interaction.reply(
      `An error occurred with the database, the team is already working on it`
    );
  }
};

export default exec;
