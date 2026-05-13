const { Pool } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");

async function check() {
  const url = "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: url });
  
  const res = await pool.query('SELECT * FROM "User"');
  console.log("Users in DB:", res.rows.map(u => ({ email: u.email, hash: u.passwordHash })));
  
  const pw1 = "cambiar-password-1";
  const pw2 = "cambiar-password-2";
  
  for (const u of res.rows) {
    if (u.email === "usuario1@ejemplo.com") {
      console.log("u1 pw matches:", bcrypt.compareSync(pw1, u.passwordHash));
    }
    if (u.email === "usuario2@ejemplo.com") {
      console.log("u2 pw matches:", bcrypt.compareSync(pw2, u.passwordHash));
    }
  }
}

check().then(() => process.exit(0)).catch(console.error);
