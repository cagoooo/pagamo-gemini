/*!
 * PaGamO 題組一鍵下載（給 Gemini Canvas 使用）
 * 把題組資料填進 PaGamO 官方「題組」批量上傳範本，直接下載成 .xlsx。
 * Made with ❤️ by 阿凱老師 https://cagoooo.github.io/Akai/
 */
(function (g) {
  'use strict';

  var VERSION = '1.0.0';
  var TEMPLATE_URL = 'https://cdn.pagamo.org/dyna_questions/templates/v5/PaGamO_%E6%89%B9%E9%87%8F%E4%B8%8A%E5%82%B3%E7%AF%84%E4%BE%8B_%E9%A1%8C%E7%B5%84.xlsx';
  var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var HEADERS = ['編號(必填)', '科目(必填) ', '冊次(必填)', '章節(必填)', '難度', '標題(必填)', '內容(必填)', '內容多媒體檔名',
    '題目(必填)', '題目多媒體檔名', '選項A(必填)', '選項多媒體檔名', '選項B(必填)', '選項多媒體檔名', '選項C', '選項多媒體檔名',
    '選項D', '選項多媒體檔名', '選項E', '選項多媒體檔名', '正確答案(必填)', '文字解說', '文字解說多媒體檔名', '選項排列', '標籤（僅限課程題庫使用）'];
  var LETTERS = 'ABCDE';
  var DIFFICULTY = { '無': 0, '易': 1, '中': 2, '難': 3 };

  function loadXLSX() {
    if (g.XLSX) return Promise.resolve(g.XLSX);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = XLSX_URL;
      s.onload = function () { g.XLSX ? resolve(g.XLSX) : reject(new Error('Excel 工具載入失敗')); };
      s.onerror = function () { reject(new Error('無法載入 Excel 工具（' + XLSX_URL + '）')); };
      document.head.appendChild(s);
    });
  }

  function text(v) { return v == null ? '' : String(v).trim(); }

  /** 檢查並整理資料，回傳錯誤訊息陣列（空陣列＝沒問題） */
  function validate(data) {
    var errs = [];
    if (!data || !Array.isArray(data.sets) || !data.sets.length) return ['沒有任何題組（sets 是空的）'];
    data.sets.forEach(function (s, i) {
      var n = '第 ' + (i + 1) + ' 篇';
      ['subject', 'book', 'chapter'].forEach(function (k) {
        var v = text(s[k]);
        if (!v) errs.push(n + '缺少' + { subject: '科目', book: '冊次', chapter: '章節' }[k]);
        else if (v.length > 30) errs.push(n + '的' + { subject: '科目', book: '冊次', chapter: '章節' }[k] + '超過 30 個字');
      });
      if (!text(s.title)) errs.push(n + '缺少標題');
      if (!text(s.content)) errs.push(n + '缺少文章內容');
      if (!Array.isArray(s.questions) || !s.questions.length) { errs.push(n + '沒有題目'); return; }
      s.questions.forEach(function (q, j) {
        var m = n + '第 ' + (j + 1) + ' 題';
        if (!text(q.question)) errs.push(m + '缺少題幹');
        var opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2 || opts.length > 5) errs.push(m + '的選項要 2～5 個（目前 ' + opts.length + ' 個）');
        opts.forEach(function (o, k) { if (!text(o)) errs.push(m + '的選項 ' + LETTERS[k] + ' 是空的'); });
        var ans = text(q.answer).toUpperCase().replace(/\s/g, '');
        if (!/^[A-E](&[A-E])*$/.test(ans)) errs.push(m + '的正確答案要寫 A～E（目前是「' + q.answer + '」）');
        else ans.split('&').forEach(function (a) {
          if (LETTERS.indexOf(a) >= opts.length) errs.push(m + '的正確答案 ' + a + ' 沒有對應的選項');
        });
      });
    });
    var rows = data.sets.reduce(function (n, s) { return n + 1 + (s.questions || []).length; }, 0);
    if (rows > 1000) errs.push('總共 ' + rows + ' 列，超過 PaGamO 一次 1,000 列的上限');
    return errs;
  }

  function difficulty(v) {
    if (v == null || v === '') return 2;
    if (DIFFICULTY.hasOwnProperty(v)) return DIFFICULTY[v];
    var n = parseInt(v, 10);
    return n >= 0 && n <= 3 ? n : 2;
  }

  /** 轉成 PaGamO 範本第 11 列以後的資料列（每列 25 欄） */
  function toRows(data) {
    var errs = validate(data);
    if (errs.length) throw new Error(errs.join('\n'));
    var rows = [];
    data.sets.forEach(function (s, i) {
      var head = new Array(25).fill(null);
      head[0] = i + 1; head[1] = text(s.subject); head[2] = text(s.book); head[3] = text(s.chapter);
      head[4] = difficulty(s.difficulty); head[5] = text(s.title);
      head[6] = String(s.content).replace(/\r\n?/g, '\n').trim();
      rows.push(head);
      s.questions.forEach(function (q, j) {
        var r = new Array(25).fill(null);
        r[0] = (i + 1) + '_' + (j + 1);
        r[8] = text(q.question);
        q.options.forEach(function (o, k) { r[10 + k * 2] = text(o); });
        r[20] = text(q.answer).toUpperCase().replace(/\s/g, '');
        r[21] = text(q.explanation) || null;
        r[23] = text(s.shuffle).toLowerCase() === 'x' ? 'x' : 'v';
        rows.push(r);
      });
    });
    return rows;
  }

  /** 下載 PaGamO 官方題組範本，從第 11 列開始填入題組，回傳 workbook */
  function build(data) {
    var rows = toRows(data);
    return loadXLSX().then(function (XLSX) {
      return fetch(TEMPLATE_URL).then(function (res) {
        if (!res.ok) throw new Error('下載 PaGamO 官方範本失敗（' + res.status + '）');
        return res.arrayBuffer();
      }).then(function (buf) {
        var wb = XLSX.read(buf, { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        Object.keys(ws).forEach(function (k) {
          if (k.charAt(0) !== '!' && XLSX.utils.decode_cell(k).r >= 10) delete ws[k];
        });
        XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A11' });
        return wb;
      });
    });
  }

  function fileName(data) {
    var n = text(data.fileName) || ('PaGamO題組_' + text(data.sets && data.sets[0] && data.sets[0].title));
    return n.replace(/[\\/:*?"<>|\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) + '.xlsx';
  }

  function download(data) {
    return build(data).then(function (wb) {
      g.XLSX.writeFile(wb, fileName(data), { bookSST: true });
      return fileName(data);
    });
  }

  /** 備用：可以直接貼到範本 A10 的表格文字（含表頭，Tab 分隔） */
  function toPasteText(data) {
    var rows = [HEADERS].concat(toRows(data));
    return rows.map(function (r) {
      return r.map(function (v) { return v == null ? '' : String(v).replace(/\t/g, ' ').replace(/\n+/g, '　'); }).join('\t');
    }).join('\n');
  }

  var CSS = '.pgm-card{max-width:680px;margin:16px auto;padding:24px;border-radius:16px;background:#fff;color:#1f2937;' +
    'box-shadow:0 4px 20px rgba(0,0,0,.08);font-family:system-ui,"Microsoft JhengHei",sans-serif;line-height:1.7}' +
    '.pgm-card h1{font-size:22px;margin:0 0 6px}.pgm-sum{color:#475569;margin:0 0 12px}' +
    '.pgm-list{margin:0 0 12px;padding-left:20px;max-height:220px;overflow:auto;font-size:15px}' +
    '.pgm-btn{display:block;width:100%;font-size:18px;padding:14px;border:0;border-radius:12px;background:#2563eb;color:#fff;cursor:pointer;margin-top:10px}' +
    '.pgm-btn:disabled{background:#94a3b8;cursor:wait}.pgm-btn.pgm-sub{background:#e2e8f0;color:#1f2937;font-size:15px;padding:10px}' +
    '.pgm-msg{font-weight:bold;white-space:pre-line;margin:10px 0}.pgm-ok{color:#15803d}.pgm-err{color:#b91c1c}' +
    '.pgm-steps{padding-left:20px;margin:8px 0;font-size:15px}.pgm-credit{text-align:center;font-size:13px;color:#64748b;margin-top:14px}' +
    '.pgm-credit a{color:inherit;text-decoration:none;border-bottom:1px dotted currentColor}';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /** 在頁面上畫出下載卡片 */
  function mount(data, target) {
    var root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root) { root = document.createElement('div'); document.body.appendChild(root); }
    var style = el('style'); style.textContent = CSS; document.head.appendChild(style);
    var card = el('div', 'pgm-card');
    card.appendChild(el('h1', null, '📥 PaGamO 題組 Excel'));
    var errs = validate(data);
    var msg = el('p', 'pgm-msg');
    if (errs.length) {
      msg.className = 'pgm-msg pgm-err';
      msg.textContent = '❌ 題組資料有問題，請 Gemini 修正後重做：\n' + errs.join('\n');
      card.appendChild(msg); root.appendChild(card); return;
    }
    var total = data.sets.reduce(function (n, s) { return n + s.questions.length; }, 0);
    card.appendChild(el('p', 'pgm-sum', '共 ' + data.sets.length + ' 篇文章、' + total + ' 題｜檔名：' + fileName(data)));
    var list = el('ol', 'pgm-list');
    data.sets.forEach(function (s) {
      var li = el('li', null, '【' + text(s.title) + '】');
      s.questions.forEach(function (q, j) { li.appendChild(el('div', null, (j + 1) + '. ' + text(q.question) + '（答案 ' + text(q.answer).toUpperCase() + '）')); });
      list.appendChild(li);
    });
    card.appendChild(list);
    var btn = el('button', 'pgm-btn', '⬇ 下載 PaGamO 題組 Excel');
    var copy = el('button', 'pgm-btn pgm-sub', '📋 下載沒反應？改複製貼上用表格');
    card.appendChild(btn); card.appendChild(msg); card.appendChild(copy);
    var steps = el('ol', 'pgm-steps');
    ['按上面的按鈕下載 Excel（已經是 PaGamO 官方題組範本，不用再開 Excel 貼上）。',
      '到 PaGamO 教師後台「批量上傳」，題型選「題組」，選這個檔案上傳。',
      '到「題目總覽」檢查題目。'].forEach(function (t) { steps.appendChild(el('li', null, t)); });
    card.appendChild(steps);
    var credit = el('p', 'pgm-credit');
    credit.appendChild(document.createTextNode('Made with ❤️ by '));
    var a = el('a', null, '阿凱老師'); a.href = 'https://cagoooo.github.io/Akai/'; a.target = '_blank'; a.rel = 'noopener noreferrer';
    credit.appendChild(a); credit.appendChild(document.createTextNode('・桃園市龍潭區石門國民小學'));
    card.appendChild(credit);
    root.appendChild(card);

    btn.onclick = function () {
      btn.disabled = true; msg.className = 'pgm-msg'; msg.textContent = '產生中…';
      download(data).then(function (name) {
        msg.className = 'pgm-msg pgm-ok'; msg.textContent = '✅ 已下載「' + name + '」，請到 PaGamO 批量上傳。';
      }).catch(function (e) {
        msg.className = 'pgm-msg pgm-err'; msg.textContent = '❌ ' + e.message + '\n可以改按下面的「複製貼上用表格」。';
      }).then(function () { btn.disabled = false; });
    };
    copy.onclick = function () {
      var t = toPasteText(data);
      var done = function () { msg.className = 'pgm-msg pgm-ok'; msg.textContent = '✅ 已複製。下載 PaGamO 官方題組範本，點選 A10 儲存格貼上，存檔後上傳。'; };
      var fail = function () {
        var ta = el('textarea'); ta.value = t; ta.style.cssText = 'width:100%;height:160px;margin-top:8px';
        card.insertBefore(ta, steps); ta.focus(); ta.select();
        msg.className = 'pgm-msg pgm-err'; msg.textContent = '這裡不能自動複製，請按 Ctrl+C 複製下面框框裡的文字，再貼到範本的 A10。';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fail); else fail();
    };
  }

  g.PagamoGemini = { version: VERSION, validate: validate, toRows: toRows, build: build, download: download, toPasteText: toPasteText, mount: mount };
})(typeof window !== 'undefined' ? window : this);
