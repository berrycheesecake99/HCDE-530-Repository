const App = (() => {
  const SESSION_KEY = "safewalk_session";

  function init() {
    if (getSession()) {
      showApp();
    }
    bindLogin();
    bindTabs();
    bindSignout();
    bindEmergency();
  }

  /* ── Auth ──────────────────────────────────────────────────── */

  function bindLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const netid = document.getElementById("netid-input").value.trim();
      if (!netid) return;
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("login-loading").classList.remove("hidden");
      setTimeout(() => {
        saveSession(netid);
        document.getElementById("login-loading").classList.add("hidden");
        showApp();
      }, 1500);
    });
  }

  function saveSession(netid) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ netid }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function showApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("login-loading").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");

    const session = getSession();
    if (session) {
      const initial = session.netid.charAt(0).toUpperCase();
      document.getElementById("profile-avatar").textContent = initial;
      document.getElementById("profile-netid").textContent = session.netid + "@uw.edu";
    }

    if (typeof MapModule !== "undefined" && MapModule.init) {
      MapModule.init();
    }

    if (typeof Buddies !== "undefined") {
      Buddies.render();
    }

    renderProfileGroups();
  }

  /* ── Tabs ──────────────────────────────────────────────────── */

  function bindTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const panel = document.getElementById("tab-" + btn.dataset.tab);
        if (panel) panel.classList.add("active");

        if (btn.dataset.tab === "profile") renderProfileGroups();
      });
    });
  }

  /* ── Sign out ─────────────────────────────────────────────── */

  function bindSignout() {
    document.getElementById("btn-signout").addEventListener("click", () => {
      clearSession();
      document.getElementById("app-shell").classList.add("hidden");
      document.getElementById("login-screen").classList.remove("hidden");
      document.getElementById("netid-input").value = "";
      document.getElementById("password-input").value = "";
    });
  }

  /* ── Emergency panel ──────────────────────────────────────── */

  function bindEmergency() {
    document.getElementById("btn-emergency").addEventListener("click", () => {
      document.getElementById("emergency-panel").classList.toggle("hidden");
    });
    document.getElementById("close-emergency").addEventListener("click", () => {
      document.getElementById("emergency-panel").classList.add("hidden");
    });
  }

  /* ── Profile groups ───────────────────────────────────────── */

  function renderProfileGroups() {
    const container = document.getElementById("profile-groups");
    if (!container) return;
    const joined = typeof Buddies !== "undefined" ? Buddies.getJoined() : [];
    if (joined.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0">No groups joined yet</p>';
      return;
    }
    container.innerHTML = joined
      .map((name) => `<div class="profile-group-item">${name}</div>`)
      .join("");
  }

  /* ── Toast ────────────────────────────────────────────────── */

  function toast(message, duration = 2500) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.remove("hidden");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add("hidden"), duration);
  }

  return { init, toast, getSession, renderProfileGroups };
})();
