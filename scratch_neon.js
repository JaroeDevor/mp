const { Pool } = require("@neondatabase/serverless");
const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
console.log("URL IS:", url);
const pool = new Pool({ connectionString: url });
pool.query("SELECT 1+1").then(() => console.log("Success")).catch(console.error);
