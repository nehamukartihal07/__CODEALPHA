# CampusConnect — College FAQ Chatbot

A beginner-friendly FAQ chatbot built with HTML, CSS, JavaScript, Python, Flask, NLTK, TF-IDF, and cosine similarity.

## Features
- Responsive chat interface
- College FAQ dataset stored in `faqs.json`
- NLP preprocessing: lowercase, tokenization, stop-word removal, stemming
- TF-IDF vectorization and cosine similarity matching
- Multiple alternative phrasings for each FAQ
- Fallback response when no close FAQ match is found
- Suggested questions, chat clear button, and API endpoints

## Requirements
- Python 3.10 or newer
- VS Code (recommended)
- Internet connection only for the first-time package installation and Google Fonts

## Setup on Windows

1. Extract the ZIP file.
2. Open the extracted `college_faq_chatbot` folder in VS Code.
3. Open VS Code Terminal: **Terminal → New Terminal**.
4. Create a virtual environment:

   ```powershell
   py -m venv venv
   ```

5. Activate it:

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt instead:

   ```cmd
   venv\Scripts\activate.bat
   ```

6. Install the packages:

   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

7. Start the application:

   ```powershell
   python app.py
   ```

8. Open this address in your browser:

   `http://127.0.0.1:5000`

Keep the terminal running while you use the website. Press **Ctrl + C** in the terminal to stop the server.

## Test questions
Try:
- How do I get admission?
- Tell me about the fees.
- When are exams scheduled?
- How much attendance do I need?
- Does the college have buses?
- How do I register for placements?
- What is the weather today? (should trigger the fallback)

## Add or edit FAQs

Open `faqs.json`. Each FAQ has:
- `category`: group name shown in the chat
- `question`: main question
- `alternatives`: other ways a student might ask the same question
- `answer`: chatbot response

Copy an existing object, edit the text, and keep valid JSON syntax. Restart the Flask server after changing the FAQ file so the chatbot reloads the data.

**Important:** The included answers are generic examples, not official information for a particular college. Replace them with verified details from your institution before presenting this as a real student help service.

## API endpoints
- `GET /api/health` — server status and FAQ count
- `GET /api/faqs` — FAQ questions and categories
- `POST /api/chat` — send `{ "message": "your question" }` as JSON

## Project structure

```text
college_faq_chatbot/
├── app.py
├── faqs.json
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## How matching works
1. The user sends a question from the browser.
2. JavaScript sends it to Flask using `fetch()`.
3. NLTK preprocessing lowercases and tokenizes text, removes common stop words, and stems remaining words.
4. Scikit-learn converts the FAQ questions into TF-IDF vectors.
5. Cosine similarity compares the user's question with those vectors.
6. The answer for the closest FAQ is returned if its score is at least `0.18`; otherwise the fallback message is returned.

This is a retrieval-based FAQ chatbot. It does not generate new answers like a large language model.
