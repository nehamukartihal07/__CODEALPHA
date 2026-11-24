require("dotenv").config();
const express = require("express");
const cors = require("cors");
const languages = require("./languages");
const { translateText } = require("./translate");

const app = express();
app.use(cors());
app.use(express.json());

const MAX_CHARS = 2000;
const validCodes = new Set(languages.map((l) => l.code));

// Language list for the dropdowns
app.get("/api/languages", (req, res) => res.json(languages));

// Translate text
app.post("/api/translate", async (req, res) => {
  const { text, source = "auto", target } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Please enter some text to translate." });
  }
  if (text.length > MAX_CHARS) {
    return res.status(400).json({ error: `Text is too long (max ${MAX_CHARS} characters).` });
  }
  if (!validCodes.has(target) || (source !== "auto" && !validCodes.has(source))) {
    return res.status(400).json({ error: "Invalid language selected." });
  }
  if (source === target) {
    return res.json({ translation: text, detectedLanguage: "" });
  }

  try {
    const { translation, detected } = await translateText(text, source, target);
    res.json({ translation, detectedLanguage: detected });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message || "Translation service is unavailable." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
