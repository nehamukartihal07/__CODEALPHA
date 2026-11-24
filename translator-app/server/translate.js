// Translation logic. Uses the free MyMemory API (no API key needed).
// MyMemory only accepts ~500 characters per call, so long text is split into chunks.

const CHUNK_SIZE = 450;

// Split text into chunks (<= CHUNK_SIZE chars), preferring sentence boundaries
function splitText(text) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length <= CHUNK_SIZE) {
      current += sentence;
      continue;
    }
    if (current) chunks.push(current);
    let rest = sentence;
    while (rest.length > CHUNK_SIZE) {
      chunks.push(rest.slice(0, CHUNK_SIZE)); // one very long sentence: cut it
      rest = rest.slice(CHUNK_SIZE);
    }
    current = rest;
  }
  if (current) chunks.push(current);
  return chunks;
}

// Translate one chunk with the MyMemory API
async function translateChunk(text, source, target) {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source === "auto" ? "Autodetect" : source}|${target}`,
  });
  if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
  if (!res.ok) throw new Error(`Translation service error (${res.status})`);

  const data = await res.json();
  if (Number(data.responseStatus) !== 200) {
    throw new Error(data.responseDetails || "Translation failed");
  }
  return {
    translation: data.responseData.translatedText,
    detected: data.responseData.detectedLanguage || "",
  };
}

// Translate any length of text (chunk by chunk, keeping line breaks)
async function translateText(text, source, target) {
  const chunks = splitText(text);
  let output = "";
  let detected = "";

  for (const chunk of chunks) {
    const trailing = chunk.match(/\s*$/)[0];
    const { translation, detected: d } = await translateChunk(chunk.trim(), source, target);
    if (!detected && d) detected = d;
    output += translation + (trailing.includes("\n") ? trailing : " ");
  }
  return { translation: output.trim(), detected };
}

module.exports = { splitText, translateText };
