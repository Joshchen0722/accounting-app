# 電子發票同步 Worker

GitHub Pages 不能直接呼叫財政部電子發票 API，因為財政部 API 沒有對 GitHub Pages 開 CORS，而且 `appID` 不應該放在公開前端程式碼裡。

這個 Cloudflare Worker 負責：

- 接收手機 App 的同步請求
- 把手機條碼與驗證碼轉送到財政部電子發票 API
- 使用 Worker 環境變數保存 `EINVOICE_APP_ID`
- 回傳發票資料給手機 App

## 部署步驟

1. 到 Cloudflare 建立 Worker。
2. 將 `einvoice-worker.js` 貼到 Worker 程式碼。
3. 在 Worker 的 Variables / Secrets 或 Secrets Store 加入：
   - `EINVOICE_APP_ID`
   - 值填財政部核發或可合法使用的 appID
4. 部署後取得 Worker 網址，例如：
   - `https://accounting-einvoice.你的帳號.workers.dev`
5. 回到補帳盒 App 的「發票」頁。
6. 在「同步服務網址」填入 Worker 網址。
7. 輸入手機條碼與驗證碼，按「同步電子發票」。

## 注意

目前 Worker 只查詢每月發票清單。若要抓每張發票的明細品項，需要再串接財政部明細查詢 action。

財政部「電子發票開放資料 Open API」不是個人發票下載 API。它的網址是 `https://dataset.einvoice.nat.gov.tw/ods/portal/`，用途是公開統計資料與營業人清單；個人手機條碼載具查詢仍需使用 `https://api.einvoice.nat.gov.tw/PB2CAPIVAN/invapp/InvApp`，並設定有效的 `EINVOICE_APP_ID`。
