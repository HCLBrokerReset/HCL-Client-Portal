/* =============================================================================
   speech.js — Spanish text-to-speech + microphone scoring
   - TTS via the Web Speech API (SpeechSynthesis), preferring a Spain voice.
   - Recognition via SpeechRecognition (webkit on iOS Safari) with fuzzy match.
   Both degrade gracefully if the device/browser can't do them.
   ========================================================================== */

const Speech = (() => {
  // -------------------------------------------------------------- TTS ------
  let voices = [];
  let preferredVoice = null;

  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
    // Prefer Castilian (es-ES); fall back to any Spanish voice.
    preferredVoice =
      voices.find((v) => /es[-_]ES/i.test(v.lang)) ||
      voices.find((v) => /^es/i.test(v.lang)) ||
      null;
  }

  if ("speechSynthesis" in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function canSpeak() {
    return "speechSynthesis" in window;
  }

  // rate: 1 = normal, 0.7 = slow-and-clear
  function speak(text, { rate = 0.95 } = {}) {
    return new Promise((resolve) => {
      if (!canSpeak()) return resolve(false);
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES";
        if (preferredVoice) u.voice = preferredVoice;
        u.rate = rate;
        u.pitch = 1;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        window.speechSynthesis.speak(u);
      } catch (e) {
        resolve(false);
      }
    });
  }

  function stop() {
    if (canSpeak()) window.speechSynthesis.cancel();
  }

  // Did we actually find a Spanish voice? (Affects the UI hint we show.)
  function hasSpanishVoice() {
    return !!preferredVoice;
  }

  // ------------------------------------------------------ Recognition ------
  const SR =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function canListen() {
    return !!SR;
  }

  // Listen once and return the best transcript (string) or null.
  function listenOnce({ onStart, timeoutMs = 7000 } = {}) {
    return new Promise((resolve) => {
      if (!SR) return resolve(null);
      const rec = new SR();
      rec.lang = "es-ES";
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      let alternatives = [];

      const finish = (val) => {
        if (done) return;
        done = true;
        try {
          rec.stop();
        } catch (e) {}
        resolve(val);
      };

      rec.onstart = () => onStart && onStart();
      rec.onresult = (ev) => {
        const res = ev.results[0];
        alternatives = [];
        for (let i = 0; i < res.length; i++) alternatives.push(res[i].transcript);
        finish({ best: alternatives[0], alternatives });
      };
      rec.onerror = (ev) => finish({ error: ev.error });
      rec.onend = () => finish(alternatives.length ? { best: alternatives[0], alternatives } : null);

      try {
        rec.start();
      } catch (e) {
        finish({ error: "start-failed" });
      }
      setTimeout(() => finish(alternatives.length ? { best: alternatives[0], alternatives } : null), timeoutMs);
    });
  }

  // ------------------------------------------------------ Scoring ----------
  // Normalise: lowercase, strip accents & punctuation, collapse spaces.
  function normalise(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[¿?¡!.,;:"'()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Levenshtein distance for fuzzy matching.
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  // Returns a similarity score 0..1 between heard text and target,
  // taking the best of the recognition alternatives.
  function scoreMatch(target, heard) {
    const t = normalise(target);
    const candidates = Array.isArray(heard) ? heard : [heard];
    let best = 0;
    for (const c of candidates) {
      const h = normalise(c);
      if (!h) continue;
      if (h === t) return 1;
      const dist = levenshtein(t, h);
      const sim = 1 - dist / Math.max(t.length, h.length);
      if (sim > best) best = sim;
    }
    return best;
  }

  return {
    canSpeak,
    speak,
    stop,
    hasSpanishVoice,
    canListen,
    listenOnce,
    normalise,
    scoreMatch,
  };
})();

if (typeof window !== "undefined") window.Speech = Speech;
