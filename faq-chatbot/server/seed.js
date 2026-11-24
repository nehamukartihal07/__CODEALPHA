// Loads faqs.json into MongoDB. Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const Faq = require("./models/Faq");
const faqs = require("./faqs.json");

(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/faq_chatbot");
  await Faq.deleteMany({});
  await Faq.insertMany(faqs);
  console.log(`Seeded ${faqs.length} FAQs`);
  await mongoose.disconnect();
})();
