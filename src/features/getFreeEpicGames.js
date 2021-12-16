import axios from "axios";
import cron from "node-cron";
import { MessageEmbed } from "discord.js";

import prisma from "../config/database.js";
import { prismaValidator } from "../config/databaseError.js";
import { monthDayFormat, shortFormat, ISOFormat } from "../utils/formatDate.js";

const getChannelsCollection = async () => {
  const query = await prisma.channels.findMany({ where: { active: true } });

  if (prismaValidator(query).prismaError || query === null) return [];

  return query.map(({ channel }) => channel);
};

const getGamesCollection = async (channel) => {
  const query = await prisma.games.findMany({
    where: { channel },
  });

  return query.map((game) => game.product);
};

const getFreeEpicGames = async (Client) => {
  cron.schedule("5 16 * * *", async () => {
    const channels = await getChannelsCollection();
    const freeGame = await axios.get(
      "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR"
    );

    if (freeGame.status !== 200) return;
    const {
      data: { data },
    } = freeGame;
    const games = data.Catalog.searchStore.elements;

    games.forEach((game) => {
      if (
        !game.customAttributes.find((attr) => {
          return attr.key === "com.epicgames.app.freegames.vault.slug";
        }) ||
        game.productSlug === "[]"
      )
        return;

      const startDate =
        game?.promotions?.promotionalOffers[0]?.promotionalOffers[0]
          ?.startDate || null;
      const endDate =
        game?.promotions?.promotionalOffers[0]?.promotionalOffers[0]?.endDate ||
        null;

      const prices = game.price;
      if (
        prices.totalPrice.discountPrice > 0 ||
        prices.totalPrice.originalPrice
      )
        return;

      const embed = new MessageEmbed({
        color: 0x9dfe89,
        author: {
          name: "New Epic Games Event",
          icon_url:
            "https://cdn.pixabay.com/photo/2016/12/23/07/00/game-1926905_1280.png",
          url: `https://www.epicgames.com/store/fr/p/${
            game.productSlug || game.urlSlug
          }`,
        },
        title: `Epic Free Game: ${game.title}`,
        description:
          prices.totalPrice.originalPrice &&
          prices.totalPrice.originalPrice === prices.totalPrice.discount
            ? `The Vault Is Open: Claim ${
                game.title
              } for **FREE** until **${monthDayFormat(endDate)}**!`
            : `A new free game appeared on the Epic Games Store!`,
        fields: [
          prices.totalPrice.originalPrice && {
            name: "Price",
            value: prices.totalPrice.originalPrice
              ? `~~${prices.totalPrice.originalPrice / 100}€~~ **${
                  (prices.totalPrice.originalPrice -
                    prices.totalPrice.discount) /
                  100
                }€**`
              : `**${
                  (prices.totalPrice.originalPrice -
                    prices.totalPrice.discount) /
                  100
                }€**`,
            inline: true,
          },
          endDate && {
            name: "Ends on",
            value: shortFormat(ISOFormat(endDate)),
            inline: true,
          },
        ].reduce((acc, cur) => (cur ? [...acc, cur] : acc), []),
        image: {
          url:
            game.keyImages.find(
              (image) => image.type === "DieselStoreFrontWide"
            )?.url ||
            game.keyImages[0]?.url ||
            "",
        },
        thumbnail: {
          url: "https://img.icons8.com/clouds/200/000000/epic-games.png",
        },
        timestamp: new Date(startDate || new Date()),
        footer: {
          text: "Sale started",
        },
      });

      [...channels].forEach(async (channel) => {
        const previousGames = await getGamesCollection(channel);
        if (
          previousGames.find((pGame) =>
            game.productSlug
              ? pGame === game.productSlug
              : pGame === game.urlSlug
          )
        )
          return;

        console.log(channel);
        const targetChannel = Client.channels.cache.get(channel);
        console.log(Client.channels);
        targetChannel
          .send({
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "Buy for free",
                    url: `https://www.epicgames.com/store/fr/p/${
                      game.productSlug || game.urlSlug
                    }`,
                  },
                ],
              },
            ],
          })
          .then(
            async () =>
              await prisma.games.create({
                data: {
                  channel,
                  product: game.productSlug || game.urlSlug,
                  week: new Date(startDate).toISOString(),
                },
              })
          );
      });
    });
  });
};

export default getFreeEpicGames;
