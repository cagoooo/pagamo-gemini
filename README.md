# PaGamO 題組下載器

👉 網頁：https://cagoooo.github.io/pagamo-gemini/

把 Gemini（pagamo-reading-set 技能）給的「題組資料」貼進網頁，按一下就下載可以直接上傳 PaGamO 的題組 Excel。

> 2026-11-19 實測：Gemini 打開 Canvas 時不能同時使用技能，所以改成「複製題組資料 → 貼到這個網頁 → 下載」。

## 🧩 Gemini 技能包下載與安裝

👉 圖文安裝教學：https://cagoooo.github.io/pagamo-gemini/skill.html

- **下載技能檔**：[`skill/pagamo-reading-set/SKILL.md`](skill/pagamo-reading-set/SKILL.md)（只要這一個檔案，不用解壓縮）；資料夾版：[`pagamo-reading-set.zip`](skill/pagamo-reading-set.zip)。也可以到 [Releases](https://github.com/cagoooo/pagamo-gemini/releases) 下載。
- **安裝（約 2 分鐘，只要做一次）**：
  1. 用學校帳號開啟 [Gemini 技能頁](https://gemini.google.com/customize/skills)。
  2. 右上角「建立 ▾」→「上傳」。
  3. 按「檔案」，選 `SKILL.md`（不要選資料夾，資料夾裡的其他檔案會被一起塞進技能）。
  4. 出現「上傳其他檔案（選用）」時什麼都不加，直接按「上傳」。
  5. 「已安裝」出現 `pagamo-reading-set` 就完成。
- **使用**：開新對話（不要開 Canvas）→ 輸入框打 `@pag` 選技能 → 貼文章送出 → Gemini 問題數時，**再打 `@pag` 選技能**並回覆 5／8／10（或第一則就寫「@pagamo-reading-set 10 題」）→ 複製最後的 `json` 題組資料 → 貼到[題組下載器](https://cagoooo.github.io/pagamo-gemini/)下載 Excel → PaGamO 批量上傳選「題組」。
- **更新**：技能右邊「⋯」→「取代技能」選新的 `SKILL.md` → 按「上傳」。⚠️ 取代後技能會跑到「全部」區（變成未安裝），要再按「⋯」→「安裝」，重新整理確認回到「已安裝」。（2026-11-20 實測）

> 2026-11-20 在教育版 Gemini 實測：上傳對話框接受 PDF、CSV、PY、TXT、MD 檔或資料夾（不接受 zip），單獨上傳 `SKILL.md` 可以正確讀到技能名稱。

## 程式庫（也可以在其他網頁使用）

讓 Gemini 的 Skill「pagamo-reading-set」產生題組後，用 Canvas 做一個小網頁，老師按一下就能下載**可以直接上傳 PaGamO 的題組 Excel 檔**。

網頁會在老師的瀏覽器裡自動下載 PaGamO 官方「題組」批量上傳範本，把題目從第 11 列開始填進去，再存成 `.xlsx`。題目資料不會送到任何伺服器。

## 使用方式

在 Canvas 網頁載入下面這個網址，再呼叫 `PagamoGemini.mount(資料)`：

```
https://cdn.jsdelivr.net/gh/cagoooo/pagamo-gemini@1.0.0/pagamo.js
```

```js
PagamoGemini.mount({
  fileName: 'PaGamO題組_小水滴的旅行',
  sets: [{
    subject: '閱讀素養', book: '四年級', chapter: '小水滴的旅行', difficulty: 2,
    title: '小水滴的旅行', content: '第一段。\n\n第二段。', shuffle: 'v',
    questions: [
      { question: '題幹？', options: ['甲', '乙', '丙', '丁'], answer: 'A', explanation: '正確答案是「甲」，因為……' }
    ]
  }]
});
```

- `difficulty`：0 無、1 易、2 中、3 難。
- `shuffle`：`v` 打亂選項、`x` 固定順序。
- `answer`：A～E，複選用 `B&E`。
- 一次可以放多篇文章（`sets` 放多個），全部加起來不超過 1,000 列。

## 維護

- **改完網站要升版**（不然開著舊頁面的老師不會看到「有新版本」提示）：
  `powershell -File scripts/bump-version.ps1 -Version 1.5.0 -Notes "改了什麼"`，會同步 `version.json`、`sw.js`、`index.html` 的版本號（含 `?v=` 快取參數、分享圖網址、頁尾版本膠囊）。
- **重畫圖示與分享圖**：改 `favicon.svg` 或 `scripts/make_icons_og.py` 後執行 `python scripts/make_icons_og.py`（需要 playwright、pillow），再升版讓 LINE／FB 重抓新圖。
- 本機預覽（localhost）預設不啟用 Service Worker；網址加 `?sw=1` 才啟用，加 `?swdemo=1` 可直接看「有新版本」提示列的樣子。

## 已驗證

- 2026-11-19：產生的檔案在真的 PaGamO 批量上傳通過（檔案檢查通過、題目總覽內容與正確答案都對）。

---

Made with ❤️ by [阿凱老師](https://cagoooo.github.io/Akai/)・桃園市龍潭區石門國民小學
