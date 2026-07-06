補帳盒：手機正式使用方式

要隨時隨地在手機使用，需要把這個資料夾上傳到一個 HTTPS 網址。
不要使用 file:/// 或家中 Wi-Fi 的 192.168.x.x 網址當正式版。

最快方式：Netlify Drop
1. 打開 https://app.netlify.com/drop
2. 把 accounting-app 這整個資料夾拖進網頁
3. Netlify 會產生一個 https://...netlify.app 網址
4. 用手機打開該網址
5. iPhone：Safari 分享按鈕 -> 加入主畫面
6. Android：Chrome 選單 -> 新增至主畫面 / 安裝應用程式

資料保存
1. 日常資料會存在手機瀏覽器本機。
2. 換手機、清瀏覽器資料、使用不同瀏覽器時，資料不會自動跟過去。
3. 每週到「月報」最下方按「下載雲端備份」，再把檔案放到 Google Drive。
4. 新手機要接續使用時，用「匯入備份」選回之前的 JSON 備份檔。

下一階段若要自動同步，需要 Google 登入授權、Google Drive API、自動備份與衝突處理。
