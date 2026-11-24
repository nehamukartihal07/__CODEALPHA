# FAQ Chatbot (MERN + TF-IDF / Cosine Similarity)

A simple chatbot that answers user questions by finding the most similar FAQ.

**Stack:** MongoDB, Express, React (Vite), Node.js
**NLP:** `natural` (Node's counterpart to NLTK) for tokenizing, stop-word removal and stemming; TF-IDF + cosine similarity written by hand in `server/nlp.js`.

## How it works

1. FAQs (question + answer) are stored in MongoDB (`server/faqs.json` is the seed data).
2. Each FAQ question is preprocessed: lowercase, remove punctuation, tokenize, remove stop words, stem.
3. A TF-IDF vector is built for every FAQ question.
4. When the user asks something, it gets the same preprocessing and a TF-IDF vector.
5. Cosine similarity picks the closest FAQ. If the score is below 0.2, the bot says it didn't understand.
6. The answer is shown in the React chat window.

## Setup

You need Node.js 18+ and MongoDB running locally (or a MongoDB Atlas URI).

### 1. Server
```bash
cd server
npm install
cp .env.example .env     # edit MONGO_URI if needed
npm run seed             # loads the sample FAQs into MongoDB
npm start                # http://localhost:5000
```

Test the matching without MongoDB:
```bash
npm test
```

### 2. Client
```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

Open http://localhost:5173 and start chatting.

## API

| Method | Route       | Body                    | Description                    |
|--------|-------------|-------------------------|--------------------------------|
| POST   | /api/chat   | `{ "message": "..." }`  | Returns the best matching answer |
| GET    | /api/faqs   | -                       | Lists all FAQ questions        |
| POST   | /api/faqs   | `{ "question", "answer" }` | Adds a FAQ and rebuilds the model |

## Use your own topic

Edit `server/faqs.json` with your own questions and answers, then run `npm run seed` again.

## Project structure

```
faq-chatbot/
  server/
    index.js        Express app + API routes
    nlp.js          preprocessing, TF-IDF, cosine similarity
    models/Faq.js   Mongoose model
    seed.js         loads faqs.json into MongoDB
    faqs.json       sample FAQs
    test.js         quick matching test
  client/
    src/App.jsx     chat UI
    src/App.css     styles
```
