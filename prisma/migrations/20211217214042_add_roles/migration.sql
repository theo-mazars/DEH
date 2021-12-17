-- CreateTable
CREATE TABLE "roles" (
    "id" VARCHAR(20) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "channel" VARCHAR(20) NOT NULL,

    CONSTRAINT "roles_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_uindex" ON "roles"("id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_channels_channel_fk" FOREIGN KEY ("channel") REFERENCES "channels"("channel") ON DELETE CASCADE ON UPDATE CASCADE;
