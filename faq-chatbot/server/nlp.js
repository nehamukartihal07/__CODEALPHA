// NLP helpers: preprocessing + TF-IDF + cosine similarity.
// (Node equivalent of what you would do with NLTK / SpaCy in Python.)
const natural = require("natural");

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopwords = new Set(natural.stopwords);

// 1. Preprocess: lowercase -> remove punctuation -> tokenize -> drop stopwords -> stem
function preprocess(text) {
  const cleaned = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  return tokenizer
    .tokenize(cleaned)
    .filter((word) => !stopwords.has(word))
    .map((word) => stemmer.stem(word));
}

// Turn a list of tokens into term-frequency counts
function termFreq(tokens) {
  const tf = {};
  tokens.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
  return tf;
}

// 2. Build the TF-IDF model from the FAQ list
function buildModel(faqs) {
  // question + optional keywords (synonyms) are used to build each FAQ's vector
  const docs = faqs.map((faq) => preprocess(`${faq.question} ${faq.keywords || ""}`));
  const N = docs.length;

  // document frequency: in how many FAQs does each word appear?
  const df = {};
  docs.forEach((tokens) => {
    new Set(tokens).forEach((t) => (df[t] = (df[t] || 0) + 1));
  });

  // smoothed inverse document frequency
  const idf = {};
  Object.keys(df).forEach((t) => {
    idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;
  });

  const vectors = docs.map((tokens) => toVector(tokens, idf));
  return { faqs, idf, vectors };
}

// TF-IDF vector (as an object: word -> weight). Unknown words are ignored.
function toVector(tokens, idf) {
  const tf = termFreq(tokens);
  const vec = {};
  Object.keys(tf).forEach((t) => {
    if (idf[t]) vec[t] = tf[t] * idf[t];
  });
  return vec;
}

// 3. Cosine similarity between two sparse vectors
function cosine(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (const k in a) {
    normA += a[k] * a[k];
    if (b[k]) dot += a[k] * b[k];
  }
  for (const k in b) normB += b[k] * b[k];
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 4. Find the best matching FAQ for a user question
function findBestMatch(model, userQuestion, threshold = 0.2) {
  const queryVec = toVector(preprocess(userQuestion), model.idf);

  let bestIndex = -1;
  let bestScore = 0;
  model.vectors.forEach((vec, i) => {
    const score = cosine(queryVec, vec);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  if (bestIndex === -1 || bestScore < threshold) {
    return { matched: false, score: bestScore };
  }
  const faq = model.faqs[bestIndex];
  return {
    matched: true,
    score: Number(bestScore.toFixed(3)),
    question: faq.question,
    answer: faq.answer,
  };
}

module.exports = { preprocess, buildModel, findBestMatch };
