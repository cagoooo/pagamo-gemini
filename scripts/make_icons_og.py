"""產生 favicon（ico／apple-touch／PWA 圖示）與 1200×630 社群預覽圖。
用法：python scripts/make_icons_og.py（需要 playwright 與 pillow；OG 圖會連 Google Fonts）"""
import base64, io, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
svg = (ROOT / 'favicon.svg').read_text(encoding='utf-8')
svg_uri = 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()
(ROOT / 'icons').mkdir(exist_ok=True)

ROWS = ''.join(
    f"<tr><td>{a}</td><td>{b}</td><td class=ans>{c}</td></tr>" for a, b, c in [
        ('1', '小水滴的旅行', ''), ('1_1', '小水滴先變成什麼？', 'A'), ('1_2', '雲是怎麼形成的？', 'C'),
        ('1_3', '作者想告訴我們…', 'B'), ('1_4', '比較兩種說法…', 'D')])

OG_HTML = f"""<!doctype html><meta charset=utf-8>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&display=swap" rel="stylesheet">
<style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden;font-family:'Noto Sans TC',sans-serif}}
body{{background:radial-gradient(circle at 85% 20%,#3b2a8a 0,transparent 45%),linear-gradient(135deg,#0f172a 0%,#172554 60%,#1e1b4b 100%)}}
.bar{{position:absolute;left:0;right:0;top:0;height:10px;background:linear-gradient(90deg,#2563eb,#7c3aed,#fbbf24)}}
.box{{position:absolute;left:70px;top:70px;width:640px;color:#f8fafc}}
.tag{{display:inline-block;font-weight:700;font-size:26px;color:#1e1b4b;background:#fbbf24;border-radius:10px;padding:4px 16px}}
h1{{margin:24px 0 0;font-size:82px;line-height:1.12;font-weight:900;letter-spacing:.01em}}
h1 span{{color:#93c5fd}}
h2{{margin:18px 0 0;font-size:31px;font-weight:700;color:#e2e8f0;line-height:1.45}}
.flow{{display:flex;align-items:center;gap:8px;margin-top:30px;font-size:23px;font-weight:700;white-space:nowrap}}
.flow b{{background:rgba(147,197,253,.14);border:2px solid #60a5fa;color:#dbeafe;border-radius:10px;padding:5px 12px}}
.flow b.go{{border-color:#fbbf24;color:#fde68a;background:rgba(251,191,36,.14)}}
.flow i{{font-style:normal;color:#94a3b8}}
.by{{position:absolute;left:70px;bottom:46px;font-size:24px;color:#cbd5e1;font-weight:500}}
.sheet{{position:absolute;right:70px;top:120px;width:380px;background:#fff;border-radius:22px;box-shadow:0 30px 60px rgba(0,0,0,.45);overflow:hidden;transform:rotate(3deg)}}
.sheet .hd{{background:#16a34a;color:#fff;font-weight:900;font-size:22px;padding:14px 20px}}
table{{border-collapse:collapse;width:100%;font-size:19px;color:#1f2937}}
td{{border-top:1px solid #e2e8f0;padding:10px 12px;white-space:nowrap}}
td:first-child{{color:#64748b;width:44px;border-right:1px solid #e2e8f0}}
td.ans{{font-weight:900;color:#16a34a;text-align:center;width:36px;border-left:1px solid #e2e8f0}}
.dl{{position:absolute;right:52px;top:428px;width:140px;height:140px}}
</style>
<div class=bar></div>
<div class=box>
  <span class=tag>Gemini × PaGamO</span>
  <h1>PaGamO<br><span>題組下載器</span></h1>
  <h2>Gemini 出好的閱讀題組，貼上就變成<br>可以直接上傳 PaGamO 的 Excel</h2>
  <div class=flow><b>Gemini 出題</b><i>→</i><b>貼上資料</b><i>→</i><b>下載 Excel</b><i>→</i><b class=go>上傳 PaGamO</b></div>
</div>
<div class=sheet><div class=hd>PaGamO 題組 .xlsx</div><table>{ROWS}</table></div>
<img class=dl src='{svg_uri}'>
<div class=by>阿凱老師・桃園市龍潭區石門國民小學</div>"""


def icon_html(size, maskable=False):
    pad = round(size * 0.12) if maskable else 0
    bg = '#1e1b4b' if maskable else 'transparent'
    return (f"<!doctype html><style>html,body{{margin:0;width:{size}px;height:{size}px;background:{bg}}}"
            f"img{{position:absolute;left:{pad}px;top:{pad}px;width:{size - 2 * pad}px;height:{size - 2 * pad}px}}</style>"
            f"<img src='{svg_uri}'>")


with sync_playwright() as p:
    b = p.chromium.launch()

    def shot(html, w, h, omit_bg=True):
        pg = b.new_page(viewport={'width': w, 'height': h})
        pg.set_content(html)
        pg.wait_for_load_state('networkidle')
        pg.wait_for_timeout(600)
        data = pg.screenshot(omit_background=omit_bg)
        pg.close()
        return Image.open(io.BytesIO(data)).convert('RGBA')

    big = shot(icon_html(512), 512, 512)
    for size in (192, 512):
        big.resize((size, size), Image.LANCZOS).save(ROOT / f'icons/icon-{size}.png')
    mask = shot(icon_html(512, True), 512, 512, False)
    for size in (192, 512):
        mask.resize((size, size), Image.LANCZOS).save(ROOT / f'icons/icon-{size}-maskable.png')
    # apple-touch：iOS 會自己加圓角，用滿版底色
    mask.resize((180, 180), Image.LANCZOS).convert('RGB').save(ROOT / 'apple-touch-icon.png')
    big.save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    og = shot(OG_HTML, 1200, 630, False).convert('RGB')
    og.save(ROOT / 'og-image.jpg', quality=88, optimize=True)
    b.close()
print('ok')
