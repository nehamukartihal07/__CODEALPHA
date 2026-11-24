// Quick check of the NLP matching without MongoDB. Run with: npm test
const faqs = require("./faqs.json");
const { preprocess, buildModel, findBestMatch } = require("./nlp");

const model = buildModel(faqs);
console.log("Preprocess example:", preprocess("How can I get my money back?!"));

const tests = [
  ["Where is my parcel?", "How do I track my order?"],
  ["how can i send item back", "What is your return policy?"],
  ["I forgot my password", "How do I reset my password?"],
  ["do you take UPI payments", "What payment methods do you accept?"],
  ["when will my package arrive", "How long does shipping take?"],
  ["who is the president of mars", null],
];

let passed = 0;
tests.forEach(([q, expected]) => {
  const r = findBestMatch(model, q);
  const got = r.matched ? r.question : null;
  const ok = got === expected;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"} | "${q}" -> ${got} (score ${r.score})`);
});
console.log(`${passed}/${tests.length} passed`);
