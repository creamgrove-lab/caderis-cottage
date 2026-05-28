const SUPABASE_URL = "https://gvzqhwnjuxmnoayytytz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Cer_OmdZcW97rJwSXPhs-Q_gXI8woLj";
const SELECTED_BOX_KEY = "caderis_selected_box";
const FIVE_HOURS = 5 * 60 * 60 * 1000;
const MUSIC_VOLUME = 0.22;
const DEV_MODE = new URLSearchParams(location.search).get("dev") === "1";

const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const introCopy = `你最近為想離開一間公司、一段關係，或某件事感到猶豫不前嗎？

很多時候，不是自己做不出選擇，
而是需要一個契機，
或是需要累積一些訊號，
幫你看清楚自己的心。

歡迎來到卡德莉絲小屋。

這裡不會替你做決定。
但會替你記下某些衝動的時候，
讓你停下來，再次思考一次。

好了，現在，你想怎麼做？`;

const boxModes = {
  short: { label: "短期木匣", maxGems: 14 },
  standard: { label: "標準木匣", maxGems: 20 },
  long: { label: "長期木匣", maxGems: 30 },
};

const reasons = [
  { reason: "憤怒", stone: "紅寶石", colorType: "red", color: "#d65468", glow: "rgba(214, 84, 104, 0.56)" },
  { reason: "委屈", stone: "藍寶石", colorType: "blue", color: "#5c9ed0", glow: "rgba(92, 158, 208, 0.55)" },
  { reason: "無力", stone: "灰紫水晶", colorType: "violet", color: "#8d79a8", glow: "rgba(141, 121, 168, 0.5)" },
  { reason: "不解", stone: "霧白月光石", colorType: "moon", color: "#d8d7cf", glow: "rgba(216, 215, 207, 0.5)" },
  { reason: "失望", stone: "黑曜石", colorType: "black", color: "#1c1b22", glow: "rgba(180, 166, 210, 0.34)" },
  { reason: "害怕", stone: "深綠石", colorType: "green", color: "#2f8069", glow: "rgba(47, 128, 105, 0.5)" },
  { reason: "說不清楚", stone: "透明石", colorType: "clear", color: "#e8e1ff", glow: "rgba(232, 225, 255, 0.5)" },
  { reason: "自己填寫", stone: "自訂", colorType: "custom", color: "#d6b56d", glow: "rgba(214, 181, 109, 0.5)" },
];

const oracleNotes = [
  "卡德莉絲的小提醒：這裡不替你做決定。它只替你保存，那些你差點忽略的訊號。",
  "卡德莉絲：先不要急著逃。你要分清楚，是人讓你痛苦，還是環境正在消耗你。",
  "卡德莉絲：今天這顆寶石，我替你收下。但五小時內，你還有反悔的權利。",
  "卡德莉絲：如果同樣的痛苦反覆出現，它就不只是情緒。",
  "卡德莉絲：離開不一定是失敗，有時候只是你終於願意承認自己不適合這裡。",
];

let selectedReason = null;
let toastTimer = null;
let authUser = null;
let profile = null;
let stateBoxes = [];

