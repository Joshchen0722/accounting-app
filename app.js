const STORAGE_KEY = "accountingApp.v1";

const state = loadState();
let quickKind = "expense";

const els = {
  todayLabel: document.getElementById("todayLabel"),
  monthBalance: document.getElementById("monthBalance"),
  pendingCount: document.getElementById("pendingCount"),
  installmentDue: document.getElementById("installmentDue"),
  quickForm: document.getElementById("quickForm"),
  amountInput: document.getElementById("amountInput"),
  noteInput: document.getElementById("noteInput"),
  categoryInput: document.getElementById("categoryInput"),
  methodInput: document.getElementById("methodInput"),
  pendingList: document.getElementById("pendingList"),
  invoiceList: document.getElementById("invoiceList"),
  installmentList: document.getElementById("installmentList"),
  transactionList: document.getElementById("transactionList"),
  categoryBars: document.getElementById("categoryBars"),
  reportIncome: document.getElementById("reportIncome"),
  reportExpense: document.getElementById("reportExpense"),
  reportInvoices: document.getElementById("reportInvoices"),
  reportPending: document.getElementById("reportPending"),
  carrierInput: document.getElementById("carrierInput"),
  verifyInput: document.getElementById("verifyInput"),
  installmentForm: document.getElementById("installmentForm"),
  installmentName: document.getElementById("installmentName"),
  installmentTotal: document.getElementById("installmentTotal"),
  installmentMonths: document.getElementById("installmentMonths"),
  storageStatus: document.getElementById("storageStatus"),
  exportBackupButton: document.getElementById("exportBackupButton"),
  exportDriveBackupButton: document.getElementById("exportDriveBackupButton"),
  openDriveButton: document.getElementById("openDriveButton"),
  importBackupButton: document.getElementById("importBackupButton"),
  backupFileInput: document.getElementById("backupFileInput"),
};

init();

function init() {
  els.todayLabel.textContent = new Intl.DateTimeFormat("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  els.carrierInput.value = state.settings.carrier || "";
  bindEvents();
  render();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      quickKind = button.dataset.kind;
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      els.amountInput.placeholder = quickKind === "pending" ? "可先空白" : "例如 120";
      els.methodInput.value = quickKind === "pending" ? "未定" : els.methodInput.value;
    });
  });

  document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      const [note, category, method, amount] = button.dataset.template.split(",");
      els.noteInput.value = note;
      els.categoryInput.value = category;
      els.methodInput.value = method;
      els.amountInput.value = amount;
      els.noteInput.focus();
    });
  });

  els.quickForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = parseAmount(els.amountInput.value);
    const note = els.noteInput.value.trim() || "未命名";

    if (quickKind !== "pending" && amount <= 0) {
      els.amountInput.focus();
      return;
    }

    if (quickKind === "pending") {
      state.pending.unshift({
        id: uid(),
        note,
        amount,
        category: els.categoryInput.value,
        method: els.methodInput.value,
        date: isoToday(),
        source: "quick",
        done: false,
      });
    } else {
      state.transactions.unshift({
        id: uid(),
        kind: quickKind,
        note,
        amount,
        category: els.categoryInput.value,
        method: els.methodInput.value,
        date: isoToday(),
      });
    }

    els.quickForm.reset();
    els.categoryInput.value = "餐飲";
    els.methodInput.value = quickKind === "pending" ? "未定" : "信用卡";
    saveAndRender();
  });

  document.getElementById("mockInvoiceButton").addEventListener("click", () => {
    const examples = [
      ["全聯福利中心", 368, "購物"],
      ["統一超商", 89, "餐飲"],
      ["台灣中油", 1000, "交通"],
    ];
    examples.forEach(([store, amount, category]) => {
      state.invoices.unshift({
        id: uid(),
        store,
        amount,
        category,
        date: isoToday(),
        status: "new",
      });
    });
    saveAndRender();
  });

  document.getElementById("saveCarrierButton").addEventListener("click", () => {
    state.settings.carrier = els.carrierInput.value.trim();
    state.settings.hasVerifyCode = els.verifyInput.value.length > 0;
    els.verifyInput.value = "";
    saveAndRender();
  });

  document.getElementById("clearDoneButton").addEventListener("click", () => {
    state.pending = state.pending.filter((item) => !item.done);
    saveAndRender();
  });

  document.getElementById("seedButton").addEventListener("click", () => {
    seedData();
    saveAndRender();
  });

  els.installmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.installmentName.value.trim();
    const total = parseAmount(els.installmentTotal.value);
    const months = Math.max(1, Number.parseInt(els.installmentMonths.value, 10) || 0);
    if (!name || total <= 0 || months <= 0) return;

    state.installments.unshift({
      id: uid(),
      name,
      total,
      months,
      paid: 0,
      startDate: isoToday(),
    });
    els.installmentForm.reset();
    saveAndRender();
  });

  els.exportBackupButton.addEventListener("click", exportBackup);
  els.exportDriveBackupButton.addEventListener("click", () => exportBackup("drive"));
  els.openDriveButton.addEventListener("click", () => {
    window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener");
  });
  els.importBackupButton.addEventListener("click", () => els.backupFileInput.click());
  els.backupFileInput.addEventListener("change", importBackup);
}

