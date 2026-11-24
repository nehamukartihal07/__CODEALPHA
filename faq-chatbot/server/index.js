require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Faq = require("./models/Faq");
const { buildModel, findBestMatch } = require("./nlp");

const app = express();
app.use(cors());
app.use(express.json());

let model = null; // TF-IDF model, rebuilt whenever FAQs change

const GREETINGS = ["hi", "hii", "hello", "hey", "good morning", "good afternoon", "good evening"];

async function loadModel() {
  const faqs = await Faq.find().lean();
  model = buildModel(faqs);
  console.log(`Model built from ${faqs.length} FAQs`);
}

// Chat endpoint: user question in, best answer out
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Reply to simple greetings
  const clean = message.trim().toLowerCase().replace(/[^a-z ]/g, "");
  if (GREETINGS.includes(clean)) {
    return res.json({
      reply: "Hello! How can I help you? You can ask about orders, shipping, returns, payments and more.",
    });
  }

  if (!model || model.faqs.length === 0) {
    return res.json({ reply: "No FAQs are loaded yet. Run: npm run seed" });
  }

  const result = findBestMatch(model, message);

  // No good match: suggest some example questions
  if (!result.matched) {
    const suggestions = model.faqs
      .slice(0, 4)
      .map((f) => "• " + f.question)
      .join("\n");
    return res.json({
      reply: "Sorry, I couldn't find an answer to that. You can try asking:\n" + suggestions,
      score: result.score,
    });
  }

  res.json({ reply: result.answer, matchedQuestion: result.question, score: result.score });
});

// List all FAQs (handy for showing suggestions in the UI)
app.get("/api/faqs", async (req, res) => {
  const faqs = await Faq.find().select("question -_id").lean();
  res.json(faqs);
});

// Add a new FAQ and rebuild the model
app.post("/api/faqs", async (req, res) => {
  const { question, answer, keywords } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: "question and answer are required" });
  }
  const faq = await Faq.create({ question, answer, keywords });
  await loadModel();
  res.status(201).json(faq);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/faq_chatbot";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await loadModel();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });