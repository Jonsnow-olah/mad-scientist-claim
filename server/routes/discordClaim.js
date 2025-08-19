import fs from "fs";
import path from "path";
import csv from "csv-parser";
import express from "express";


const router = express.Router();


// Adjust this path to your CSV location
const CSV_PATH = path.join(process.cwd(), "data", "codes.csv");


router.post("/claim", async (req, res) => {
  try {
    const { discordId, discordUsername } = req.body;


    if (!discordId || !discordUsername) {
      return res.status(400).json({ success: false, message: "Missing Discord ID or username" });
    }


    const results = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        // Adjust these keys to match your CSV headers
        const rowDiscordId = (row.discordId || "").trim();
        const rowUsername = (row.discordUsername || "").trim();


        // Match either by ID or username
        if (
          rowDiscordId === discordId ||
          rowUsername.toLowerCase() === discordUsername.toLowerCase()
        ) {
          results.push({
            projectName: row.projectName || row.projectSlug || "Unknown project",
            code: row.code || null,
          });
        }
      })
      .on("end", () => {
        if (results.length === 0) {
          return res.json({
            success: true,
            codes: [
              {
                projectName: "Unknown project",
                code: null,
              },
            ],
          });
        }


        return res.json({
          success: true,
          codes: results,
        });
      });
  } catch (err) {
    console.error("Error in /claim:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


export default router;
