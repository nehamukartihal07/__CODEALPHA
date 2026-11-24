# Language Translator (React + Express, no database)

Translate text between 28 languages, including English, Hindi, Kannada, Marathi, Tamil, Telugu, Spanish, French and more.

**Stack:** React (Vite) front end, Node.js + Express back end.
**Translation:** free [MyMemory](https://mymemory.translated.net) API. No API key and no database needed.

## Features
- Auto-detect the source language
- Swap languages (also swaps the texts)
- Copy translation, listen to it (browser text-to-speech)
- Character counter (max 2000), Ctrl + Enter to translate
- Long text is split into chunks automatically (MyMemory accepts ~500 chars per call)

## Run it

You need Node.js 18 or newer.

### 1. Server
```bash
cd server
npm install
npm start          # http://localhost:5000
```
Optional: copy `.env.example` to `.env` and add an email in `MYMEMORY_EMAIL`. This raises the free limit from 5,000 to 50,000 characters per day.

### 2. Client (in a second terminal)
```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Open http://localhost:5173.

## Test
```bash
cd server
npm test           # checks chunking and error handling with a fake API
```

## API

| Method | Route            | Body                                          |
|--------|------------------|-----------------------------------------------|
| GET    | /api/languages   | -                                             |
| POST   | /api/translate   | `{ "text": "Hello", "source": "auto", "target": "hi" }` |

## Structure
```
server/
  index.js       Express routes + validation
  translate.js   chunking + MyMemory API calls
  languages.js   language list
  test.js        tests
client/
  src/App.jsx    translator UI
  src/App.css    styles
```