const el = {
  sections: {
    welcome: document.querySelector("#welcomeSection"),
    auth: document.querySelector("#authSection"),
    createBox: document.querySelector("#createBoxSection"),
    main: document.querySelector("#mainSection"),
  },
  introText: document.querySelector("#introText"),
  exitMessage: document.querySelector("#exitMessage"),
  enterButton: document.querySelector("#enterButton"),
  leaveButton: document.querySelector("#leaveButton"),
  registerForm: document.querySelector("#registerForm"),
  loginForm: document.querySelector("#loginForm"),
  showLogin: document.querySelector("#showLogin"),
  showRegister: document.querySelector("#showRegister"),
  registerMessage: document.querySelector("#registerMessage"),
  loginMessage: document.querySelector("#loginMessage"),
  boxForm: document.querySelector("#boxForm"),
  backToMainButton: document.querySelector("#backToMainButton"),
  userStatus: document.querySelector("#userStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  addBoxButton: document.querySelector("#addBoxButton"),
  deleteBoxButton: document.querySelector("#deleteBoxButton"),
  boxStage: document.querySelector("#boxStage"),
  boxTitle: document.querySelector("#boxTitle"),
  boxMeta: document.querySelector("#boxMeta"),
  boxState: document.querySelector("#boxState"),
  gemGrid: document.querySelector("#gemGrid"),
  boxLibrary: document.querySelector("#boxLibrary"),
  dailyAction: document.querySelector("#dailyAction"),
  undoPanel: document.querySelector("#undoPanel"),
  devPanel: document.querySelector("#devPanel"),
  fillBoxTestButton: document.querySelector("#fillBoxTestButton"),
  oracleNote: document.querySelector("#oracleNote"),
  gemModal: document.querySelector("#gemModal"),
  gemForm: document.querySelector("#gemForm"),
  reasonGrid: document.querySelector("#reasonGrid"),
  customReasonWrap: document.querySelector("#customReasonWrap"),
  customReasonInput: document.querySelector("#customReasonInput"),
  gemNote: document.querySelector("#gemNote"),
  confirmGem: document.querySelector("#confirmGem"),
  fullModal: document.querySelector("#fullModal"),
  fullForm: document.querySelector("#fullForm"),
  gemDetailModal: document.querySelector("#gemDetailModal"),
  gemDetailStone: document.querySelector("#gemDetailStone"),
  gemDetailReason: document.querySelector("#gemDetailReason"),
  gemDetailTime: document.querySelector("#gemDetailTime"),
  gemDetailNote: document.querySelector("#gemDetailNote"),
  deleteBoxModal: document.querySelector("#deleteBoxModal"),
  deleteBoxForm: document.querySelector("#deleteBoxForm"),
  deleteBoxCopy: document.querySelector("#deleteBoxCopy"),
  toast: document.querySelector("#toast"),
  soundToggle: document.querySelector("#soundToggle"),
  bgMusic: document.querySelector("#bgMusic"),
};

async function boot() {
  renderReasons();
  bindEvents();
  renderIntro();
  setupMusic();
  setupPasswordToggles();

  if (!supabaseClient) {
    showToast("Supabase 尚未載入，請確認網路與 CDN。");
    showSection("welcome");
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  authUser = data.session?.user || null;
  if (authUser) {
    await loadProfile();
    await loadBoxes();
  }
  route();
}

function bindEvents() {
  el.enterButton.addEventListener("click", () => showSection("auth"));
  el.leaveButton.addEventListener("click", () => {
    el.introText.hidden = true;
    el.exitMessage.hidden = false;
  });
  el.showLogin.addEventListener("click", () => toggleAuth("login"));
  el.showRegister.addEventListener("click", () => toggleAuth("register"));
  el.registerForm.addEventListener("submit", register);
  el.loginForm.addEventListener("submit", login);
  el.boxForm.addEventListener("submit", createBox);
  el.backToMainButton.addEventListener("click", route);
  el.logoutButton.addEventListener("click", logout);
  el.addBoxButton.addEventListener("click", showCreateAnotherBox);
  el.deleteBoxButton.addEventListener("click", openDeleteBoxModal);
  el.gemForm.addEventListener("submit", addGem);
  el.fullForm.addEventListener("submit", handleFullChoice);
  el.deleteBoxForm.addEventListener("submit", confirmDeleteBox);
  el.soundToggle.addEventListener("click", toggleMusic);
  el.fillBoxTestButton.addEventListener("click", fillBoxForTest);
  el.enterButton.addEventListener("click", unlockMusic);
}

function renderIntro() {
  el.introText.innerHTML = introCopy
    .split(/\n{2,}/)
    .map((line, index) => `<p class="intro-line" style="animation-delay: ${index * 900}ms">${line.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function showSection(name) {
  Object.entries(el.sections).forEach(([key, section]) => {
    section.classList.toggle("is-active", key === name);
  });
}

function route() {
  if (!authUser || !profile) {
    showSection("welcome");
    return;
  }

  const box = selectedBox();
  if (!box) {
    el.backToMainButton.hidden = true;
    showSection("createBox");
    return;
  }

  showSection("main");
  renderMain(box);
}

function normalizeUsername(username) {
  return username.trim().toLocaleLowerCase();
}

function usernameToEmail(username) {
  const encoded = btoa(unescape(encodeURIComponent(normalizeUsername(username))))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `u-${encoded}@caderis.local`;
}

function toggleAuth(mode) {
  el.registerForm.classList.toggle("is-active", mode === "register");
  el.loginForm.classList.toggle("is-active", mode === "login");
  el.registerMessage.textContent = "";
  el.loginMessage.textContent = "";
}

async function register(event) {
  event.preventDefault();
  const data = new FormData(el.registerForm);
  const username = data.get("username").trim();
  const password = data.get("password").trim();
  const nickname = data.get("nickname").trim();

  if (!username || !password || !nickname) return;
  if (password.length < 6) {
    el.registerMessage.textContent = "為了安全，登入密語至少需要 6 位。";
    return;
  }

  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
    email: usernameToEmail(username),
    password,
  });

  if (signUpError || !signUpData.user) {
    el.registerMessage.textContent = "這個小屋認證號可能已經被使用，或密語不符合規則。";
    return;
  }

  authUser = signUpData.user;
  const nextProfile = {
    id: authUser.id,
    username,
    username_norm: normalizeUsername(username),
    nickname,
  };

  const { error: profileError } = await supabaseClient.from("caderis_profiles").insert(nextProfile);
  if (profileError) {
    el.registerMessage.textContent = "身分建立時被木門擋了一下，請確認 SQL 與 Auth 設定。";
    return;
  }

  profile = nextProfile;
  stateBoxes = [];
  el.registerForm.reset();
  showToast("卡德莉絲記下了你的身分。");
  route();
}

async function login(event) {
  event.preventDefault();
  const data = new FormData(el.loginForm);
  const username = data.get("username").trim();
  const password = data.get("password").trim();

  const { data: loginData, error } = await supabaseClient.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error || !loginData.user) {
    el.loginMessage.textContent = "認證號或密語不太對，請再試一次。";
    return;
  }

  authUser = loginData.user;
  await loadProfile();
  await loadBoxes();
  el.loginForm.reset();
  showToast(`${profile.nickname}，門為你打開了。`);
  route();
}

async function logout() {
  await supabaseClient.auth.signOut();
  authUser = null;
  profile = null;
  stateBoxes = [];
  localStorage.removeItem(SELECTED_BOX_KEY);
  showSection("welcome");
  showToast("卡德莉絲替你把門輕輕帶上。");
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("caderis_profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();
  if (error) throw error;
  profile = data;
}

async function loadBoxes() {
  const { data: boxesData, error: boxesError } = await supabaseClient
    .from("caderis_boxes")
    .select("*")
    .order("created_at", { ascending: true });
  if (boxesError) throw boxesError;

  const { data: gemsData, error: gemsError } = await supabaseClient
    .from("caderis_gems")
    .select("*")
    .order("created_at", { ascending: true });
  if (gemsError) throw gemsError;

  stateBoxes = boxesData.map((box) => normalizeBox({
    ...box,
    gems: gemsData.filter((gem) => gem.box_id === box.id).map(normalizeGem),
  }));
}

function selectedBox() {
  const selectedId = localStorage.getItem(SELECTED_BOX_KEY);
  return stateBoxes.find((box) => box.id === selectedId) || stateBoxes.find((box) => box.status === "active") || stateBoxes[0] || null;
}

function activeBox() {
  const box = selectedBox();
  return box?.status === "active" ? box : null;
}

function showCreateAnotherBox() {
  el.backToMainButton.hidden = false;
  showSection("createBox");
}

async function createBox(event) {
  event.preventDefault();
  if (!authUser) return;

  const data = new FormData(el.boxForm);
  const mode = data.get("mode");
  const config = boxModes[mode];
  const payload = {
    owner_id: authUser.id,
    title: data.get("title").trim(),
    target_type: data.get("targetType"),
    alias: data.get("alias").trim(),
    mode,
    max_gems: config.maxGems,
    status: "active",
  };

  const { data: created, error } = await supabaseClient
    .from("caderis_boxes")
    .insert(payload)
    .select()
    .single();
  if (error) {
    showToast("木匣建立失敗，請確認 Supabase SQL 已執行。");
    return;
  }

  localStorage.setItem(SELECTED_BOX_KEY, created.id);
  el.boxForm.reset();
  await loadBoxes();
  showToast("木匣已放到你的桌前。");
  route();
}

function renderMain(box) {
  const count = box.gems.length;
  const mode = boxModes[box.mode];
  el.userStatus.textContent = `${profile.nickname} 在小屋`;
  el.boxTitle.textContent = box.title;
  el.boxMeta.textContent = `${mode.label}｜${count} / ${box.maxGems} 顆寶石｜關於 ${box.targetType}「${box.alias}」`;
  el.boxState.textContent = `狀態：${boxStateLabel(count, box.maxGems)}`;
  el.boxStage.classList.toggle("is-full", count >= box.maxGems);
  renderGemGrid(box);
  renderDailyAction(box);
  renderUndo(box);
  renderDevPanel(box);
  renderBoxLibrary(box.id);
  renderOracle();

  if (count >= box.maxGems && box.status === "active") {
    setTimeout(() => showModal(el.fullModal), 250);
  }
}

function renderGemGrid(box) {
  el.gemGrid.className = `gem-grid gems-${box.maxGems}`;
  el.gemGrid.innerHTML = "";

  for (let index = 0; index < box.maxGems; index += 1) {
    const slot = document.createElement("div");
    slot.className = "gem-slot";
    const gem = box.gems[index];
    if (gem) {
      const reason = reasons.find((entry) => entry.colorType === gem.colorType) || reasons.at(-1);
      slot.classList.add("has-gem");
      slot.tabIndex = 0;
      slot.setAttribute("role", "button");
      slot.setAttribute("aria-label", `查看寶石原因：${gem.reason}`);
      const stone = document.createElement("span");
      stone.className = `gem ${isToday(gem.createdAt) ? "is-new" : ""}`;
      stone.style.setProperty("--gem-color", reason.color);
      stone.style.setProperty("--gem-glow", reason.glow);
      stone.title = `${gem.reason}｜${formatDateTime(gem.createdAt)}`;
      slot.append(stone);
      slot.addEventListener("click", () => showGemDetail(gem));
      slot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showGemDetail(gem);
        }
      });
    }
    el.gemGrid.append(slot);
  }
}

function renderDailyAction(box) {
  if (box.status !== "active") {
    const statusLabel =
      box.status === "packed"
        ? "這只木匣已經打包。"
        : box.status === "archived"
          ? "這只木匣已經封存。"
          : "這一輪觀察已經完成。";
    el.dailyAction.innerHTML = `<p class="daily-copy">${statusLabel}<br />你可以從下方木匣架切換其他木匣，或新增一只木匣。</p>`;
    return;
  }

  if (box.gems.length >= box.maxGems) {
    el.dailyAction.innerHTML = `
      <p class="daily-copy">木匣已經裝滿了。這些寶石不是催你離開的命令，而是你一路收集下來的訊號。</p>
      <button class="btn btn-primary" type="button" id="openFullRitual">查看確認儀式</button>
    `;
    document.querySelector("#openFullRitual").addEventListener("click", () => showModal(el.fullModal));
    return;
  }

  if (todaysGem(box)) {
    el.dailyAction.innerHTML = `<p class="daily-copy">今天的寶石已經放入木匣。<br />卡德莉絲每天只收一顆，明天再來吧。</p>`;
    return;
  }

  el.dailyAction.innerHTML = `
    <p class="daily-copy">今天，我又想離開了</p>
    <button class="btn btn-primary" type="button" id="openGemModal">放入一顆寶石</button>
  `;
  document.querySelector("#openGemModal").addEventListener("click", openGemModal);
}

function renderUndo(box) {
  const latest = box.gems.at(-1);
  if (!latest) {
    el.undoPanel.hidden = true;
    return;
  }

  if (latest.fixed || Date.now() > new Date(latest.canUndoUntil).getTime()) {
    el.undoPanel.hidden = false;
    el.undoPanel.innerHTML = "寶石已經嵌進木匣，今天這一格會被留下。";
    return;
  }

  const remaining = Math.max(0, new Date(latest.canUndoUntil).getTime() - Date.now());
  el.undoPanel.hidden = false;
  el.undoPanel.innerHTML = `
    <p>這顆寶石還沒有完全嵌進木匣。<br />5 小時內，如果你改變心意，可以把它取回，放回自己身上。</p>
    <p>剩餘時間：約 ${Math.ceil(remaining / 60000)} 分鐘</p>
    <button class="btn btn-ghost" type="button" id="undoGem">取回這顆寶石</button>
  `;
  document.querySelector("#undoGem").addEventListener("click", undoGem);
}

function renderDevPanel(box) {
  el.devPanel.hidden = !DEV_MODE || box.gems.length >= box.maxGems || box.status !== "active";
}

function renderBoxLibrary(selectedId) {
  el.boxLibrary.innerHTML = `
    <h3 class="box-library-title">我的木匣</h3>
    ${stateBoxes
      .map((box) => {
        const mode = boxModes[box.mode];
        return `
          <button class="box-card-button ${box.id === selectedId ? "is-selected" : ""}" type="button" data-box-id="${box.id}">
            <strong>${escapeHtml(box.title)}</strong>
            <small>${mode.label}｜${box.gems.length} / ${box.maxGems} 顆｜${statusText(box.status)}</small>
          </button>
        `;
      })
      .join("")}
  `;

  el.boxLibrary.querySelectorAll("[data-box-id]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(SELECTED_BOX_KEY, button.dataset.boxId);
      route();
    });
  });
}

function renderOracle() {
  const note = oracleNotes[new Date().getDate() % oracleNotes.length];
  const [speaker, copy] = note.split("：");
  el.oracleNote.innerHTML = `<strong>${speaker}：</strong>${copy}`;
}

function renderReasons() {
  el.reasonGrid.innerHTML = "";
  reasons.forEach((entry) => {
    const button = document.createElement("button");
    button.className = "reason-option";
    button.type = "button";
    button.dataset.reason = entry.reason;
    button.innerHTML = `${entry.reason}<br><small>${entry.stone}</small>`;
    button.addEventListener("click", () => selectReason(entry, button));
    el.reasonGrid.append(button);
  });
}

function selectReason(entry, button) {
  selectedReason = entry;
  document.querySelectorAll(".reason-option").forEach((node) => node.classList.remove("is-selected"));
  button.classList.add("is-selected");
  el.customReasonWrap.hidden = entry.reason !== "自己填寫";
  el.confirmGem.disabled = false;
}

function openGemModal() {
  selectedReason = null;
  el.gemForm.reset();
  el.confirmGem.disabled = true;
  el.customReasonWrap.hidden = true;
  document.querySelectorAll(".reason-option").forEach((node) => node.classList.remove("is-selected"));
  showModal(el.gemModal);
}

async function addGem(event) {
  event.preventDefault();
  const box = activeBox();
  if (!box || !selectedReason || todaysGem(box)) return;

  const reasonText =
    selectedReason.reason === "自己填寫"
      ? el.customReasonInput.value.trim() || "自己填寫"
      : selectedReason.reason;
  const now = new Date();
  const payload = {
    box_id: box.id,
    owner_id: authUser.id,
    reason: reasonText,
    color_type: selectedReason.colorType,
    note: el.gemNote.value.trim(),
    created_at: now.toISOString(),
    can_undo_until: new Date(now.getTime() + FIVE_HOURS).toISOString(),
    fixed: false,
  };

  const { error } = await supabaseClient.from("caderis_gems").insert(payload);
  if (error) {
    showToast("寶石放入失敗，請稍後再試。");
    return;
  }

  closeModal(el.gemModal);
  await loadBoxes();
  showToast("卡德莉絲收下了這顆寶石。");
  route();
}

async function undoGem() {
  const box = activeBox();
  const latest = box?.gems.at(-1);
  if (!latest || latest.fixed || Date.now() > new Date(latest.canUndoUntil).getTime()) return;

  const { error } = await supabaseClient.from("caderis_gems").delete().eq("id", latest.id);
  if (error) {
    showToast("寶石暫時取不回來，請稍後再試。");
    return;
  }

  await loadBoxes();
  showToast("寶石已回到你身上。");
  route();
}

async function handleFullChoice(event) {
  event.preventDefault();
  const choice = event.submitter?.value;
  const box = activeBox();
  if (!box || !choice) return;

  if (choice === "observe") {
    await supabaseClient.from("caderis_boxes").update({ status: "completed" }).eq("id", box.id);
    const { data: newBox, error } = await supabaseClient
      .from("caderis_boxes")
      .insert({
        owner_id: authUser.id,
        title: box.title,
        target_type: box.targetType,
        alias: box.alias,
        mode: box.mode,
        max_gems: box.maxGems,
        status: "active",
      })
      .select()
      .single();
    if (!error) localStorage.setItem(SELECTED_BOX_KEY, newBox.id);
    closeModal(el.fullModal);
    await loadBoxes();
    showToast("卡德莉絲替你換上一只新的木匣。");
    route();
    return;
  }

  await supabaseClient.from("caderis_boxes").update({ status: choice }).eq("id", box.id);
  closeModal(el.fullModal);
  await loadBoxes();
  showToast(choice === "packed" ? "木匣已被緞帶打包。" : "木匣已封上蠟印。");
  route();
}

function openDeleteBoxModal() {
  const box = selectedBox();
  if (!box) return;
  el.deleteBoxCopy.innerHTML = `你正準備刪除「${escapeHtml(box.title)}」。<br />這個動作會連同 ${box.gems.length} 顆寶石一起移除，刪除後無法復原。`;
  showModal(el.deleteBoxModal);
}

async function confirmDeleteBox(event) {
  event.preventDefault();
  if (event.submitter?.value !== "delete") {
    closeModal(el.deleteBoxModal);
    return;
  }

  const box = selectedBox();
  if (!box) return;
  const { error } = await supabaseClient.from("caderis_boxes").delete().eq("id", box.id);
  if (error) {
    showToast("木匣刪除失敗，請稍後再試。");
    return;
  }

  localStorage.removeItem(SELECTED_BOX_KEY);
  closeModal(el.deleteBoxModal);
  await loadBoxes();
  showToast("卡德莉絲已替你移除那只木匣。");
  route();
}

async function fillBoxForTest() {
  const box = activeBox();
  if (!box) return;

  const payloads = [];
  while (box.gems.length + payloads.length < box.maxGems) {
    const reason = reasons[(box.gems.length + payloads.length) % reasons.length];
    const createdAt = new Date(Date.now() - payloads.length * 24 * 60 * 60 * 1000);
    payloads.push({
      box_id: box.id,
      owner_id: authUser.id,
      reason: reason.reason === "自己填寫" ? "開發測試" : reason.reason,
      color_type: reason.colorType,
      note: "這是開發階段用來測試滿匣儀式的寶石。",
      created_at: createdAt.toISOString(),
      can_undo_until: new Date(createdAt.getTime() + FIVE_HOURS).toISOString(),
      fixed: true,
    });
  }

  if (payloads.length) await supabaseClient.from("caderis_gems").insert(payloads);
  await loadBoxes();
  showToast("測試寶石已補滿木匣。");
  route();
}

function showGemDetail(gem) {
  const reason = reasons.find((entry) => entry.colorType === gem.colorType) || reasons.at(-1);
  el.gemDetailStone.style.setProperty("--gem-color", reason.color);
  el.gemDetailStone.style.setProperty("--gem-glow", reason.glow);
  el.gemDetailReason.textContent = `原因：${gem.reason}｜${reason.stone}`;
  el.gemDetailTime.textContent = `放入時間：${formatDateTime(gem.createdAt)}`;
  el.gemDetailNote.textContent = gem.note ? `留下的話：${gem.note}` : "這顆寶石沒有留下文字，只留下了那一刻的訊號。";
  showModal(el.gemDetailModal);
}

function normalizeBox(box) {
  return {
    id: box.id,
    ownerId: box.owner_id,
    title: box.title,
    targetType: box.target_type,
    alias: box.alias,
    mode: box.mode,
    maxGems: box.max_gems,
    status: box.status,
    createdAt: box.created_at,
    gems: box.gems || [],
  };
}

function normalizeGem(gem) {
  return {
    id: gem.id,
    boxId: gem.box_id,
    ownerId: gem.owner_id,
    reason: gem.reason,
    colorType: gem.color_type,
    note: gem.note || "",
    createdAt: gem.created_at,
    canUndoUntil: gem.can_undo_until,
    fixed: gem.fixed || Date.now() > new Date(gem.can_undo_until).getTime(),
  };
}

function todaysGem(box) {
  return box.gems.find((gem) => isToday(gem.createdAt));
}

function isToday(value) {
  return localDate(value) === localDate(new Date());
}

function localDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function boxStateLabel(count, max) {
  const ratio = count / max;
  if (ratio >= 1) return "木匣已經裝滿";
  if (ratio >= 0.76) return "門後傳來聲音";
  if (ratio >= 0.51) return "木匣開始發光";
  if (ratio >= 0.26) return "燭火開始搖晃";
  return "霧還很淡";
}

function statusText(status) {
  if (status === "packed") return "已打包";
  if (status === "archived") return "已封存";
  if (status === "completed") return "已完成一輪";
  return "觀察中";
}

function setupPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".password-wrap")?.querySelector("input");
      if (!input) return;
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      button.textContent = visible ? "◐" : "●";
      button.setAttribute("aria-label", visible ? "顯示密語" : "隱藏密語");
    });
  });
}

function showModal(modal) {
  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function closeModal(modal) {
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

function showToast(text) {
  clearTimeout(toastTimer);
  el.toast.textContent = text;
  el.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2400);
}

async function toggleMusic() {
  if (el.bgMusic.paused) {
    const started = await playMusic();
    if (!started) {
      showToast("目前沒有可播放的音檔，之後可把 music.mp3 放進 assets 資料夾。");
    }
    return;
  }

  el.bgMusic.pause();
  el.soundToggle.textContent = "🔇";
  el.soundToggle.setAttribute("aria-label", "播放背景音樂");
}

function setupMusic() {
  el.bgMusic.volume = MUSIC_VOLUME;
  el.bgMusic.loop = true;
  el.bgMusic.autoplay = true;
  el.bgMusic.muted = false;
  el.bgMusic.load();
  playMusic().then((started) => {
    if (started) return;
    el.soundToggle.textContent = "🔇";
    el.soundToggle.setAttribute("aria-label", "點一下播放背景音樂");
    window.addEventListener("click", unlockMusic, { once: true });
    window.addEventListener("touchstart", unlockMusic, { once: true });
    window.addEventListener("pointerup", unlockMusic, { once: true });
    window.addEventListener("keydown", unlockMusic, { once: true });
  });
}

async function unlockMusic() {
  await playMusic();
}

async function playMusic() {
  try {
    el.bgMusic.volume = MUSIC_VOLUME;
    await el.bgMusic.play();
    el.soundToggle.textContent = "🔊";
    el.soundToggle.setAttribute("aria-label", "暫停背景音樂");
    return true;
  } catch {
    el.soundToggle.textContent = "🔇";
    el.soundToggle.setAttribute("aria-label", "播放背景音樂");
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot();
