/* =============================================================================
   app.js — UI, navigation and the teach → copy → speak lesson player
   ========================================================================== */

(() => {
  const app = document.getElementById("app");

  // -------------------------------------------------- curriculum helpers ----
  // Flatten every item once, with a stable key + back-references.
  const ALL_ITEMS = [];
  const ITEM_BY_KEY = {};
  for (const level of LEVELS) {
    for (const lesson of level.lessons) {
      lesson.items.forEach((item, i) => {
        const key = lesson.id + "#" + i;
        const rec = {
          key,
          ...item,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          levelTitle: level.title,
        };
        ALL_ITEMS.push(rec);
        ITEM_BY_KEY[key] = rec;
      });
    }
  }
  const lessonById = (id) => {
    for (const lv of LEVELS) for (const ls of lv.lessons) if (ls.id === id) return ls;
    return null;
  };
  const itemsForLesson = (id) => ALL_ITEMS.filter((it) => it.lessonId === id);
  const firstUndoneLesson = () => {
    for (const lv of LEVELS) for (const ls of lv.lessons)
      if (!Store.isLessonDone(ls.id)) return ls;
    return null;
  };

  // ---------------------------------------------------------------- utils ---
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const esc = (s) =>
    (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function setView(node) {
    app.innerHTML = "";
    app.appendChild(node);
    app.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ============================================================ VIEWS ======

  // ----- 1. Who's practising? ----------------------------------------------
  function viewProfileSelect() {
    Speech.stop();
    const ids = Store.profileIds();
    const cards = ids
      .map((id) => {
        const p = Store.getProfile(id);
        const initial = p.name[0].toUpperCase();
        return `
          <button class="profile-card" data-id="${id}">
            <span class="avatar">${initial}</span>
            <span class="profile-name">${esc(p.name)}</span>
            <span class="profile-sub">${p.streak > 0 ? "🔥 " + p.streak + " day streak" : "Tap to start"}</span>
          </button>`;
      })
      .join("");

    const node = el(`
      <section class="view view-profiles">
        <header class="hero">
          <h1>¡Hola!</h1>
          <p class="tagline">Spanish for Barry &amp; Sarah</p>
        </header>
        <h2 class="muted center">Who's practising?</h2>
        <div class="profile-grid">${cards}</div>
        <p class="footnote">Practise together on the couch — pick a name to track your own streak.</p>
      </section>
    `);
    node.querySelectorAll(".profile-card").forEach((b) =>
      b.addEventListener("click", () => {
        Store.setActive(b.dataset.id);
        viewDashboard();
      })
    );
    setView(node);
  }

  // ----- 2. Dashboard -------------------------------------------------------
  function viewDashboard() {
    Speech.stop();
    const p = Store.getProfile();
    const due = Store.dueItems().length;
    const learned = Store.learnedCount();
    const next = firstUndoneLesson();

    const levelsHtml = LEVELS.map((lv) => {
      const rows = lv.lessons
        .map((ls) => {
          const done = Store.isLessonDone(ls.id);
          const lessonKeys = itemsForLesson(ls.id).map((i) => i.key);
          const dueHere = Store.dueItems().filter((k) => lessonKeys.includes(k)).length;
          return `
            <button class="lesson-row" data-lesson="${ls.id}">
              <span class="tick ${done ? "on" : ""}">${done ? "✓" : ""}</span>
              <span class="lesson-text">
                <span class="lesson-title">${esc(ls.title)}</span>
                <span class="lesson-goal">${esc(ls.goal)}</span>
              </span>
              ${dueHere ? `<span class="badge">${dueHere}</span>` : `<span class="chev">›</span>`}
            </button>`;
        })
        .join("");
      return `
        <details class="level" ${lv.id === (next ? next._levelId : "A") ? "open" : ""}>
          <summary>
            <span class="level-code">${lv.code}</span>
            <span class="level-meta">
              <span class="level-title">${esc(lv.title)}</span>
              <span class="level-blurb">${esc(lv.blurb)}</span>
            </span>
          </summary>
          <div class="lesson-list">${rows}</div>
        </details>`;
    }).join("");

    const node = el(`
      <section class="view view-dashboard">
        <header class="topbar">
          <button class="link back" id="switch">Switch user</button>
          <span class="who">${esc(p.name)}</span>
        </header>

        <div class="stats">
          <div class="stat"><span class="stat-num">🔥 ${p.streak}</span><span class="stat-lbl">day streak</span></div>
          <div class="stat"><span class="stat-num">${learned}</span><span class="stat-lbl">phrases learned</span></div>
          <div class="stat"><span class="stat-num">${due}</span><span class="stat-lbl">due to review</span></div>
        </div>

        <button class="cta" id="tonight">
          <span class="cta-title">▶︎ Tonight's session</span>
          <span class="cta-sub">${due ? due + " reviews + " : ""}${next ? "new: " + esc(next.title) : "all lessons complete — keep reviewing!"}</span>
          <span class="cta-time">about 20–30 min</span>
        </button>

        ${due ? `<button class="cta secondary" id="reviewonly"><span class="cta-title">↻ Review only (${due})</span><span class="cta-sub">Practise the phrases due today</span></button>` : ""}

        <h2 class="section-h">Course</h2>
        <div class="levels">${levelsHtml}</div>

        <p class="footnote">Your progress is saved on this phone. <button class="link tiny" id="reset">Reset ${esc(p.name)}'s progress</button></p>
      </section>
    `);

    node.querySelector("#switch").addEventListener("click", viewProfileSelect);
    node.querySelector("#tonight").addEventListener("click", () => startTonight());
    const rev = node.querySelector("#reviewonly");
    if (rev) rev.addEventListener("click", () => startReview());
    node.querySelectorAll(".lesson-row").forEach((b) =>
      b.addEventListener("click", () => startLesson(b.dataset.lesson))
    );
    node.querySelector("#reset").addEventListener("click", () => {
      if (confirm("Reset " + p.name + "'s streak and progress? This can't be undone.")) {
        Store.resetProfile(Store.active());
        viewDashboard();
      }
    });
    setView(node);
  }

  // ----- Session builders ---------------------------------------------------
  function startLesson(lessonId) {
    const ls = lessonById(lessonId);
    runSession({
      title: ls.title,
      items: itemsForLesson(lessonId),
      lesson: ls,
      lessonIds: [lessonId],
    });
  }

  function startReview() {
    const items = Store.dueItems().map((k) => ITEM_BY_KEY[k]).filter(Boolean);
    if (!items.length) return viewDashboard();
    shuffle(items);
    runSession({ title: "Review", items: items.slice(0, 25), lessonIds: [] });
  }

  function startTonight() {
    // Reviews first (capped), then the next new lesson.
    const reviews = Store.dueItems().map((k) => ITEM_BY_KEY[k]).filter(Boolean);
    shuffle(reviews);
    const picked = reviews.slice(0, 12);
    const next = firstUndoneLesson();
    let lessonIds = [];
    let lesson = null;
    if (next) {
      picked.push(...itemsForLesson(next.id));
      lessonIds = [next.id];
      lesson = next;
    }
    if (!picked.length) return viewDashboard();
    runSession({ title: "Tonight's session", items: picked, lesson, lessonIds });
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ----- 3. Lesson player (teach → copy → speak) ----------------------------
  function runSession(session) {
    let idx = 0;
    let correct = 0;
    const total = session.items.length;
    let introShown = false;

    function showIntro() {
      const ls = session.lesson;
      const grammar = ls && ls.grammar;
      const tip = ls && ls.tip;
      if (!grammar && !tip) {
        introShown = true;
        return renderItem();
      }
      const node = el(`
        <section class="view view-lesson">
          ${topbar(session.title, 0, total)}
          <div class="card intro-card">
            <h2>${esc(ls.title)}</h2>
            <p class="goal">${esc(ls.goal)}</p>
            ${tip ? `<div class="tip">💡 ${tip}</div>` : ""}
            ${grammar ? `<div class="grammar"><h3>Quick grammar</h3><p>${grammar}</p></div>` : ""}
            <button class="btn primary big" id="go">Let's begin →</button>
          </div>
        </section>`);
      wireQuit(node);
      node.querySelector("#go").addEventListener("click", () => {
        introShown = true;
        renderItem();
      });
      setView(node);
    }

    function topbar(title, done, tot) {
      const pct = tot ? Math.round((done / tot) * 100) : 0;
      return `
        <header class="topbar lesson-top">
          <button class="link back" data-quit>✕</button>
          <span class="who">${esc(title)}</span>
          <span class="count">${Math.min(done + 1, tot)}/${tot}</span>
        </header>
        <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>`;
    }

    function wireQuit(node) {
      node.querySelectorAll("[data-quit]").forEach((b) =>
        b.addEventListener("click", () => {
          Speech.stop();
          if (confirm("End this session? Your progress so far is saved.")) viewDashboard();
        })
      );
    }

    function renderItem() {
      if (idx >= total) return finish();
      const item = session.items[idx];
      renderTeach(item);
    }

    // --- phase: TEACH ---
    function renderTeach(item) {
      const node = el(`
        <section class="view view-lesson">
          ${topbar(session.title, idx, total)}
          <div class="phase-tag">1 · Learn it</div>
          <div class="card flashcard">
            <p class="es">${esc(item.es)}</p>
            <p class="hint">${esc(item.hint || "")}</p>
            <p class="en">${esc(item.en)}</p>
            ${item.note ? `<p class="note">ℹ︎ ${esc(item.note)}</p>` : ""}
            <div class="audio-row">
              <button class="btn audio" id="play">🔊 Listen</button>
              <button class="btn audio ghost" id="slow">🐢 Slowly</button>
            </div>
          </div>
          <button class="btn primary big" id="next">Now copy it →</button>
        </section>`);
      wireQuit(node);
      const play = () => Speech.speak(item.es, { rate: 0.95 });
      node.querySelector("#play").addEventListener("click", play);
      node.querySelector("#slow").addEventListener("click", () => Speech.speak(item.es, { rate: 0.65 }));
      node.querySelector("#next").addEventListener("click", () => renderCopy(item));
      setView(node);
      setTimeout(play, 350); // auto-play once on arrival
    }

    // --- phase: COPY ---
    function renderCopy(item) {
      const node = el(`
        <section class="view view-lesson">
          ${topbar(session.title, idx, total)}
          <div class="phase-tag">2 · Copy out loud</div>
          <div class="card flashcard">
            <p class="instruct">Listen, then say it out loud together.</p>
            <p class="es">${esc(item.es)}</p>
            <p class="hint">${esc(item.hint || "")}</p>
            <div class="audio-row">
              <button class="btn audio" id="play">🔊 Again</button>
              <button class="btn audio ghost" id="slow">🐢 Slowly</button>
            </div>
          </div>
          <button class="btn primary big" id="next">I've copied it →</button>
        </section>`);
      wireQuit(node);
      node.querySelector("#play").addEventListener("click", () => Speech.speak(item.es, { rate: 0.95 }));
      node.querySelector("#slow").addEventListener("click", () => Speech.speak(item.es, { rate: 0.65 }));
      node.querySelector("#next").addEventListener("click", () => renderSpeak(item));
      setView(node);
      setTimeout(() => Speech.speak(item.es, { rate: 0.85 }), 350);
    }

    // --- phase: SPEAK (mic scoring + self-check fallback) ---
    function renderSpeak(item) {
      const micAvailable = Speech.canListen();
      const node = el(`
        <section class="view view-lesson">
          ${topbar(session.title, idx, total)}
          <div class="phase-tag">3 · Your turn</div>
          <div class="card flashcard">
            <p class="instruct">Say it in Spanish:</p>
            <p class="en big-en">${esc(item.en)}</p>
            <button class="btn audio ghost small" id="peek">👂 Hear it again</button>
            <div id="speak-area">
              ${micAvailable
                ? `<button class="btn mic" id="mic">🎤 Tap &amp; speak</button>
                   <p class="mic-hint">or <button class="link" id="selfok">I said it right ✓</button></p>`
                : `<p class="mic-hint">Mic scoring isn't available on this browser — say it aloud, then:</p>
                   <div class="self-row">
                     <button class="btn good" id="selfok">I got it ✓</button>
                     <button class="btn again" id="selfno">Needs work</button>
                   </div>`}
            </div>
            <div id="feedback" class="feedback"></div>
          </div>
          <button class="btn primary big hidden" id="next">Next →</button>
        </section>`);
      wireQuit(node);
      const fb = node.querySelector("#feedback");
      const nextBtn = node.querySelector("#next");
      const speakArea = node.querySelector("#speak-area");

      node.querySelector("#peek").addEventListener("click", () => Speech.speak(item.es, { rate: 0.9 }));

      const advance = (grade) => {
        Store.recordResult(item.key, grade);
        if (grade) correct++;
        nextBtn.classList.remove("hidden");
        nextBtn.onclick = () => {
          idx++;
          renderItem();
        };
      };

      const selfok = node.querySelector("#selfok");
      if (selfok) selfok.addEventListener("click", () => {
        fb.innerHTML = `<span class="ok">¡Bien! ✓</span>`;
        speakArea.classList.add("dim");
        advance(true);
      });
      const selfno = node.querySelector("#selfno");
      if (selfno) selfno.addEventListener("click", () => {
        fb.innerHTML = `<span class="retry">We'll bring this one back soon.</span>`;
        speakArea.classList.add("dim");
        advance(false);
      });

      const mic = node.querySelector("#mic");
      if (mic) {
        mic.addEventListener("click", async () => {
          fb.innerHTML = "";
          mic.classList.add("listening");
          mic.textContent = "● Listening…";
          const res = await Speech.listenOnce({ onStart: () => {} });
          mic.classList.remove("listening");
          mic.textContent = "🎤 Try again";

          if (!res || res.error || !res.best) {
            fb.innerHTML = `<span class="retry">Didn't catch that — check the mic permission and try again, or
              <button class="link" id="fallback">mark it correct ✓</button></span>`;
            fb.querySelector("#fallback").addEventListener("click", () => {
              fb.innerHTML = `<span class="ok">¡Bien! ✓</span>`;
              advance(true);
            });
            return;
          }

          const score = Speech.scoreMatch(item.es, res.alternatives || [res.best]);
          if (score >= 0.7) {
            fb.innerHTML = `<span class="ok">¡Muy bien! ✓</span><span class="heard">I heard: “${esc(res.best)}”</span>`;
            speakArea.classList.add("dim");
            advance(true);
          } else if (score >= 0.45) {
            fb.innerHTML = `<span class="close">Close! Listen again and have another go.</span>
              <span class="heard">I heard: “${esc(res.best)}”</span>
              <button class="link" id="acc">Sounds right to me ✓</button>`;
            Speech.speak(item.es, { rate: 0.7 });
            fb.querySelector("#acc").addEventListener("click", () => { fb.innerHTML = `<span class="ok">¡Bien! ✓</span>`; advance(true); });
          } else {
            fb.innerHTML = `<span class="retry">Not quite — listen and try again.</span>
              <span class="heard">I heard: “${esc(res.best)}”</span>
              <button class="link" id="acc">Sounds right to me ✓</button>`;
            Speech.speak(item.es, { rate: 0.7 });
            fb.querySelector("#acc").addEventListener("click", () => { fb.innerHTML = `<span class="ok">¡Bien! ✓</span>`; advance(true); });
          }
        });
      }
      setView(node);
    }

    // --- finish ---
    function finish() {
      session.lessonIds.forEach((id) => Store.markLessonDone(id));
      const streak = Store.touchStreak();
      const pct = total ? Math.round((correct / total) * 100) : 0;
      let msg = "¡Buen trabajo!";
      if (pct >= 90) msg = "¡Excelente! Outstanding.";
      else if (pct >= 70) msg = "¡Muy bien! Great going.";
      else if (pct < 50) msg = "¡Sigue así! Keep at it — repetition is the secret.";

      const node = el(`
        <section class="view view-summary">
          <div class="confetti">🎉</div>
          <h1>${esc(msg)}</h1>
          <div class="summary-stats">
            <div class="stat"><span class="stat-num">${correct}/${total}</span><span class="stat-lbl">said well</span></div>
            <div class="stat"><span class="stat-num">🔥 ${streak}</span><span class="stat-lbl">day streak</span></div>
          </div>
          <p class="summary-note">The phrases you found tricky will come back over the next few days, so they really stick.</p>
          <button class="btn primary big" id="home">Back to home</button>
          <button class="btn ghost" id="again">Practise these again</button>
        </section>`);
      node.querySelector("#home").addEventListener("click", viewDashboard);
      node.querySelector("#again").addEventListener("click", () => {
        idx = 0; correct = 0; introShown = true; renderItem();
      });
      setView(node);
    }

    if (!introShown) showIntro();
    else renderItem();
  }

  // ============================================================ BOOT ========
  // Tag levels onto lessons for the "open the right level" behaviour.
  LEVELS.forEach((lv) => lv.lessons.forEach((ls) => (ls._levelId = lv.id)));

  if (Store.active() && Store.getProfile()) viewDashboard();
  else viewProfileSelect();

  // Expose a tiny hook for debugging in the console if needed.
  window.HolaApp = { viewProfileSelect, viewDashboard, ALL_ITEMS };
})();
