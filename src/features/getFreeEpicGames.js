import axios from "axios";
import cron from "node-cron";
import { MessageEmbed } from "discord.js";

import prisma from "../config/database.js";
import { prismaValidator } from "../config/databaseError.js";
import { monthDayFormat } from "../utils/formatDate.js";

const fetchFreeGames = async () => {
  const freeGamesAPI = await axios.get(
    "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR"
  );

  if (freeGamesAPI.status !== 200) return;

  return freeGamesAPI.data.data.Catalog.searchStore.elements.filter(
    (games) =>
      games.customAttributes?.find(
        ({ key }) => key === "com.epicgames.app.freegames.vault.slug"
      ) && games.productSlug !== "[]"
  );
};

const getMainPage = async (slug) => {
  const gameInfos = await axios.get(
    `https://www.epicgames.com/graphql?operationName=getMappingByPageSlug&variables={"pageSlug":"${slug}"}&extensions={"persistedQuery":{"version":1,"sha256Hash":"5a08e9869c983776596498e0c4052c55f9e54c79e18a303cd5eb9a46be55c7d7"}}`
  );

  if (gameInfos.status !== 200) return;

  return {
    sandboxId: gameInfos.data.data.StorePageMapping.mapping.sandboxId,
    productId: gameInfos.data.data.StorePageMapping.mapping.productId,
  };
};

const getCatalogOffersByGame = async (sandboxId) => {
  const catalogOffers = await axios.get(
    `https://www.epicgames.com/graphql?operationName=getRelatedOfferIdsByCategory&variables={"allowCountries":"FR","category":"games/edition/base|software/edition/base","country":"FR","locale":"en-US","namespace":"${sandboxId}","sortBy":"pcReleaseDate","sortDir":"DESC","codeRedemptionOnly":false}&extensions={"persistedQuery":{"version":1,"sha256Hash":"f342f5ab9018330a07db87ddd58598330db021d81cb2ab8998c3ffb809ca34f4"}}`
  );

  if (catalogOffers.status !== 200) return;

  return catalogOffers?.data?.data?.Catalog?.catalogOffers?.elements[0]?.id;
};

const getGameOffer = async (offerId, sandboxId) => {
  const catalogOffer = await axios.get(
    `https://www.epicgames.com/graphql?operationName=getCatalogOffer&variables={"locale":"en-US","country":"FR","offerId":"${offerId}","sandboxId":"${sandboxId}"}&extensions={"persistedQuery":{"version":1,"sha256Hash":"3fe02aae98bea508d894173f8bcd8a379f0959ff4b3e1bd2c31183260578922a"}}`
  );

  if (catalogOffer.status !== 200) return;

  const gameOffer = catalogOffer.data.data.Catalog.catalogOffer;

  return {
    price: {
      originalPrice: gameOffer.price?.totalPrice?.originalPrice || 0,
      discountPrice: gameOffer.price?.totalPrice?.discountPrice || 0,
      discount: gameOffer.price?.totalPrice?.discount || 0,
    },
    genres: gameOffer.tags
      .filter((tag) => tag.groupName === "genre")
      .map((tag) => tag.name),
    features: gameOffer.tags
      .filter((tag) => tag.groupName === "feature")
      .map((tag) => tag.name),
  };
};

const formatGame = async (game) => {
  const mainPageInfos = await getMainPage(game.productSlug || game.urlSlug);
  if (!mainPageInfos) return;

  const catalogOffers = await getCatalogOffersByGame(mainPageInfos.sandboxId);
  if (!catalogOffers) return;

  const gameOffer = await getGameOffer(catalogOffers, mainPageInfos.sandboxId);
  if (!gameOffer) return;

  return {
    title: game.title,
    slug: game.productSlug,
    url: `https://www.epicgames.com/store/fr/p/${
      game.productSlug || game.urlSlug
    }`,
    image:
      game.keyImages.find((image) => image.type === "DieselStoreFrontWide")
        ?.url ||
      game.keyImages[0]?.url ||
      "",
    endDate:
      game?.promotions?.promotionalOffers[0]?.promotionalOffers[0]?.endDate ||
      null,
    originalPrice: 0,
    genres: [],
    features: [],
    critics: 0,
    ...mainPageInfos,
    ...gameOffer,
  };
};

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

export const gameFetcher = async (Client) => {
  const channels = await getChannelsCollection();
  const freeGames = await fetchFreeGames();
  if (!freeGames) return;

  const games = await Promise.all(
    freeGames.map(async (game) => {
      return await formatGame(game);
    })
  );

  games.forEach((game) => {
    const embed = new MessageEmbed({
      type: "rich",
      title: `${game.title} - Epic Games`,
      description: `**Hold on!** Epic Games just set Neon Abyss for **FREE** on the Epic Games Store until **${monthDayFormat(
        new Date(game.endDate)
      )}**!`,
      color: 0x9dfe89,
      fields: [
        {
          name: "Genres",
          value: game.genres.map((g) => `\`${g}\``).join(" "),
          inline: true,
        },
        {
          name: "Features",
          value: game.features.map((g) => `\`${g}\``).join(" "),
          inline: true,
        },
      ].reduce((acc, cur) => (cur.value ? [...acc, cur] : acc), []),
      image: {
        url: game.image,
      },
      footer: {
        text: "Until",
      },
      timestamp: new Date(game.endDate),
      url: game.url,
    });

    [...channels].forEach(async (channel) => {
      const previousGames = await getGamesCollection(channel);
      if (previousGames.find((pGame) => pGame === game.slug)) return;

      const targetChannel = Client.channels.cache.get(channel);
      targetChannel
        .send({
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [
                {
                  style: 1,
                  label: `${game.price.originalPrice / 100}€`,
                  custom_id: `row_0_button_0`,
                  disabled: true,
                  type: 2,
                },
                {
                  style: 3,
                  label: `FREE`,
                  custom_id: `row_0_button_1`,
                  disabled: false,
                  type: 2,
                },
                {
                  type: 2,
                  style: 5,
                  label: "Buy for free",
                  url: game.url,
                },
              ],
            },
          ],
          allowed_mentions: {
            replied_user: false,
            parse: ["roles"],
            roles: ["Epic Mentions"],
          },
        })
        .then(async () => {
          await prisma.games.create({
            data: {
              channel,
              product: game.slug,
              week: new Date(game.endDate).toISOString(),
            },
          });

          const role = await prisma.roles.findFirst({
            where: { channel: targetChannel.id },
          });
          if (role) (await targetChannel.send(`<@&${role.id}>`)).delete(50);
        });
    });
  });
};

const getFreeEpicGames = async (Client) => {
  cron.schedule("5 16 * * *", async () => {
    gameFetcher(Client);
  });
};

export default getFreeEpicGames;
