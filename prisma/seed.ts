import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

neonConfig.webSocketConstructor = ws;

async function seed() {
  const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  const users = [
    {
      email: process.env.USER1_EMAIL,
      password: process.env.USER1_PASSWORD,
      name: process.env.USER1_NAME || "Usuario 1",
    },
    {
      email: process.env.USER2_EMAIL,
      password: process.env.USER2_PASSWORD,
      name: process.env.USER2_NAME || "Usuario 2",
    },
  ];

  for (const u of users) {
    if (!u.email || !u.password) continue;

    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hash = bcrypt.hashSync(u.password, 10);
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: hash,
        }
      });
      console.log(`User ${u.email} created.`);
    } else {
      console.log(`User ${u.email} already exists.`);
    }
  }

  await prisma.$disconnect();
}

seed().catch(console.error);
