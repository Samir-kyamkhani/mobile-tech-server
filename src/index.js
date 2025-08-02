import app from "./app.js";
import dotenv from "dotenv";
import prisma from "./db/db.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

async function db_connection() {
  try {
    await prisma.$connect();
    console.log("DATABASE CONNECTED SUCCESSFULLY");
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED ::", error);
    throw error;
  }
}

db_connection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER RUNNING ON http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("SERVER FAILED TO START ::", error);
  });