function switchView(view) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
}

function render() {
  renderSummary();
  renderPending();
  renderInvoices();
  renderInstallments();
  renderReport();
  renderStorageInfo();
}

function renderSummary() {
  const income = sumTransactions("income");
  const expense = sumTransactions("expense");
  const due = monthlyInstallments();
  els.monthBalance.textContent = money(income - expense - due);
  els.pendingCount.textContent = state.pending.filter((item) => !item.done).length;
  els.installmentDue.textContent = money(due);
}

function renderPending() {
  const items = state.pending.filter((item) => !item.done);
  if (!items.length) return renderEmpty(els.pendingList);

  els.pendingList.innerHTML = items.map((item) => `
    <article class="item">
      <div class="item-main">
        <div class="item-title">
          <span>${escapeHtml(item.note)}</span>
          <span class="pill warn">待補</span>
        </div>
        <div class="item-sub">${item.date} · ${escapeHtml(item.category)} · ${escapeHtml(item.method)}</div>
      </div>
      <div class="actions">
        <div class="amount expense">${item.amount > 0 ? money(item.amount) : "未填"}</div>
        <button class="small-action primary-mini" data-confirm-pending="${item.id}" type="button">入帳</button>
      </div>
    </article>
  `).join("");

  els.pendingList.querySelectorAll("[data-confirm-pending]").forEach((button) => {
    button.addEventListener("click", () => confirmPending(button.dataset.confirmPending));
  });
}

function renderInvoices() {
  const items = state.invoices.filter((item) => item.status !== "booked");
  if (!items.length) return renderEmpty(els.invoiceList);

  els.invoiceList.innerHTML = items.map((item) => `
    <article class="item">
      <div class="item-main">
        <div class="item-title">
          <span>${escapeHtml(item.store)}</span>
          <span class="pill">發票</span>
        </div>
        <div class="item-sub">${item.date} · ${escapeHtml(item.category)}</div>
      </div>
      <div class="actions">
        <div class="amount expense">${money(item.amount)}</div>
        <button class="small-action primary-mini" data-confirm-invoice="${item.id}" type="button">確認</button>
      </div>
    </article>
  `).join("");

  els.invoiceList.querySelectorAll("[data-confirm-invoice]").forEach((button) => {
    button.addEventListener("click", () => confirmInvoice(button.dataset.confirmInvoice));
  });
}

function renderInstallments() {
  if (!state.installments.length) return renderEmpty(els.installmentList);

  els.installmentList.innerHTML = state.installments.map((item) => {
    const monthly = item.total / item.months;
    const remaining = Math.max(0, item.months - item.paid);
    return `
      <article class="item">
        <div class="item-main">
          <div class="item-title">
            <span>${escapeHtml(item.name)}</span>
            <span class="pill">${remaining} 期</span>
          </div>
          <div class="item-sub">每月 ${money(monthly)} · 已付 ${item.paid}/${item.months}</div>
        </div>
        <div class="actions">
          <div class="amount expense">${money(monthly)}</div>
          <button class="small-action" data-pay-installment="${item.id}" type="button">付一期</button>
        </div>
      </article>
    `;
  }).join("");

  els.installmentList.querySelectorAll("[data-pay-installment]").forEach((button) => {
    button.addEventListener("click", () => payInstallment(button.dataset.payInstallment));
  });
}

function renderReport() {
  const income = sumTransactions("income");
  const expense = sumTransactions("expense");
  els.reportIncome.textContent = money(income);
  els.reportExpense.textContent = money(expense);
  els.reportInvoices.textContent = state.invoices.filter((item) => item.status !== "booked").length;
  els.reportPending.textContent = state.pending.filter((item) => !item.done).length;

  const categoryTotals = {};
  state.transactions
    .filter((item) => item.kind === "expense")
    .forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });
  const rows = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] || 1;
  els.categoryBars.innerHTML = rows.length ? rows.map(([category, amount]) => `
    <div class="bar-row">
      <span>${escapeHtml(category)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(5, amount / max * 100)}%"></div></div>
      <strong>${money(amount)}</strong>
    </div>
  `).join("") : `<div class="empty">目前沒有資料</div>`;

  const tx = state.transactions.slice(0, 8);
  if (!tx.length) return renderEmpty(els.transactionList);
  els.transactionList.innerHTML = tx.map((item) => `
    <article class="item">
      <div class="item-main">
        <div class="item-title"><span>${escapeHtml(item.note)}</span></div>
        <div class="item-sub">${item.date} · ${escapeHtml(item.category)} · ${escapeHtml(item.method)}</div>
      </div>
      <div class="amount ${item.kind}">${item.kind === "income" ? "+" : "-"}${money(item.amount)}</div>
    </article>
  `).join("");
}

