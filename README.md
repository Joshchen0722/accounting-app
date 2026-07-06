# 補帳盒

手機優先的記帳原型，重點是降低漏記非現金交易的機率。

## 功能

- 快速記支出與收入
- 「先記一下」待補帳
- 發票手動登錄
- 發票 CSV 匯入與下載
- 分期支出管理
- 月報與分類統計
- 本機自動保存
- JSON 備份與還原
- 錯誤資料刪除

## GitHub Pages 上線

1. 到 repository 的 `Settings`。
2. 進入 `Pages`。
3. Source 選 `Deploy from a branch`。
4. Branch 選 `main`，資料夾選 `/root`。
5. 儲存後等 1 到 3 分鐘。
6. 用手機打開 GitHub Pages 產生的網址。

## 手機安裝

- iPhone：用 Safari 開啟網址，點分享，選「加入主畫面」。
- Android：用 Chrome 開啟網址，選單中選「新增至主畫面」或「安裝應用程式」。

## 資料提醒

目前資料存在手機瀏覽器本機。換手機、換瀏覽器或清除瀏覽資料時，資料不會自動跟過去。

請定期到「月報」下方下載備份，並放到 Google Drive。

## 電子發票同步

GitHub Pages 前端已預留電子發票同步入口。正式同步需要部署 `worker/einvoice-worker.js`，並在 Worker 設定合法的 `EINVOICE_APP_ID`。

財政部 API 不能直接由 GitHub Pages 呼叫；需要後端中介處理 CORS 與 appID 保護。

注意：財政部「電子發票開放資料 Open API」是統計與公開資料，例如發票開立數量、中獎落點、導入電子發票營業人清單。它不能下載個人手機條碼載具內的發票，也不能取代個人載具查詢用的 appID。
