import express from "express";
import dotenv from "dotenv";
import path from "path";
import { nanoid } from "nanoid";
import urlExist from "url-exist";
import pkg from "pg";
const { Pool } = pkg;

const __dirname = path.resolve();

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log the connection status
pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

pool.on("error", (err, client) => {
  console.error("Error occurred on PostgreSQL connection", err);
});

// Middleware to validate URL
const validateURL = async (req, res, next) => {
  const { url } = req.body;
  const isExist = await urlExist(url);
  if (!isExist) {
    return res.json({ message: "Invalid URL", type: "failure" });
  }
  next();
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// POST /link endpoint
app.post("/link", validateURL, async (req, res) => {
  res.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });

  const { url } = req.body;

  // Generate a unique id for the URL
  const id = nanoid(7);

  try {
    // Insert URL and ID into the id_url_mapping table
    console.log(`Inserting new URL with ID: ${id}`);
    await pool.query("INSERT INTO id_url_mapping (id, url) VALUES ($1, $2)", [
      id,
      url,
    ]);
    console.log(`URL with ID ${id} inserted successfully.`);

    const domain = process.env.PRODUCTION_URL || "http://localhost:8000/";
    res.json({ message: `${domain}${id}`, type: "success" });
  } catch (err) {
    console.error("Error inserting into database:", err);
    res.status(500).json({
      message: "An error was encountered! Please try again.",
      type: "error",
    });
  }
});

// Redirect endpoint for shortened URLs
app.get("/:id", async (req, res) => {
  const id = req.params.id;
  console.log(`Looking up original URL for ID: ${id}`);

  try {
    const result = await pool.query(
      "SELECT * FROM id_url_mapping WHERE id = $1",
      [id]
    );
    const originalLink = result.rows[0];

    if (!originalLink) {
      console.log(`No URL found for ID: ${id}`);
      return res.sendFile(__dirname + "/public/404.html");
    }

    console.log(`Redirecting to original URL: ${originalLink.url}`);
    res.redirect(originalLink.url);
  } catch (err) {
    console.error("Error looking up URL:", err);
    res.status(500).json({
      message: "An error occurred while looking up the URL.",
      type: "error",
    });
  }
});

// Function to start the server after DB connection
async function startServer() {
  try {
    // Wait for the DB connection before starting the server
    await pool.connect();
    console.log("Database connection established.");

    // Start the Express server
    app.listen(8000, () => {
      console.log("App listening on port 8000");
    });
  } catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1); // Exit the process if DB connection fails
  }
}

startServer();
