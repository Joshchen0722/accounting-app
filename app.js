const STORAGE_KEY = "accountingApp.v1";

const state = loadState();
let quickKind = "expense";

const DATE_HEADERS = [
  "日期",
  "發票日期",
  "發票開立日期",
  "開立日期",
  "開立年月日",
  "消費日期",
  "交易日期",
  "交易時間",
  "年月日",
  "date",
  "invDate",
  "invoiceDate",
];
const INVOICE_NUMBER_HEADERS = [
  "發票號碼",
  "發票字軌號碼",
  "電子發票號碼",
  "字軌號碼",
  "號碼",
  "invNum",
  "invoiceNumber",
  "number",
];
const INVOICE_PREFIX_HEADERS = ["發票字軌", "字軌", "字軌英文", "invPrefix"];
const INVOICE_SERIAL_HEADERS = ["發票號碼", "號碼", "流水號", "invNumber", "invoiceSerial"];
const SELLER_HEADERS = [
  "店家",
  "店名",
  "店家名稱",
  "商店",
  "商店名稱",
  "商家名稱",
  "營業人",
  "營業人名稱",
  "賣方",
  "賣方名稱",
  "賣方營業人",
  "賣方營業人名稱",
  "開立人",
  "公司名稱",
  "store",
  "sellerName",
  "businessName",
];
const AMOUNT_HEADERS = [
  "消費明細_金額",
  "消費明細金額",
  "明細金額",
  "品項金額",
  "金額",
  "總額",
  "總金額",
  "總計",
  "總計金額",
  "合計",
  "合計金額",
  "發票金額",
  "發票總金額",
  "消費金額",
  "交易金額",
  "銷售額",
  "含稅金額",
  "應付金額",
  "amount",
  "totalAmount",
  "salesAmount",
];
const DETAIL_NAME_HEADERS = ["消費明細_品名", "消費明細品名", "品名", "商品名稱", "明細品名", "itemName"];

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
  exportInvoicesButton: document.getElementById("exportInvoicesButton"),
  importInvoicesButton: document.getElementById("importInvoicesButton"),
  openEinvoiceButton: document.getElementById("openEinvoiceButton"),
  invoiceFileInput: document.getElementById("invoiceFileInput"),
  invoiceForm: document.getElementById("invoiceForm"),
  invoiceDateInput: document.getElementById("invoiceDateInput"),
  invoiceStoreInput: document.getElementById("invoiceStoreInput"),
  invoiceAmountInput: document.getElementById("invoiceAmountInput"),
  invoiceCategoryInput: document.getElementById("invoiceCategoryInput"),
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

  els.invoiceDateInput.value = isoToday();
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

  els.exportInvoicesButton.addEventListener("click", exportInvoicesCsv);
  els.importInvoicesButton.addEventListener("click", () => els.invoiceFileInput.click());
  els.invoiceFileInput.addEventListener("change", importInvoicesFile);
  els.openEinvoiceButton.addEventListener("click", () => {
    window.open("https://www.einvoice.nat.gov.tw/", "_blank", "noopener");
  });

  els.invoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const store = els.invoiceStoreInput.value.trim();
    const amount = parseAmount(els.invoiceAmountInput.value);
    const date = els.invoiceDateInput.value || isoToday();
    if (!store || amount <= 0) {
      if (!store) els.invoiceStoreInput.focus();
      else els.invoiceAmountInput.focus();
      return;
    }

    state.invoices.unshift({
      id: uid(),
      store,
      amount,
      category: els.invoiceCategoryInput.value,
      date,
      status: "new",
      source: "manual",
      invoiceNumber: "",
    });
    els.invoiceForm.reset();
    els.invoiceDateInput.value = isoToday();
    els.invoiceCategoryInput.value = "餐飲";
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
        <button class="small-action danger" data-delete-pending="${item.id}" type="button">刪除</button>
      </div>
    </article>
  `).join("");

  els.pendingList.querySelectorAll("[data-confirm-pending]").forEach((button) => {
    button.addEventListener("click", () => confirmPending(button.dataset.confirmPending));
  });
  els.pendingList.querySelectorAll("[data-delete-pending]").forEach((button) => {
    button.addEventListener("click", () => deleteById("pending", button.dataset.deletePending));
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
        <button class="small-action danger" data-delete-invoice="${item.id}" type="button">刪除</button>
      </div>
    </article>
  `).join("");

  els.invoiceList.querySelectorAll("[data-confirm-invoice]").forEach((button) => {
    button.addEventListener("click", () => confirmInvoice(button.dataset.confirmInvoice));
  });
  els.invoiceList.querySelectorAll("[data-delete-invoice]").forEach((button) => {
    button.addEventListener("click", () => deleteById("invoices", button.dataset.deleteInvoice));
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
          <button class="small-action danger" data-delete-installment="${item.id}" type="button">刪除</button>
        </div>
      </article>
    `;
  }).join("");

  els.installmentList.querySelectorAll("[data-pay-installment]").forEach((button) => {
    button.addEventListener("click", () => payInstallment(button.dataset.payInstallment));
  });
  els.installmentList.querySelectorAll("[data-delete-installment]").forEach((button) => {
    button.addEventListener("click", () => deleteById("installments", button.dataset.deleteInstallment));
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
      <div class="actions">
        <div class="amount ${item.kind}">${item.kind === "income" ? "+" : "-"}${money(item.amount)}</div>
        <button class="small-action danger" data-delete-transaction="${item.id}" type="button">刪除</button>
      </div>
    </article>
  `).join("");
  els.transactionList.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => deleteById("transactions", button.dataset.deleteTransaction));
  });
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

