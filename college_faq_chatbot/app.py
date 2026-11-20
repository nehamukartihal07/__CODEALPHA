from flask import Flask, render_template, request, jsonify
from pathlib import Path
import json
import re
import nltk
from nltk.tokenize import RegexpTokenizer
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
FAQ_FILE = BASE_DIR / "faqs.json"

# RegexpTokenizer works locally without downloading NLTK's punkt data.
tokenizer = RegexpTokenizer(r"[A-Za-z0-9']+")
stemmer = PorterStemmer()

STOP_WORDS = {
    "a", "an", "the", "is", "are", "am", "was", "were", "be", "been",
    "being", "to", "of", "in", "on", "at", "for", "from", "with", "by",
    "and", "or", "but", "i", "we", "you", "he", "she", "they", "it",
    "my", "our", "your", "their", "this", "that", "these", "those",
    "do", "does", "did", "can", "could", "would", "should", "how", "what",
    "when", "where", "which", "who", "whom", "why", "please", "tell", "me"
}

def preprocess(text):
    """Lowercase, tokenize, remove common stop words, and stem tokens."""
    tokens = tokenizer.tokenize(text.lower())
    cleaned = [
        stemmer.stem(token)
        for token in tokens
        if token not in STOP_WORDS and len(token) > 1
    ]
    return " ".join(cleaned)

def load_faqs():
    with FAQ_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list) or not data:
        raise ValueError("faqs.json must contain a non-empty list.")
    return data

FAQS = load_faqs()

# Each FAQ may have several example questions. They help match different wording.
faq_questions = []
faq_indexes = []
for index, faq in enumerate(FAQS):
    questions = [faq["question"]] + faq.get("alternatives", [])
    for question in questions:
        faq_questions.append(preprocess(question))
        faq_indexes.append(index)

vectorizer = TfidfVectorizer(ngram_range=(1, 2))
faq_matrix = vectorizer.fit_transform(faq_questions)

def find_best_answer(user_question):
    cleaned_question = preprocess(user_question)
    if not cleaned_question.strip():
        return None, 0.0

    user_vector = vectorizer.transform([cleaned_question])
    scores = cosine_similarity(user_vector, faq_matrix).flatten()

    best_example_index = int(scores.argmax())
    best_score = float(scores[best_example_index])
    best_faq_index = faq_indexes[best_example_index]

    # Avoid confidently answering unrelated questions.
    if best_score < 0.18:
        return None, best_score

    return FAQS[best_faq_index], best_score

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    question = str(data.get("message", "")).strip()

    if not question:
        return jsonify({
            "answer": "Please type a question so I can help you.",
            "matched": False,
            "confidence": 0
        }), 400

    if len(question) > 500:
        return jsonify({
            "answer": "Please keep your question under 500 characters.",
            "matched": False,
            "confidence": 0
        }), 400

    faq, score = find_best_answer(question)

    if faq is None:
        answer = (
            "I'm sorry, I couldn't find a close match in my FAQ collection. "
            "Please try rephrasing your question, or contact the college "
            "administration for help."
        )
        return jsonify({
            "answer": answer,
            "matched": False,
            "confidence": round(score, 3)
        })

    return jsonify({
        "answer": faq["answer"],
        "matched": True,
        "question": faq["question"],
        "category": faq.get("category", "General"),
        "confidence": round(score, 3)
    })

@app.route("/api/faqs", methods=["GET"])
def get_faqs():
    """Return question/category pairs for the FAQ suggestion list."""
    return jsonify([
        {"question": faq["question"], "category": faq.get("category", "General")}
        for faq in FAQS
    ])

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "faq_count": len(FAQS)})

if __name__ == "__main__":
    app.run(debug=True)
