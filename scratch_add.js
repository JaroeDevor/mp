const { Pool } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");

async function check() {
  const url = "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: url });
  
  const email = "agustin@ejemplo.com";
  const pass = "123456";
  const hash = bcrypt.hashSync(pass, 10);
  
  const id = "c" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  
  await pool.query('INSERT INTO "User" (id, email, name, "passwordHash", "createdAt") VALUES ($1, $2, $3, $4, $5)', [id, email, "Agustin", hash, new Date().toISOString()]);
  
  console.log("Done");
}

check().then(() => process.exit(0)).catch(console.error);
