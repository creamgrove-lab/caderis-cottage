# 卡德莉絲小屋

手機優先的純前端互動網頁第一版。資料目前使用 `localStorage`，不需要安裝套件、不需要外部 API。

## 檔案

- `index.html`：頁面結構
- `style.css`：深色塔羅風格與手機版樣式
- `script.js`：登入、建立木匣、每日寶石、5 小時取回、滿匣儀式
- `assets/music.mp3`：可自行放入背景音樂檔，沒有音檔也能正常使用

## GitHub Pages

把這個資料夾裡的檔案推到 GitHub repo 後，可在 GitHub Pages 選擇部署根目錄或把檔案放到 repo 根目錄。

## Supabase 第二版提醒

第一版尚未連 Supabase。之後若要接資料庫，前端只能放 Supabase Project URL 與 anon public key。不要把 `service_role` key 或任何私密金鑰放在 GitHub、GitHub Pages、前端 JavaScript 裡。
