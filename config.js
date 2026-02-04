/* config.js
   Samler konstanter + små helpers på ett sted.
   Brukes av alle sider.
*/
(function () {
  const CONFIG = {
    // Firebase-prosjekt
    FIREBASE: {
      apiKey: "AIzaSyBtjn54Bz0Mjeh43hanythhbAhPBna7-Eg",
      authDomain: "profesor-7e112.firebaseapp.com",
      projectId: "profesor-7e112",
    },

    // Modus-navn (samles for å unngå skrivefeil)
    MODES: {
      SBS: "sbs",
      BNR: "bnr",
      ABC: "abc",
      YESNO: "yesno",
      LIKERT: "likert",
      OPEN: "open",
      WORDCLOUD: "wordcloud",
    },

    // Firestore-stier
    FIRESTORE: {
      STATE_DOC: { collection: "app", doc: "state" },
      POLL_DOC: { collection: "polls", doc: "livePoll" },

      OPEN_COLLECTION: "openAnswers",
      WORDCLOUD_COLLECTION: "wordCloudAnswers",
    },

    // URL-er (QR-lenke)
    URLS: {
      QR_TARGET: "https://steinarhval.github.io/Innhenting/Innhenting.html",
    },

    LIMITS: {
      OPEN_MAX_CHARS: 200,
      WORD_MAX_CHARS: 20,
      WORD_MAX_COUNT: 3,
    },

    HOTKEYS: {
      MENU: {
        MODES_BY_DIGIT: {
          "1": "sbs",
          "2": "bnr",
          "3": "abc",
          "4": "yesno",
          "5": "likert",
          "6": "open",
          "7": "wordcloud",
        },
        STANDBY_KEYS: ["0", "escape"],
      },
      RESULTS: {
        TOGGLE_RESULTS_KEYS: ["v", " "], // v eller Space
        RESET_KEY: "n",
        MENU_KEY: "h",
      },
    },

    WORDCLOUD: {
      RESIZE_DEBOUNCE_MS: 120,
      ROTATE_PROBABILITY: 0.15,
      FONT_MIN: 18,
      FONT_MAX: 86,
      FONT_IF_SINGLE_VALUE: 56,
      FONT: "system-ui",
      FONT_WEIGHT: 800,
      FILL: "var(--c-brand)", // bruker theme.css
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
  };

  function initFirebaseOnce() {
    if (!window.firebase) throw new Error("Firebase SDK er ikke lastet.");
    if (!firebase.apps.length) firebase.initializeApp(CONFIG.FIREBASE);
    return firebase.firestore();
  }

  function getRefs(db) {
    const stateRef = db.collection(CONFIG.FIRESTORE.STATE_DOC.collection).doc(CONFIG.FIRESTORE.STATE_DOC.doc);
    const pollRef  = db.collection(CONFIG.FIRESTORE.POLL_DOC.collection).doc(CONFIG.FIRESTORE.POLL_DOC.doc);
    return { stateRef, pollRef };
  }

  window.CONFIG = CONFIG;
  window.FirebaseUtil = { initFirebaseOnce, getRefs };
})();
