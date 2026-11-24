// Tests the chunking and joining logic with a fake MyMemory API (no internet needed).
// Run with: npm test
const assert = require("assert");
const { splitText, translateText } = require("./translate");

// 1. Short text stays as one chunk
assert.deepStrictEqual(splitText("Hello world."), ["Hello world."]);

// 2. Long text is split into chunks of at most 450 characters
const long = "This is a sentence. ".repeat(100); // 2000 chars
const chunks = splitText(long);
assert.ok(chunks.length > 1, "long text should be split");
assert.ok(chunks.every((c) => c.length <= 450), "every chunk must be <= 450 chars");
assert.strictEqual(chunks.join(""), long, "no text may be lost");

// 3. One huge sentence with no punctuation is still cut safely
const huge = "a".repeat(1200);
assert.ok(splitText(huge).every((c) => c.length <= 450));
assert.strictEqual(splitText(huge).join(""), huge);

// 4. translateText calls the API per chunk and joins the results
let calls = 0;
global.fetch = async (url) => {
  calls++;
  const q = new URL(url).searchParams.get("q");
  return {
    ok: true,
    json: async () => ({
      responseStatus: 200,
      responseData: { translatedText: q.toUpperCase(), detectedLanguage: "en" },
    }),
  };
};

(async () => {
  const r = await translateText("Hello there. How are you?\nFine.", "en", "hi");
  assert.strictEqual(r.translation, "HELLO THERE. HOW ARE YOU?\nFINE.");
  assert.strictEqual(r.detected, "en");
  assert.strictEqual(calls, 1);

  calls = 0;
  await translateText(long, "auto", "fr");
  assert.strictEqual(calls, chunks.length);

  // 5. API errors are reported
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ responseStatus: 429, responseDetails: "Quota exceeded" }),
  });
  await assert.rejects(() => translateText("Hi", "en", "hi"), /Quota exceeded/);

  console.log("All tests passed");
})();
