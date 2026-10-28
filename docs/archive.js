const HOT_TERMS = [
 ['智元',['智元','AGIBOT','AgiBotWorld']],['宇树',['宇树','Unitree']],['启元',['启元']],['特斯拉',['特斯拉','Tesla','Optimus']],['Figure',['Figure','Helix']],['波士顿动力',['波士顿动力','Boston Dynamics','Atlas']],['Agility',['Agility','Digit']],['英伟达',['英伟达','NVIDIA','Jetson','Isaac','Cosmos']],['小米',['小米','Xiaomi']],['优必选',['优必选','UBTECH','Walker']],['NEURA',['NEURA','4NE1']],['Sharpa',['Sharpa']],['Physical Intelligence',['Physical Intelligence']],['睿尔曼',['睿尔曼','RealMan']],['自变量',['自变量']],['鹿明',['鹿明']],['乐聚',['乐聚']],['小鹏',['小鹏','XPENG']],['FF机器人',['FFR','FFAI','FF Nova','Faraday Future']],['灵巧手',['灵巧手','仿生手']],['触觉',['触觉']],['视觉',['视觉','相机','摄像头']],['VLA',['VLA','视觉—语言—动作','视觉-语言-动作']],['世界模型',['世界模型']],['强化学习',['强化学习']],['模仿学习',['模仿学习','示范学习']],['仿真',['仿真','sim-to-real']],['数据采集',['采数','采集','数据集']],['开源',['开源','代码公开','公开代码','代码已公开']],['工业制造',['工厂','产线','工业','制造']],['家庭场景',['家庭','家务','住宅']],['零售场景',['零售','便利店','门店']],['物流仓储',['物流','仓库','仓储']],['执行器',['执行器','关节模组','减速器','丝杠']],['算力芯片',['算力','芯片','机载计算机']],['GPT-6 Astra',['GPT-6','GPT6','GPT 6','Astra']],['安全',['安全','安规']],['融资',['融资']],['遥操作',['遥操作','远程操控']],['移动操作',['移动操作','全身控制']]
].map(([label,aliases])=>({label,aliases}));
function articleText(item){return [item.title,item.body,item.analysis,...(item.sources||[]).map(s=>s.label)].join(' ').toLocaleLowerCase();}
function hasAlias(text,alias){
 const a=alias.toLocaleLowerCase();
 if(/^[a-z0-9 -]+$/.test(a)) return new RegExp('(^|[^a-z0-9])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text);
 return text.includes(a);
}
function matchesTerm(item,term){return term.aliases.some(a=>hasAlias([item.title,item.body].filter(Boolean).join(' ').toLocaleLowerCase(),a));}
function reportsInRange(reports,range){
 if(range==='all'||!reports.length)return reports;
 const end=reports.map(r=>r.date).sort().at(-1),start=new Date(end+'T00:00:00Z');
 start.setUTCDate(start.getUTCDate()-Number(range)+1);const first=start.toISOString().slice(0,10);
 return reports.filter(r=>r.date>=first&&r.date<=end);
}
function hotCounts(reports,range){const selected=reportsInRange(reports,range);return HOT_TERMS.map(term=>({...term,count:selected.reduce((n,r)=>n+r.items.filter(i=>matchesTerm(i,term)).length,0)})).filter(t=>t.count>0).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'zh-CN')).slice(0,24);}
/* All searches stay in your browser. No analytics or remote search requests. */
function findArticles(reports, query, date) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return [...reports].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>!date||r.date===date).flatMap(r=>r.items.map((item,index)=>({item,index,date:r.date}))).filter(({item,date})=> {
    const text=[date,item.title,item.date,item.body,item.analysis,...item.sources.map(s=>s.label)].join(' ').toLocaleLowerCase();
    return terms.every(term=>{const topic=HOT_TERMS.find(t=>t.label.toLocaleLowerCase()===term||t.aliases.some(a=>a.toLocaleLowerCase()===term));return topic?topic.aliases.some(a=>hasAlias(text,a)):text.includes(term);});
  });
}
if(typeof module !== 'undefined') module.exports={findArticles,reportsInRange,hotCounts,matchesTerm,HOT_TERMS};
if(typeof document !== 'undefined') {
  const query=document.getElementById('query'), date=document.getElementById('date'), results=document.getElementById('results');
  const params=new URLSearchParams(location.search); query.value=params.get('q')||''; date.value=params.get('date')||'';
  function element(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}
  const range=document.getElementById('hot-range'); let activeHot=null;
  function render(){
    const found=activeHot ? findArticles(reportsInRange(window.REPORTS,range.value),'',date.value).filter(x=>matchesTerm(x.item,activeHot)) : findArticles(window.REPORTS,query.value,date.value); results.replaceChildren();
    document.getElementById('count').textContent=`${activeHot ? `热点：${activeHot.label} · ${range.value==='all'?'全部历史':'近'+range.value+'天'} · ` : ''}${activeHot?'':'全文搜索 · 全部历史 · '}${found.length} 条资讯 · ${new Set(found.map(x=>x.date)).size} 期日报`;
    if(!found.length) results.append(element('p','没有找到匹配资讯。试试更短的关键词，或清除日期筛选。','empty'));
    let previous='';
    for(const {item,index,date:day} of found){
      if(day!==previous){results.append(element('h2',day,'result-date'));previous=day;}
      const card=element('article','','result-card'), link=element('a',item.title);
      link.href=`/robot-daily/reports/${day}.html#item-${index+1}`;
      const h=element('h3',''); h.append(link); card.append(h,element('p',item.date,'meta'),element('p',item.body.length>160?item.body.slice(0,160)+'…':item.body));
      card.append(element('p',item.sources.map(s=>s.label).join(' / '),'result-source')); results.append(card);
    }
    const url=new URL(location.href);
    activeHot?url.searchParams.set('hot',activeHot.label):url.searchParams.delete('hot');activeHot?url.searchParams.set('range',range.value):url.searchParams.delete('range'); query.value?url.searchParams.set('q',query.value):url.searchParams.delete('q');date.value?url.searchParams.set('date',date.value):url.searchParams.delete('date');history.replaceState(null,'',url);
  }
  function renderCloud(){
    const subset=reportsInRange(window.REPORTS,range.value), terms=hotCounts(window.REPORTS,range.value), cloud=document.getElementById('hot-cloud');cloud.replaceChildren();
    const days=subset.map(r=>r.date).sort();
    document.getElementById('hot-summary').textContent=days.length ? `${days[0]} — ${days.at(-1)} · ${subset.length}期 · ${subset.reduce((n,r)=>n+r.items.length,0)}条资讯（截至最新一期）` : '此范围暂无日报';
    for(const term of terms){
      const button=element('button',`${term.label} ${term.count}`,'hot-word');button.type='button';button.style.fontSize=`${13+13*Math.sqrt(term.count/terms[0].count)}px`;button.setAttribute('aria-label',`${term.label}，${term.count}条资讯，点击筛选`);button.setAttribute('aria-pressed',String(activeHot?.label===term.label));
      button.addEventListener('click',()=>{activeHot=term;query.value=term.label;date.value='';renderCloud();render();document.getElementById('count').scrollIntoView({behavior:'smooth',block:'start'});});cloud.append(button);
    }
    if(!terms.length)cloud.append(element('p','暂无匹配重点词，仍可使用下方全文搜索。'));
  }
  if(params.has('hot')){activeHot=HOT_TERMS.find(t=>t.label===params.get('hot'))||null;if(['7','30','all'].includes(params.get('range')))range.value=params.get('range');if(activeHot)query.value=activeHot.label;else if(params.get('hot')==='量产交付'&&query.value==='量产交付')query.value='';}
  range.addEventListener('change',()=>{renderCloud();render();});
  query.addEventListener('input',()=>{activeHot=null;renderCloud();render();});date.addEventListener('change',render);document.getElementById('clear').addEventListener('click',()=>{query.value='';date.value='';activeHot=null;renderCloud();render();query.focus();});renderCloud();render();
}
