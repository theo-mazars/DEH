-- CreateTable
CREATE TABLE "channels" (
    "server" VARCHAR(20) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "register" TIMESTAMP(6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "channels_pk" PRIMARY KEY ("channel")
);

-- CreateTable
CREATE TABLE "games" (
    "channel" VARCHAR(20) NOT NULL,
    "product" VARCHAR(255) NOT NULL,
    "week" DATE NOT NULL,

    CONSTRAINT "games_pk" PRIMARY KEY ("channel","product","week")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_channel_uindex" ON "channels"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "games_channel_product_week_uindex" ON "games"("channel", "product", "week");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_channels_channel_fk" FOREIGN KEY ("channel") REFERENCES "channels"("channel") ON DELETE CASCADE ON UPDATE CASCADE;
