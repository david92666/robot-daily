/* All searches stay in your browser. No analytics or remote search requests. */
function findArticles(reports, query, date) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return [...reports].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>!date||r.date===date).flatMap(r=>r.items.map((item,index)=>({item,index,date:r.date}))).filter(({item,date})=> {
    const text=[date,item.title,item.date,item.body,item.analysis,...item.sources.map(s=>s.label)].join(' ').toLocaleLowerCase();
    return terms.every(term=>text.includes(term));
  });
}
if(typeof module !== 'undefined') module.exports={findArticles};
if(typeof document !== 'undefined') {
  const query=document.getElementById('query'), date=document.getElementById('date'), results=document.getElementById('results');
  const params=new URLSearchParams(location.search); query.value=params.get('q')||''; date.value=params.get('date')||'';
  function element(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}
  function render(){
    const found=findArticles(window.REPORTS,query.value,date.value); results.replaceChildren();
    document.getElementById('count').textContent=`${found.length} 条资讯 · ${new Set(found.map(x=>x.date)).size} 期日报`;
    if(!found.length) results.append(element('p','没有找到匹配资讯。试试更短的关键词，或清除日期筛选。','empty'));
    let previous='';
    for(const {item,index,date:day} of found){
      if(day!==previous){results.append(element('h2',day,'result-date'));previous=day;}
      const card=element('article','','result-card'), link=element('a',item.title);
      link.href=`/robot-daily/reports/${day}.html#item-${index+1}`;
      const h=element('h3',''); h.append(link); card.append(h,element('p',item.date,'meta'),element('p',item.body.length>160?item.body.slice(0,160)+'…':item.body));
      card.append(element('p',item.sources.map(s=>s.label).join(' / '),'result-source')); results.append(card);
    }
    const url=new URL(location.href); query.value?url.searchParams.set('q',query.value):url.searchParams.delete('q');date.value?url.searchParams.set('date',date.value):url.searchParams.delete('date');history.replaceState(null,'',url);
  }
  query.addEventListener('input',render);date.addEventListener('change',render);document.getElementById('clear').addEventListener('click',()=>{query.value='';date.value='';render();query.focus();});render();
}
