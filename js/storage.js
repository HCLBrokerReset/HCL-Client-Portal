/* =============================================================================
   storage.js — profiles, progress, streaks & spaced repetition (localStorage)
   Everything is stored on the device. No accounts, no servers, no tracking.
   ========================================================================== */

const Store = (() => {
  const KEY = "holaHerron.v1";

  const DEFAULTS = () => ({
    activeProfile: null,
    profiles: {
      barry: newProfile("Barry"),
      sarah: newProfile("Sarah"),
    },
  });

  function newProfile(name) {
    return {
      name,
      streak: 0,
      lastStudied: null, // ISO date string (yyyy-mm-dd)
      totalSpoken: 0, // items practised all time
      lessonsDone: {}, // lessonId -> true once completed once
      // Spaced repetition: itemKey -> { ease, due (yyyy-mm-dd), reps, lapses }
      srs: {},
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULTS();
      const parsed = JSON.parse(raw);
      // Defensive merge so older saves keep working.
      const base = DEFAULTS();
      base.activeProfile = parsed.activeProfile ?? null;
      for (const id of Object.keys(base.profiles)) {
        base.profiles[id] = Object.assign(base.profiles[id], parsed.profiles?.[id] || {});
      }
      return base;
    } catch (e) {
      console.warn("Could not load progress, starting fresh.", e);
      return DEFAULTS();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save progress.", e);
    }
  }

  // ---- dates -------------------------------------------------------------
  const todayStr = () => new Date().toISOString().slice(0, 10);
  function addDays(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    return Math.round(
      (new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000
    );
  }

  // ---- profiles ----------------------------------------------------------
  function profileIds() {
    return Object.keys(state.profiles);
  }
  function getProfile(id = state.activeProfile) {
    return state.profiles[id];
  }
  function setActive(id) {
    state.activeProfile = id;
    save();
  }
  function active() {
    return state.activeProfile;
  }

  // ---- streak ------------------------------------------------------------
  // Call once when a session is finished, to update the daily streak.
  function touchStreak(id = state.activeProfile) {
    const p = state.profiles[id];
    const today = todayStr();
    if (p.lastStudied === today) {
      /* already counted today */
    } else if (p.lastStudied && daysBetween(p.lastStudied, today) === 1) {
      p.streak += 1;
    } else {
      p.streak = 1; // first day, or streak broken
    }
    p.lastStudied = today;
    save();
    return p.streak;
  }

  // ---- spaced repetition (simplified SM-2) -------------------------------
  // grade: true = got it (said it well), false = struggled
  function recordResult(itemKey, grade, id = state.activeProfile) {
    const p = state.profiles[id];
    const today = todayStr();
    let s = p.srs[itemKey] || { ease: 2.3, due: today, reps: 0, lapses: 0 };
    if (grade) {
      s.reps += 1;
      // intervals grow: 1, 3, then *ease
      let interval;
      if (s.reps === 1) interval = 1;
      else if (s.reps === 2) interval = 3;
      else interval = Math.round((s.reps - 1) * s.ease);
      s.ease = Math.min(2.8, s.ease + 0.08);
      s.due = addDays(today, interval);
    } else {
      s.reps = 0;
      s.lapses += 1;
      s.ease = Math.max(1.6, s.ease - 0.2);
      s.due = addDays(today, 1); // see it again tomorrow
    }
    p.srs[itemKey] = s;
    p.totalSpoken += 1;
    save();
  }

  // Items due for review today, as array of itemKeys.
  function dueItems(id = state.activeProfile) {
    const p = state.profiles[id];
    const today = todayStr();
    return Object.keys(p.srs).filter((k) => p.srs[k].due <= today);
  }

  function markLessonDone(lessonId, id = state.activeProfile) {
    state.profiles[id].lessonsDone[lessonId] = true;
    save();
  }
  function isLessonDone(lessonId, id = state.activeProfile) {
    return !!state.profiles[id].lessonsDone[lessonId];
  }

  // How many distinct items this profile has ever started learning.
  function learnedCount(id = state.activeProfile) {
    return Object.keys(state.profiles[id].srs).length;
  }

  function resetProfile(id) {
    const name = state.profiles[id].name;
    state.profiles[id] = newProfile(name);
    save();
  }

  return {
    todayStr,
    profileIds,
    getProfile,
    setActive,
    active,
    touchStreak,
    recordResult,
    dueItems,
    markLessonDone,
    isLessonDone,
    learnedCount,
    resetProfile,
  };
})();

if (typeof window !== "undefined") window.Store = Store;
