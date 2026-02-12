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

    MODES: {
      SBS: "sbs",
      BNR: "bnr",
      ABC: "abc",
      LIKERT: "likert",
      OPEN: "open",
      WORDCLOUD: "wordcloud",
      MULTI: "multi"
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

    // ✅ NYTT: editor-konstanter samlet her
    EDITOR: {
      MODE_LABELS: {
        multi: "Flervalgsspørsmål",
        likert: "Vurderingsskala",
        open: "Fritekst",
        wordcloud: "Ordsky"
      },

      DEFAULTS: {
        likert: { min: 0, max: 10, minLabel: "Helt uenig", maxLabel: "Helt enig" },
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

  window.CONFIG = CONFIG;
  window.FirebaseUtil = { initFirebaseOnce, getRefs, startPresenterHeartbeat };
})();
