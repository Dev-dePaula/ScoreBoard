(() => {
  const STORAGE_KEY = "placar_pro_v1";

  const defaultState = {
    teamA: { name: "TIME A", score: 0, badge: "A" },
    teamB: { name: "TIME B", score: 0, badge: "B" },
    period: "1º",
    timerSeconds: 0,
    running: false,
    swapped: false
  };

  let state = loadState();
  let intervalId = null;

  // Views / routes
  const viewBoard = document.getElementById("view-board");
  const viewAdmin = document.getElementById("view-admin");

  const btnBoard = document.getElementById("btnBoard");
  const btnAdmin = document.getElementById("btnAdmin");
  const btnFullscreen = document.getElementById("btnFullscreen");

  // Board elements
  const nameA = document.getElementById("nameA");
  const nameB = document.getElementById("nameB");
  const scoreA = document.getElementById("scoreA");
  const scoreB = document.getElementById("scoreB");
  const badgeA = document.getElementById("badgeA");
  const badgeB = document.getElementById("badgeB");
  const periodValue = document.getElementById("periodValue");
  const timerValue = document.getElementById("timerValue");
  const statusValue = document.getElementById("statusValue");

  // Admin elements
  const inputNameA = document.getElementById("inputNameA");
  const inputNameB = document.getElementById("inputNameB");
  const adminLabelA = document.getElementById("adminLabelA");
  const adminLabelB = document.getElementById("adminLabelB");
  const adminScoreA = document.getElementById("adminScoreA");
  const adminScoreB = document.getElementById("adminScoreB");
  const adminTimerValue = document.getElementById("adminTimerValue");

  const btnSwap = document.getElementById("btnSwap");
  const btnResetNames = document.getElementById("btnResetNames");
  const btnResetScore = document.getElementById("btnResetScore");
  const btnResetAll = document.getElementById("btnResetAll");

  const inputMinutes = document.getElementById("inputMinutes");
  const inputSeconds = document.getElementById("inputSeconds");
  const btnSetTime = document.getElementById("btnSetTime");

  const btnStartPause = document.getElementById("btnStartPause");
  const btnStop = document.getElementById("btnStop");
  const btnZero = document.getElementById("btnZero");
  const btnAddMin = document.getElementById("btnAddMin");
  const btnSubMin = document.getElementById("btnSubMin");

  // Period buttons (in card)
  document.querySelectorAll("[data-period]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.period = btn.dataset.period;
      saveAndRender();
    });
  });

  // Score buttons
  document.querySelectorAll("[data-score][data-delta]").forEach(btn => {
    btn.addEventListener("click", () => {
      const which = btn.dataset.score;
      const delta = parseInt(btn.dataset.delta, 10);
      addScore(which, delta);
    });
  });

  // Names input
  inputNameA.addEventListener("input", () => {
    state.teamA.name = sanitizeName(inputNameA.value);
    saveAndRender();
  });
  inputNameB.addEventListener("input", () => {
    state.teamB.name = sanitizeName(inputNameB.value);
    saveAndRender();
  });

  // Swap
  btnSwap.addEventListener("click", () => {
    state.swapped = !state.swapped;
    saveAndRender();
  });

  // Reset names
  btnResetNames.addEventListener("click", () => {
    state.teamA.name = "TIME A";
    state.teamB.name = "TIME B";
    saveAndRender();
  });

  // Reset score
  btnResetScore.addEventListener("click", () => {
    state.teamA.score = 0;
    state.teamB.score = 0;
    saveAndRender();
  });

  // Reset all
  btnResetAll.addEventListener("click", () => {
    stopTimer();
    state = structuredClone(defaultState);
    saveAndRender();
  });

  // Timer controls
  btnSetTime.addEventListener("click", () => {
    const mm = clampInt(inputMinutes.value, 0, 199);
    const ss = clampInt(inputSeconds.value, 0, 59);
    state.timerSeconds = (mm * 60) + ss;
    saveAndRender();
  });

  btnStartPause.addEventListener("click", () => {
    if (state.running) pauseTimer();
    else startTimer();
  });

  btnStop.addEventListener("click", () => {
    stopTimer();
    saveAndRender();
  });

  btnZero.addEventListener("click", () => {
    state.timerSeconds = 0;
    stopTimer();
    saveAndRender();
  });

  btnAddMin.addEventListener("click", () => {
    state.timerSeconds = Math.max(0, state.timerSeconds + 60);
    saveAndRender();
  });

  btnSubMin.addEventListener("click", () => {
    state.timerSeconds = Math.max(0, state.timerSeconds - 60);
    saveAndRender();
  });

  // Fullscreen
  btnFullscreen.addEventListener("click", toggleFullscreen);

  // Routing
  btnBoard.addEventListener("click", () => setRoute("board"));
  btnAdmin.addEventListener("click", () => setRoute("admin"));

  window.addEventListener("hashchange", syncRouteFromHash);

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if (key === "f") toggleFullscreen();
    if (e.code === "Space") { e.preventDefault(); state.running ? pauseTimer() : startTimer(); }
    if (key === "r") { state.timerSeconds = 0; stopTimer(); saveAndRender(); }
    if (key === "1") addScore("A", 1);
    if (key === "2") addScore("B", 1);
  });

  // Init
  syncRouteFromHash();
  saveAndRender();
  if (state.running) startTimer(true);

  // ===== Functions =====
  function setRoute(route) {
    window.location.hash = route === "admin" ? "#admin" : "#board";
  }

  function syncRouteFromHash() {
    const hash = (window.location.hash || "#board").replace("#", "");
    const isAdmin = hash === "admin";

    viewAdmin.classList.toggle("active", isAdmin);
    viewBoard.classList.toggle("active", !isAdmin);

    btnAdmin.classList.toggle("active", isAdmin);
    btnBoard.classList.toggle("active", !isAdmin);
  }

  function addScore(which, delta) {
    if (which === "A") state.teamA.score = clampInt(state.teamA.score + delta, 0, 99);
    if (which === "B") state.teamB.score = clampInt(state.teamB.score + delta, 0, 99);
    saveAndRender();
  }

  function startTimer(silent) {
    if (state.running) return;
    state.running = true;
    if (!silent) saveState(state);

    clearInterval(intervalId);
    intervalId = setInterval(() => {
      state.timerSeconds = Math.max(0, state.timerSeconds + 1);
      // Se quiser contagem regressiva, troque por: state.timerSeconds = Math.max(0, state.timerSeconds - 1);
      render();
      saveState(state);
    }, 1000);

    render();
    saveState(state);
  }

  function pauseTimer() {
    if (!state.running) return;
    state.running = false;
    clearInterval(intervalId);
    intervalId = null;
    saveAndRender();
  }

  function stopTimer() {
    state.running = false;
    clearInterval(intervalId);
    intervalId = null;
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(()=>{});
    } else {
      document.exitFullscreen?.().catch(()=>{});
    }
  }

  function saveAndRender() {
    saveState(state);
    render();
  }

  function render() {
    // Swap visual only (teams order)
    const a = state.swapped ? state.teamB : state.teamA;
    const b = state.swapped ? state.teamA : state.teamB;

    // Board
    nameA.textContent = a.name.toUpperCase();
    nameB.textContent = b.name.toUpperCase();
    scoreA.textContent = String(a.score);
    scoreB.textContent = String(b.score);
    badgeA.textContent = (state.swapped ? state.teamB.badge : state.teamA.badge).toUpperCase();
    badgeB.textContent = (state.swapped ? state.teamA.badge : state.teamB.badge).toUpperCase();

    periodValue.textContent = state.period;
    timerValue.textContent = formatTime(state.timerSeconds);

    statusValue.textContent = state.running ? "RODANDO" : "PARADO";
    statusValue.style.borderColor = state.running ? "rgba(124,255,107,.35)" : "rgba(255,255,255,.15)";
    statusValue.style.background = state.running ? "rgba(124,255,107,.12)" : "rgba(255,255,255,.06)";

    // Admin mirrors (always show real teams A/B, independent of swap)
    inputNameA.value = state.teamA.name;
    inputNameB.value = state.teamB.name;

    adminLabelA.textContent = state.teamA.name.toUpperCase();
    adminLabelB.textContent = state.teamB.name.toUpperCase();

    adminScoreA.textContent = String(state.teamA.score);
    adminScoreB.textContent = String(state.teamB.score);

    adminTimerValue.textContent = formatTime(state.timerSeconds);

    btnStartPause.textContent = state.running ? "Pausar" : "Iniciar";
  }

  function formatTime(totalSeconds) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  }

  function sanitizeName(v) {
    const t = (v || "").trim();
    return t.length ? t.slice(0, 20) : "";
  }

  function clampInt(v, min, max) {
    const n = parseInt(v, 10);
    const safe = Number.isFinite(n) ? n : 0;
    return Math.max(min, Math.min(max, safe));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);

      // merge defensivo
      const merged = structuredClone(defaultState);
      merged.teamA.name = parsed?.teamA?.name ?? merged.teamA.name;
      merged.teamA.score = clampInt(parsed?.teamA?.score ?? 0, 0, 99);

      merged.teamB.name = parsed?.teamB?.name ?? merged.teamB.name;
      merged.teamB.score = clampInt(parsed?.teamB?.score ?? 0, 0, 99);

      merged.period = parsed?.period ?? merged.period;
      merged.timerSeconds = clampInt(parsed?.timerSeconds ?? 0, 0, 60 * 999);
      merged.running = !!parsed?.running;
      merged.swapped = !!parsed?.swapped;

      return merged;
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
})();
