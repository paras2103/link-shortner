import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;
dotenv.config({ path: "../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SQL to create the id_url_mapping table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS id_url_mapping (
    id VARCHAR(7) PRIMARY KEY,
    url TEXT NOT NULL
  );
`;

// Function to run the migration
async function runMigration() {
  try {
    // Connect to the database
    const client = await pool.connect();

    try {
      console.log("Creating id_url_mapping table...");
      // Run the create table query
      await client.query(createTableQuery);
      console.log("Table created or already exists.");
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration script
runMigration();