function deleteById(collection, id) {
  if (!Array.isArray(state[collection])) return;
  if (!window.confirm("確定刪除這筆資料嗎？")) return;
  state[collection] = state[collection].filter((item) => item.id !== id);
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

function exportInvoicesCsv() {
  const invoiceRows = state.invoices.map((item) => ({
    date: item.date,
    invoiceNumber: item.invoiceNumber || "",
    store: item.store,
    amount: item.amount,
    category: item.category,
    status: item.status === "booked" ? "已入帳" : "待確認",
    source: item.source || "",
  }));

  if (!invoiceRows.length) {
    window.alert("目前沒有可下載的發票資料。");
    return;
  }

  const header = ["日期", "發票號碼", "店家", "金額", "分類", "狀態", "來源"];
  const rows = invoiceRows.map((item) => [
    item.date,
    item.invoiceNumber,
    item.store,
    item.amount,
    item.category,
    item.status,
    item.source,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");
  downloadTextFile(`補帳盒發票清單-${isoToday()}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
}

function normalizeEinvoicePayload(payload) {
  const source = payload.invoices || payload.details || payload.data || payload.raw?.details || [];
  if (!Array.isArray(source)) return [];
  return source.map((item) => {
    const store = item.sellerName || item.seller || item.store || item.businessName || item.sellerAddress || "電子發票";
    const amount = parseAmount(item.amount || item.invAmount || item.totalAmount || item.salesAmount);
    const date = normalizeDate(item.invDate || item.date || item.invoiceDate);
    const number = item.invNum || item.invoiceNumber || item.number || "";
    if (!date || amount <= 0) return null;
    return {
      id: uid(),
      store: number ? `${store} ${number}` : store,
      amount,
      category: "其他",
      date,
      status: "new",
      source: "einvoice",
      invoiceNumber: number,
    };
  }).filter(Boolean);
}

function invoiceKey(item) {
  const number = normalizeInvoiceNumber(item.invoiceNumber);
  if (number) return `number:${number}`;
  return [item.date, normalizeComparableText(item.store), item.amount].join("|");
}

function importInvoicesFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseDelimitedFile(decodeInvoiceFile(reader.result));
      if (rows.length < 2) throw new Error("empty csv");
      const headerIndex = findInvoiceHeaderIndex(rows);
      if (headerIndex < 0) throw new Error("missing required headers");
      const header = rows[headerIndex].map((cell) => cell.trim());
      const imported = groupImportedInvoices(rows.slice(headerIndex + 1)
        .map((row) => invoiceFromCsvRow(header, row))
        .filter(Boolean));
      if (!imported.length) throw new Error("no invoice rows");
      const existingKeys = new Set(state.invoices.map(invoiceKey));
      const fresh = [];
      imported.forEach((item) => {
        const key = invoiceKey(item);
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        fresh.push(item);
      });
      state.invoices.unshift(...fresh);
      state.settings.lastInvoiceImportAt = new Date().toISOString();
      saveAndRender();
      window.alert(`匯入完成：新增 ${fresh.length} 筆，略過重複 ${imported.length - fresh.length} 筆。`);
    } catch (error) {
      window.alert(`無法匯入：${error.message}。請使用財政部下載的 CSV/文字檔，且內容需包含發票日期與金額。`);
    }
  };
  reader.readAsArrayBuffer(file);
}

function findInvoiceHeaderIndex(rows) {
  return rows.findIndex((row) => {
    const header = row.map((cell) => cell.trim());
    const hasDate = findHeaderIndex(header, DATE_HEADERS) >= 0;
    const hasAmount = findHeaderIndex(header, AMOUNT_HEADERS) >= 0;
    const hasInvoice = findHeaderIndex(header, INVOICE_NUMBER_HEADERS) >= 0
      || findHeaderIndex(header, INVOICE_PREFIX_HEADERS) >= 0;
    const hasSeller = findHeaderIndex(header, SELLER_HEADERS) >= 0;
    return hasDate && hasAmount && (hasInvoice || hasSeller);
  });
}

function invoiceFromCsvRow(header, row) {
  const pick = (names) => {
    const index = findHeaderIndex(header, names);
    return index >= 0 ? (row[index] ?? "") : "";
  };
  const date = normalizeDate(pick(DATE_HEADERS));
  const invoicePrefix = pick(INVOICE_PREFIX_HEADERS);
  const invoiceSerial = pick(INVOICE_SERIAL_HEADERS);
  const invoiceRaw = pick(INVOICE_NUMBER_HEADERS);
  const invoiceNumber = normalizeInvoiceNumber(
    invoiceRaw && !/[A-Za-z]/.test(invoiceRaw) && invoicePrefix
      ? `${invoicePrefix}${invoiceRaw}`
      : invoiceRaw || `${invoicePrefix}${invoiceSerial}`,
  );
  const seller = pick(SELLER_HEADERS).trim();
  const amount = parseAmount(pick(AMOUNT_HEADERS));
  const category = pick(["分類", "category"]).trim() || guessInvoiceCategory(seller);
  const detailName = pick(DETAIL_NAME_HEADERS).trim();
  if (!date || amount === 0) return null;
  const store = seller || invoiceNumber || "電子發票";
  return {
    id: uid(),
    store: invoiceNumber && seller ? `${seller} ${invoiceNumber}` : store,
    amount,
    category,
    date,
    status: "new",
    source: "manual-import",
    invoiceNumber,
    detailName,
  };
}

function groupImportedInvoices(items) {
  const grouped = new Map();
  const singles = [];
  items.forEach((item) => {
    const number = normalizeInvoiceNumber(item.invoiceNumber);
    if (!number) {
      singles.push(item);
      return;
    }
    if (!grouped.has(number)) {
      grouped.set(number, {
        ...item,
        amount: 0,
        detailNames: [],
      });
    }
    const current = grouped.get(number);
    current.amount += item.amount;
    if (item.detailName) current.detailNames.push(item.detailName);
  });

  return [
    ...Array.from(grouped.values()).map((item) => {
      const detailHint = item.detailNames.length > 1 ? ` 等 ${item.detailNames.length} 項` : "";
      const store = item.store || "電子發票";
      return {
        ...item,
        store: detailHint && !store.includes(detailHint) ? `${store}${detailHint}` : store,
        detailNames: undefined,
        detailName: undefined,
      };
    }),
    ...singles,
  ];
}

function findHeaderIndex(header, names) {
  const normalizedNames = names.map(normalizeHeader);
  const normalizedHeader = header.map(normalizeHeader);
  const exactIndex = normalizedHeader.findIndex((item) => normalizedNames.includes(item));
  if (exactIndex >= 0) return exactIndex;
  return normalizedHeader.findIndex((item) => normalizedNames.some((name) => item.includes(name)));
}

function decodeInvoiceFile(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(0);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("big5").decode(bytes);
    } catch {
      return new TextDecoder("utf-8").decode(bytes);
    }
  }
}

function parseDelimitedFile(text) {
  const normalized = String(text || "").replace(/^\ufeff/, "");
  const firstLine = normalized.split(/\r?\n/).find((line) => line.trim()) || "";
  return parseDelimited(normalized, detectDelimiter(firstLine));
}

function detectDelimiter(line) {
  const candidates = [",", "\t", ";"];
  return candidates
    .map((delimiter) => ({ delimiter, count: line.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value.replace(/\r$/, ""));
  rows.push(row);
  return rows.filter((items) => items.some((item) => item.trim() !== ""));
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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
  const amount = Number.parseFloat(String(value || "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const compactTaiwanDate = text.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (compactTaiwanDate) {
    return `${Number(compactTaiwanDate[1]) + 1911}-${compactTaiwanDate[2]}-${compactTaiwanDate[3]}`;
  }
  const compactDate = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactDate) {
    return `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;
  }
  const match = text.match(/^(\d{2,4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return text;
  const [, year, month, day] = match;
  const normalizedYear = Number(year) < 1911 ? Number(year) + 1911 : Number(year);
  return `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_()（）:：\-.]/g, "");
}

function normalizeInvoiceNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeComparableText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function guessInvoiceCategory(store) {
  const text = String(store || "");
  if (/全聯|家樂福|便利商店|7-11|統一超商|全家|萊爾富|OK/.test(text)) return "購物";
  if (/餐|咖啡|飲|麥當勞|肯德基|星巴克/.test(text)) return "餐飲";
  if (/停車|加油|捷運|台鐵|高鐵|客運/.test(text)) return "交通";
  return "其他";
}
