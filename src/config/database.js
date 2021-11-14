import Prisma from "@prisma/client";
import { config } from "dotenv";

config();
const prisma = global.prisma || new Prisma.PrismaClient();
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export default prisma;
