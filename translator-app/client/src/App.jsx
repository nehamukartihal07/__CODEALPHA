import { useEffect, useState } from "react";

const MAX_CHARS = 2000;

export default function App() {
  const [languages, setLanguages] = useState([]);
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("hi");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Load the language list from the server
  useEffect(() => {
    fetch("/api/languages")
      .then((res) => res.json())
      .then(setLanguages)
      .catch(() => setError("Cannot reach the server. Is it running?"));
  }, []);

  const translate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setDetected("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source, target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      setResult(data.translation);
      if (data.detectedLanguage) {
        const code = data.detectedLanguage.toLowerCase().split("-")[0];
        const lang = languages.find((l) => l.code.toLowerCase() === code);
        setDetected(lang ? lang.name : data.detectedLanguage);
      }
    } catch (err) {
      setResult("");
      setError(err.message);
    }
    setLoading(false);
  };

  // Swap languages and texts (not possible while source is "detect")
  const swap = () => {
    if (source === "auto") return;
    setSource(target);
    setTarget(source);
    setText(result);
    setResult(text);
    setDetected("");
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Read the translation aloud using the browser's built-in voices
  const speak = () => {
    if (!result || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = target;
    window.speechSynthesis.speak(utterance);
  };

  const clear = () => {
    setText("");
    setResult("");
    setError("");
    setDetected("");
  };

  return (
    <div className="page">
      <h1>Language Translator</h1>

      <div className="bar">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="auto">Detect language</option>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>

        <button className="swap" onClick={swap} disabled={source === "auto"} title="Swap languages">
          ⇄
        </button>

        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="panels">
        <div className="panel">
          <textarea
            value={text}
            maxLength={MAX_CHARS}
            placeholder="Enter text to translate..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && translate()}
          />
          <div className="panel-footer">
            <span>{text.length} / {MAX_CHARS}</span>
            <button className="link" onClick={clear} disabled={!text && !result}>Clear</button>
          </div>
        </div>

        <div className="panel result">
          <div className="output">
            {loading ? "Translating..." : result || <span className="muted">Translation appears here</span>}
          </div>
          <div className="panel-footer">
            <span>{detected && `Detected: ${detected}`}</span>
            <span className="actions">
              <button className="link" onClick={speak} disabled={!result}>Listen</button>
              <button className="link" onClick={copy} disabled={!result}>{copied ? "Copied!" : "Copy"}</button>
            </span>
          </div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="translate" onClick={translate} disabled={loading || !text.trim()}>
        {loading ? "Translating..." : "Translate"}
      </button>
      <p className="hint">Tip: press Ctrl + Enter to translate</p>
    </div>
  );
}