function renderStorageInfo() {
  if (!els.storageStatus) return;
  const lastBackup = state.settings.lastBackupAt;
  els.storageStatus.textContent = lastBackup
    ? `上次備份 ${formatDateTime(lastBackup)}`
    : "已自動存在本機";
}

function confirmPending(id) {
  const item = state.pending.find((entry) => entry.id === id);
  if (!item) return;
  if (item.amount <= 0) {
    const amount = window.prompt("金額");
    item.amount = parseAmount(amount);
    if (item.amount <= 0) return;
  }
  item.done = true;
  state.transactions.unshift({
    id: uid(),
    kind: "expense",
    note: item.note,
    amount: item.amount,
    category: item.category,
    method: item.method === "未定" ? "信用卡" : item.method,
    date: item.date,
  });
  saveAndRender();
}

function confirmInvoice(id) {
  const item = state.invoices.find((entry) => entry.id === id);
  if (!item) return;
  item.status = "booked";
  state.transactions.unshift({
    id: uid(),
    kind: "expense",
    note: item.store,
    amount: item.amount,
    category: item.category,
    method: "載具",
    date: item.date,
  });
  saveAndRender();
}

function payInstallment(id) {
  const item = state.installments.find((entry) => entry.id === id);
  if (!item || item.paid >= item.months) return;
  item.paid += 1;
  state.transactions.unshift({
    id: uid(),
    kind: "expense",
    note: `${item.name} 分期`,
    amount: Math.round(item.total / item.months),
    category: "分期",
    method: "信用卡",
    date: isoToday(),
  });
  saveAndRender();
}

function monthlyInstallments() {
  return state.installments.reduce((sum, item) => {
    if (item.paid >= item.months) return sum;
    return sum + item.total / item.months;
  }, 0);
}

function sumTransactions(kind) {
  return state.transactions
    .filter((item) => item.kind === kind)
    .reduce((sum, item) => sum + item.amount, 0);
}

function seedData() {
  state.transactions.unshift(
    { id: uid(), kind: "income", note: "薪資", amount: 52000, category: "薪資", method: "轉帳", date: isoToday() },
    { id: uid(), kind: "expense", note: "晚餐", amount: 180, category: "餐飲", method: "LINE Pay", date: isoToday() },
  );
  state.pending.unshift({ id: uid(), note: "蝦皮", amount: 0, category: "購物", method: "信用卡", date: isoToday(), source: "quick", done: false });
}

function renderEmpty(container) {
  container.innerHTML = document.getElementById("emptyTemplate").innerHTML;
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function exportBackup(target = "local") {
  state.settings.lastBackupAt = new Date().toISOString();
  state.settings.lastBackupTarget = target;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const payload = {
    app: "補帳盒",
    version: 1,
    exportedAt: state.settings.lastBackupAt,
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = target === "drive"
    ? `補帳盒-GoogleDrive備份-${isoToday()}.json`
    : `補帳盒備份-${isoToday()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  render();
}

function importBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const imported = parsed.data || parsed;
      if (!isValidBackup(imported)) throw new Error("invalid backup");
      if (!window.confirm("匯入後會覆蓋目前這台瀏覽器裡的資料，確定要匯入嗎？")) return;

      state.transactions = imported.transactions || [];
      state.pending = imported.pending || [];
      state.invoices = imported.invoices || [];
      state.installments = imported.installments || [];
      state.settings = {
        ...(imported.settings || {}),
        lastImportedAt: new Date().toISOString(),
      };
      saveAndRender();
    } catch {
      window.alert("這個檔案不是補帳盒備份，無法匯入。");
    }
  };
  reader.readAsText(file, "utf-8");
}

function isValidBackup(value) {
  return Boolean(value)
    && Array.isArray(value.transactions)
    && Array.isArray(value.pending)
    && Array.isArray(value.invoices)
    && Array.isArray(value.installments);
}

function loadState() {
  const fallback = {
    transactions: [],
    pending: [],
    invoices: [],
    installments: [],
    settings: {},
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseAmount(value) {
  const amount = Number.parseFloat(String(value || "").replace(/,/g, ""));
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function money(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}
