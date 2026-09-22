"""Build the date archive from data/reports/YYYY-MM-DD.json. Standard library only."""
import json, re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'docs'
escape = html.escape

def page(title, body, extra=''):
    return f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><link rel="stylesheet" href="/robot-daily/style.css"><body><nav class="formats"><a href="/robot-daily/">日报资料库</a><a href="/robot-daily/document.html">文档版示例</a></nav>{body}{extra}</body></html>'

def story(item, number):
    links = ' '.join(f'<a href="{escape(s["url"], quote=True)}" target="_blank" rel="noopener noreferrer">{escape(s["label"])}</a>' for s in item['sources'])
    return f'<article class="story" id="item-{number}"><span class="story-index">{number:02}</span><div><p class="meta">{escape(item["date"])}</p><h2>{escape(item["title"])}</h2><p>{escape(item["body"])}</p><p class="analysis"><strong>研究观察</strong>{escape(item["analysis"])}</p><div class="sources">{links}</div></div></article>'

def build():
    reports = []
    for path in sorted((ROOT / 'data/reports').glob('*.json'), reverse=True):
        r = json.loads(path.read_text())
        assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', r['date']) and path.stem == r['date']
        assert r['items']
        reports.append(r)
    assert reports, 'At least one report required'
    (OUT / 'reports').mkdir(parents=True, exist_ok=True)
    for r in reports:
        content = f'<div class="layout report-layout"><aside><p>本期目录</p>'+ ''.join(f'<a href="#item-{i}">{i:02} · {escape(x["title"])}</a>' for i,x in enumerate(r['items'],1)) + '</aside><main>'
        content += f'<p class="eyebrow">HUMANOID DAILY</p><h1>人形机器人与<br>具身智能日报</h1><p class="edition">{r["date"]} · {escape(r["edition"])}<span>更新 {escape(r["updated"])} · UTC+8</span></p><p class="intro">{escape(r["intro"])}</p>'
        content += ''.join(story(x,i) for i,x in enumerate(r['items'],1))
        if r.get('coverage'):
            content += '<p class="meta">覆盖说明：'+escape(r['coverage'])+'</p>'
        content += '<section class="follow"><h2>后续跟踪</h2><ul>'+''.join(f'<li>{escape(x)}</li>' for x in r.get('followups',[]))+'</ul></section><footer>事实与研究观察分列。来源可点击核验；发布日期见各条目。</footer></main></div>'
        (OUT / 'reports' / f'{r["date"]}.html').write_text(page(f'{r["date"]} · 人形机器人与具身智能日报',content))
    latest = reports[0]
    dates = ''.join(f'<a href="/robot-daily/reports/{r["date"]}.html"><time>{r["date"]}</time><span>{len(r["items"])} 条</span></a>' for r in reports)
    options = ''.join(f'<option>{r["date"]}</option>' for r in reports)
    body = f'<div class="archive-shell"><header class="archive-header"><p class="eyebrow">HUMANOID DAILY / 日报资料库</p><h1>追踪机器人走进现实。</h1><p>人形机器人 · 具身智能 · 供应链 · 算法与论文</p><a class="latest" href="/robot-daily/reports/{latest["date"]}.html">阅读最新一期 · {latest["date"]} ↗</a></header><section class="search-panel" aria-label="检索日报"><label for="query">搜索全部历史日报</label><div class="search-row"><input id="query" type="search" placeholder="试试：启元、触觉、VLA、Figure" autocomplete="off"><select id="date" aria-label="按日报日期筛选"><option value="">全部日期</option>{options}</select><button id="clear" type="button">清除</button></div><p class="search-hint">检索标题、正文、研究观察与来源；多个关键词以空格分隔，需同时匹配。</p></section><div class="archive-grid"><aside class="date-list"><p>按日期阅读 · {len(reports)} 期</p>{dates}</aside><main class="results-main"><p id="count" role="status" aria-live="polite"></p><div id="results"></div><noscript><p>关键词检索需要启用 JavaScript。你仍可从日期目录打开每期完整日报。</p>{dates}</noscript></main></div><footer>按日报日期倒序归档 · 新闻实际发布时间在各条目中标明 · 当前共 {len(reports)} 期，持续积累</footer></div>'
    (OUT / 'index.html').write_text(page('人形机器人与具身智能日报 · 资料库',body,'<script src="/robot-daily/archive-data.js"></script><script src="/robot-daily/archive.js"></script>'))
    (OUT / 'archive-data.js').write_text('window.REPORTS='+json.dumps(reports,ensure_ascii=False).replace('<','\\u003c')+';')
    print(f'Built {len(reports)} reports, {sum(len(r["items"]) for r in reports)} articles')

if __name__ == '__main__':
    build()
