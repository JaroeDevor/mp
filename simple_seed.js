const { Pool } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

async function seed() {
  const url = "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: url });
  
  const users = [
    { email: process.env.USER1_EMAIL, password: process.env.USER1_PASSWORD, name: process.env.USER1_NAME || "Usuario 1" },
    { email: process.env.USER2_EMAIL, password: process.env.USER2_PASSWORD, name: process.env.USER2_NAME || "Usuario 2" }
  ];

  for (const u of users) {
    if (!u.email || !u.password) continue;
    const res = await pool.query('SELECT * FROM "User" WHERE email = $1', [u.email]);
    if (res.rows.length === 0) {
      const hash = bcrypt.hashSync(u.password, 10);
      const id = "c" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      await pool.query('INSERT INTO "User" (id, email, name, "passwordHash", "createdAt") VALUES ($1, $2, $3, $4, $5)', [id, u.email, u.name, hash, new Date().toISOString()]);
      console.log(`User ${u.email} created.`);
    } else {
      console.log(`User ${u.email} already exists.`);
    }
  }
}
seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
