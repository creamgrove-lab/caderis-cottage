# 卡德莉絲小屋

手機優先的純前端互動網頁第一版。資料目前使用 `localStorage`，不需要安裝套件、不需要外部 API。

## 檔案

- `index.html`：頁面結構
- `style.css`：深色塔羅風格與手機版樣式
- `script.js`：登入、建立木匣、每日寶石、5 小時取回、滿匣儀式
- `assets/music.mp3`：可自行放入背景音樂檔，沒有音檔也能正常使用

## GitHub Pages

把這個資料夾裡的檔案推到 GitHub repo 後，可在 GitHub Pages 選擇部署根目錄或把檔案放到 repo 根目錄。

## Supabase 設定

這一版使用 Supabase Auth 與 RLS。前端只放 Project URL 與 publishable key，不放 `service_role` key。

1. 進入 Supabase project。
2. Authentication → Providers → Email，開啟 Email。
3. 測試階段建議先關閉 Confirm email，否則註冊後不會立刻登入，資料表也無法建立 profile。
4. Authentication → URL Configuration：
   - Site URL 填 GitHub Pages 網址。
   - Redirect URLs 也加入 GitHub Pages 網址。
5. SQL Editor 貼上並執行 `supabase-caderis.sql`。
6. 上傳 `index.html`、`style.css`、`script.js`、`README.md`、`supabase-caderis.sql` 與 `assets/music.mp3`。

資料表：

- `caderis_profiles`
- `caderis_boxes`
- `caderis_gems`

RLS 已限制使用者只能讀寫自己的 profile、木匣與寶石。
