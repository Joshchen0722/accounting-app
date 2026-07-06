補帳盒：用 GitHub Pages 上線

適合情境
你想要一個固定網址，讓手機隨時隨地打開，例如：
https://你的帳號.github.io/accounting-app/

步驟
1. 登入 GitHub。
2. 建立一個新的 repository，例如 accounting-app。
3. 把這個資料夾裡的檔案上傳到 repository 根目錄：
   - index.html
   - styles.css
   - app.js
   - manifest.webmanifest
   - service-worker.js
   - icon.svg
4. 進入 repository 的 Settings。
5. 找到 Pages。
6. Source 選 Deploy from a branch。
7. Branch 選 main，資料夾選 /root。
8. 儲存後等 1 到 3 分鐘。
9. GitHub 會產生一個網址，用手機打開。
10. iPhone 用 Safari 分享按鈕 -> 加入主畫面。
11. Android 用 Chrome 選單 -> 新增至主畫面 / 安裝應用程式。

重要提醒
1. 最簡單做法是 public repository。
2. App 程式碼會公開，但你的記帳資料不會跟著公開，因為資料存在手機瀏覽器本機。
3. 備份檔不要上傳到 public repository，請放 Google Drive 或自己的私人位置。
4. 如果清除手機瀏覽器資料，記帳資料會消失，所以仍要定期下載雲端備份。
