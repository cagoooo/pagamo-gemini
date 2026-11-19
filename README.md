# PaGamO 題組下載器

👉 網頁：https://cagoooo.github.io/pagamo-gemini/

把 Gemini（pagamo-reading-set 技能）給的「題組資料」貼進網頁，按一下就下載可以直接上傳 PaGamO 的題組 Excel。

> 2026-11-19 實測：Gemini 打開 Canvas 時不能同時使用技能，所以改成「複製題組資料 → 貼到這個網頁 → 下載」。

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

## 已驗證

- 2026-11-19：產生的檔案在真的 PaGamO 批量上傳通過（檔案檢查通過、題目總覽內容與正確答案都對）。

---

Made with ❤️ by [阿凱老師](https://cagoooo.github.io/Akai/)・桃園市龍潭區石門國民小學
