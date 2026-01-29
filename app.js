// ===== DOM =====
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const titleInput = document.getElementById("title");
const list = document.getElementById("list");
const cal = document.getElementById("calendar");
const month = document.getElementById("month");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

// ===== 状態 =====
let events = JSON.parse(localStorage.getItem("events") || "[]");
let view = new Date();
let selected = new Date().toISOString().slice(0, 10);
let editingId = null;

// ===== 保存 =====
const save = () => localStorage.setItem("events", JSON.stringify(events));

// ===== 追加 / 更新 =====
document.getElementById("add").onclick = () => {
  const d = dateInput.value || selected;
  const t = timeInput.value;
  const title = titleInput.value.trim();
  if (!title) return;

  if (editingId) {
    // 上書き編集
    const e = events.find(e => String(e.id) === String(editingId));
    if (e) {
      e.d = d;
      e.t = t;
      e.title = title;
    }
    editingId = null;
  } else {
    // 新規追加（UUID）
    events.push({
      id: crypto.randomUUID(),
      d,
      t,
      title
    });
    scheduleNotify(d, t, title);
  }

  save();
  titleInput.value = "";
  timeInput.value = "";
  render();
};

// ===== 音声入力 =====
document.getElementById("voice").onclick = () => {
  if (!("webkitSpeechRecognition" in window)) return;

  const r = new webkitSpeechRecognition();
  r.lang = "ja-JP";
  r.onresult = e => {
    const text = e.results[0][0].transcript;
    titleInput.value = text;

    const m = text.match(/(\d+)月(\d+)日/);
    if (m) {
      const d = new Date();
      d.setMonth(Number(m[1]) - 1);
      d.setDate(Number(m[2]));
      dateInput.value = d.toISOString().slice(0, 10);
    }
  };
  r.start();
};

// ===== 通知 =====
function scheduleNotify(d, t, title) {
  if (!t || Notification.permission !== "granted") return;
  const ms = new Date(`${d}T${t}`).getTime() - Date.now();
  if (ms <= 0) return;

  setTimeout(() => {
    navigator.serviceWorker.ready.then(reg =>
      reg.showNotification("予定通知", { body: title })
    );
  }, ms);
}

// ===== 一覧 =====
function renderList() {
  list.innerHTML = "";
  events
    .filter(e => e.d === selected)
    .forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${e.t || ""} ${e.title}</span>
        <span>
          <button onclick="editEvent('${e.id}')">✏</button>
          <button onclick="deleteEvent('${e.id}')">🗑</button>
        </span>
      `;
      list.appendChild(li);
    });
}

// ===== カレンダー =====
function drawCalendar() {
  cal.innerHTML = "";
  const y = view.getFullYear();
  const m = view.getMonth();
  month.textContent = `${y}年 ${m + 1}月`;

  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < first; i++) cal.appendChild(document.createElement("div"));

  for (let d = 1; d <= last; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const div = document.createElement("div");
    div.textContent = d;
    div.className = "day";

    if (ds === new Date().toISOString().slice(0, 10)) div.classList.add("today");
    if (events.some(e => e.d === ds)) div.classList.add("has");

    div.onclick = () => {
      selected = ds;
      render();
    };
    cal.appendChild(div);
  }
}

// ===== 編集・削除（★互換対応ここが重要） =====
window.editEvent = id => {
  const e = events.find(e => String(e.id) === String(id));
  if (!e) return;
  editingId = e.id;
  dateInput.value = e.d;
  timeInput.value = e.t;
  titleInput.value = e.title;
};

window.deleteEvent = id => {
  // number / string 両対応
  events = events.filter(e => String(e.id) !== String(id));
  save();
  render();
};

// ===== 月移動 =====
prev.onclick = () => {
  view.setMonth(view.getMonth() - 1);
  render();
};
next.onclick = () => {
  view.setMonth(view.getMonth() + 1);
  render();
};

// ===== 初期化 =====
Notification.requestPermission();
function render() {
  drawCalendar();
  renderList();
}
render();
