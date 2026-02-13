/*
  config.js
  Samler konstanter + små helpers på ett sted.
  Brukes av alle sider.
*/
(function () {
  const CONFIG = {
    FIREBASE: {
      apiKey: "AIzaSyBtjn54Bz0Mjeh43hanythhbAhPBna7-Eg",
      authDomain: "profesor-7e112.firebaseapp.com",
      projectId: "profesor-7e112"
    },

    PRESENCE: {
      HEARTBEAT_MS: 8000,
      TIMEOUT_MS: 30000
    },

    // Modus i "state"
    // NB: MULTI er den generelle flervalgstypen (2+ valg).
    MODES: {
      SBS: "sbs",
      BNR: "bnr",
      ABC: "abc",
      YESNO: "yesno",
      MULTI: "multi",
      LIKERT: "likert",
      OPEN: "open",
      WORDCLOUD: "wordcloud"
    },

    FIRESTORE: {
      STATE_DOC:    { collection: "app",   doc: "state" },
      POLL_DOC:     { collection: "polls", doc: "livePoll" },
      PRESENCE_DOC: { collection: "app",   doc: "presence" },

      OPEN_COLLECTION: "openAnswers",
      WORDCLOUD_COLLECTION: "wordCloudAnswers",
    },

    URLS: {
      QR_TARGET: "https://steinarhval.github.io/Innhenting/innhenting.html",
    },

    LIMITS: {
      // Defaults (kan overstyres per spørsmål)
      OPEN_MAX_CHARS_DEFAULT: 150,

      WORD_MAX_COUNT_DEFAULT: 3,
      WORD_MAX_CHARS_DEFAULT: 20,

      // Hard caps (sikkerhet)
      OPEN_MAX_CHARS_HARD_MIN: 20,
      OPEN_MAX_CHARS_HARD_MAX: 1000,

      WORD_MAX_COUNT_HARD_MIN: 1,
      WORD_MAX_COUNT_HARD_MAX: 10,

      WORD_MAX_CHARS_HARD_MIN: 5,
      WORD_MAX_CHARS_HARD_MAX: 40,
    },

    TEXT: {
      WAITING_DEFAULT: "Vi er straks i gang!",
      VOTE_OK: "Takk, svaret er avgitt!",
      TRY_AGAIN: "Noe gikk galt – prøv igjen",
      WRITE_SOMETHING: "Skriv noe før du sender 🙂",
      WRITE_AT_LEAST_ONE_WORD: "Skriv minst ett ord (og unngå helt vanlige ord) 🙂",
      NO_ANSWERS_YET: "Ingen svar ennå.",
      NO_WORDS_YET: "Ingen ord ennå.",
    },

    STOPWORDS_NO: [
      "og","men","eller","for","som","at","det","den","de","di","du","jeg","vi","dere","i","på","av","til","fra",
      "er","var","blir","ble","har","hadde","ha","kan","kunne","skal","skulle","vil","ville","må","måtte",
      "ikke","ingen","noen","nok","bare","også","så","da","der","her","hvor","hva","hvem","hvordan","når",
      "en","ei","et","ene","ett","dette","disse","denne","sånn","slik","altså","jo","nei","ja"
    ],

    // Editor-konstanter
    EDITOR: {
      MODE_LABELS: {
        multi: "Flervalgsspørsmål",
        likert: "Vurderingsskala",
        open: "Fritekst",
        wordcloud: "Ordsky"
      },

      DEFAULTS: {
        likert: { min: 0, max: 10, minLabel: "Helt uenig", maxLabel: "Helt enig", spread: false },
        open: { maxChars: 150 },
        wordcloud: { maxWords: 3, maxCharsPerWord: 20 }
      },

      // CSS-var-navnene som theme.css eier (edit.html bare “leser”)
      PRESET_VARS: {
        traffic: ["--preset-traffic-1","--preset-traffic-2","--preset-traffic-4","--preset-traffic-3"],
        nordic:  ["--preset-nordic-1","--preset-nordic-2","--preset-nordic-3","--preset-nordic-4","--preset-nordic-5"],
        pink:    ["--preset-pink-1","--preset-pink-2","--preset-pink-3","--preset-pink-4","--preset-pink-5"],
        gray:    ["--preset-gray-1","--preset-gray-2","--preset-gray-3","--preset-gray-4","--preset-gray-5"],
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Firebase helpers
  // ---------------------------------------------------------------------------
  function initFirebaseOnce() {
    if (!window.firebase) throw new Error("Firebase SDK er ikke lastet.");
    if (!firebase.apps.length) firebase.initializeApp({
      apiKey: CONFIG.FIREBASE.apiKey,
      authDomain: CONFIG.FIREBASE.authDomain,
      projectId: CONFIG.FIREBASE.projectId
    });
    return firebase.firestore();
  }

  function getRefs(db) {
    const stateRef = db.collection(CONFIG.FIRESTORE.STATE_DOC.collection).doc(CONFIG.FIRESTORE.STATE_DOC.doc);
    const pollRef  = db.collection(CONFIG.FIRESTORE.POLL_DOC.collection).doc(CONFIG.FIRESTORE.POLL_DOC.doc);
    const presenceRef = db.collection(CONFIG.FIRESTORE.PRESENCE_DOC.collection).doc(CONFIG.FIRESTORE.PRESENCE_DOC.doc);
    return { stateRef, pollRef, presenceRef };
  }

  function startPresenterHeartbeat(presenceRef) {
    if (!presenceRef) return { stop: () => {} };

    const ping = () => presenceRef.set({
      alive: true,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    ping();
    const timer = setInterval(ping, CONFIG.PRESENCE.HEARTBEAT_MS);

    window.addEventListener("beforeunload", () => {
      try { clearInterval(timer); } catch (_) {}
      try {
        presenceRef.set({
          alive: false,
          ts: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (_) {}
    });

    return { stop: () => clearInterval(timer) };
  }

  // ---------------------------------------------------------------------------
  // Datakontrakt: normalize/migrate (bakoverkompatibelt)
  // ---------------------------------------------------------------------------
  function clampInt(n, min, max, fallback) {
    const v = Number.parseInt(n, 10);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(min, Math.min(max, v));
  }

  function toSafeKey(s, fallback) {
    const raw = (s ?? "").toString().trim().toLowerCase();
    const cleaned = raw.replace(/[^a-z0-9_\-]/g, "");
    return cleaned || fallback || ("k" + Math.random().toString(16).slice(2));
  }

  function normalizeOption(o, idx) {
    const oo = o || {};
    return {
      id: toSafeKey(oo.id, "o" + idx),
      label: (oo.label ?? ("Valg " + (idx + 1))).toString().slice(0, 60),
      color: (oo.color ?? null)
    };
  }

  function normalizeQuestion(q, idx) {
    const qq = q || {};
    const id = (qq.id || qq.qid || ("q" + Date.now() + "_" + Math.random().toString(16).slice(2))).toString();
    const order = Number.isFinite(qq.order) ? qq.order : (idx + 1);

    let mode = (qq.mode || qq.type || "multi").toString();
    if (!["multi","likert","open","wordcloud"].includes(mode)) mode = "multi";

    // options (kun multi)
    let options = Array.isArray(qq.options) ? qq.options : null;
    if (mode === "multi") {
      if (!options || options.length < 2) {
        options = [
          { id:"a", label:"A", color:null },
          { id:"b", label:"B", color:null },
          { id:"c", label:"C", color:null }
        ];
      }
      options = options.map(normalizeOption);
      if (options.length < 2) options = [normalizeOption({id:"a",label:"A"},0), normalizeOption({id:"b",label:"B"},1)];
      if (options.length > 8) options = options.slice(0, 8);
    }

    // Likert
    const dLik = CONFIG.EDITOR.DEFAULTS.likert;
    const likertMin = clampInt(qq.likertMin, -1000, 1000, dLik.min);
    let likertMax = clampInt(qq.likertMax, -1000, 1000, dLik.max);
    if (likertMax <= likertMin) likertMax = likertMin + 1;
    const likert = {
      min: likertMin,
      max: likertMax,
      minLabel: (qq.likertMinLabel ?? dLik.minLabel).toString().slice(0, 60),
      maxLabel: (qq.likertMaxLabel ?? dLik.maxLabel).toString().slice(0, 60),
      spread: (qq.likertSpread === true)
    };

    // Open
    const dOpen = CONFIG.EDITOR.DEFAULTS.open;
    const open = {
      maxChars: clampInt(
        qq.openMaxChars,
        CONFIG.LIMITS.OPEN_MAX_CHARS_HARD_MIN,
        CONFIG.LIMITS.OPEN_MAX_CHARS_HARD_MAX,
        dOpen.maxChars
      )
    };

    // Wordcloud
    const dWc = CONFIG.EDITOR.DEFAULTS.wordcloud;
    const wc = {
      maxWords: clampInt(
        qq.wordcloudMaxWords,
        CONFIG.LIMITS.WORD_MAX_COUNT_HARD_MIN,
        CONFIG.LIMITS.WORD_MAX_COUNT_HARD_MAX,
        dWc.maxWords
      ),
      maxCharsPerWord: clampInt(
        qq.wordcloudMaxCharsPerWord,
        CONFIG.LIMITS.WORD_MAX_CHARS_HARD_MIN,
        CONFIG.LIMITS.WORD_MAX_CHARS_HARD_MAX,
        dWc.maxCharsPerWord
      )
    };

    return {
      id,
      order,
      title: (qq.title || ("Spørsmål " + order)).toString().slice(0, 80),
      mode,

      // multi
      options,

      // likert
      likertMin: likert.min,
      likertMax: likert.max,
      likertMinLabel: likert.minLabel,
      likertMaxLabel: likert.maxLabel,
      likertSpread: likert.spread,

      // open
      openMaxChars: open.maxChars,

      // wordcloud
      wordcloudMaxWords: wc.maxWords,
      wordcloudMaxCharsPerWord: wc.maxCharsPerWord
    };
  }

  function normalizeQuestions(qs) {
    const arr = Array.isArray(qs) ? qs : [];
    const out = arr.map(normalizeQuestion);
    out.sort((a,b) => (a.order || 0) - (b.order || 0));
    out.forEach((q, i) => q.order = i + 1);
    return out;
  }

  function questionToStatePayload(q) {
    const qq = normalizeQuestion(q || {}, 0);
    return {
      id: qq.id,
      title: qq.title,
      mode: qq.mode,

      // multi
      options: qq.options || null,

      // likert
      likert: {
        min: qq.likertMin,
        max: qq.likertMax,
        minLabel: qq.likertMinLabel,
        maxLabel: qq.likertMaxLabel,
        spread: qq.likertSpread === true
      },

      // open
      open: { maxChars: qq.openMaxChars },

      // wordcloud
      wordcloud: { maxWords: qq.wordcloudMaxWords, maxCharsPerWord: qq.wordcloudMaxCharsPerWord }
    };
  }

  function multiPresetForMode(mode) {
    // brukes når man kjører "enkeltmodus" uten opplegg
    if (mode === CONFIG.MODES.SBS) {
      return {
        mode: "multi",
        title: "Sunn – bekymringsfull – skadelig",
        options: [
          { id:"a", label:"Sunn",            color:"var(--sbs-green)" },
          { id:"b", label:"Bekymringsfull",  color:"var(--sbs-yellow)" },
          { id:"c", label:"Skadelig",        color:"var(--sbs-red)" }
        ]
      };
    }
    if (mode === CONFIG.MODES.BNR) {
      return {
        mode: "multi",
        title: "Beskyttende – nøytral – risiko",
        options: [
          { id:"a", label:"Beskyttende", color:"var(--sbs-green)" },
          { id:"b", label:"Nøytral",     color:"var(--sbs-yellow)" },
          { id:"c", label:"Risiko",      color:"var(--sbs-red)" }
        ]
      };
    }
    if (mode === CONFIG.MODES.ABC) {
      return {
        mode: "multi",
        title: "A – B – C",
        options: [
          { id:"a", label:"A", color:"var(--sbs-green)" },
          { id:"b", label:"B", color:"var(--sbs-yellow)" },
          { id:"c", label:"C", color:"var(--sbs-red)" }
        ]
      };
    }
    if (mode === CONFIG.MODES.YESNO) {
      return {
        mode: "multi",
        title: "Ja / nei",
        options: [
          { id:"a", label:"Ja",  color:"var(--sbs-green)" },
          { id:"b", label:"Nei", color:"var(--sbs-red)" }
        ]
      };
    }
    return null;
  }

  // Legacy convenience: noen sider forventer disse
  CONFIG.LIMITS.OPEN_MAX_CHARS = CONFIG.LIMITS.OPEN_MAX_CHARS_DEFAULT;
  CONFIG.LIMITS.WORD_MAX_COUNT = CONFIG.LIMITS.WORD_MAX_COUNT_DEFAULT;
  CONFIG.LIMITS.WORD_MAX_CHARS = CONFIG.LIMITS.WORD_MAX_CHARS_DEFAULT;

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------
  window.CONFIG = CONFIG;
  window.FirebaseUtil = { initFirebaseOnce, getRefs, startPresenterHeartbeat };

  // Nytt: felles "datakontrakt" for alle sider
  window.ProgramUtil = {
    normalizeQuestions,
    normalizeQuestion,
    questionToStatePayload,
    multiPresetForMode,
    toSafeKey
  };
})();
