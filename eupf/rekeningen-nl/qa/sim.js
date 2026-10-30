// Simulated users: random sessions through the comparator, checking invariants against the JSON
const {chromium}=require('playwright');const fs=require('fs');
const D=JSON.parse(fs.readFileSync(''+require('path').join(__dirname,'..','dados','rekeningen.json')+'','utf8'));
const byId={};D.contas.forEach(o=>byId[o.id]=o);
const today=new Date().toISOString().slice(0,10);
const promoOk=o=>o.promo&&(!o.promo.ate||o.promo.ate>=today)&&o.promo.m>=6;
const CH={particular:{digital:o=>o.tipo==='digital',gratis:o=>o.f.custoMes===0||promoOk(o),ibannl:o=>o.f.iban==='NL',ideal:o=>!!o.f.ideal,cartao:o=>!!(o.f.cartaoFisico&&o.f.cartaoGratis),juros:o=>o.f.jurosMax>0,numerario:o=>!!o.f.numerario},
 empresa:{digital:o=>o.tipo==='digital',gratis:o=>o.f.custoMes===0||promoOk(o),ibannl:o=>o.f.iban==='NL',tpa:o=>!!o.f.tpa,boekhouding:o=>!!o.f.boekhouding,numerario:o=>!!o.f.numerario}};
const PF={particular:['','jovem','menor','conjunta'],empresa:['','eenmanszaak','vof','bv']};
let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};const pick=a=>a[Math.floor(rnd()*a.length)];
const fails=[];const fail=(u,m)=>{fails.push('user '+u+': '+m)};
(async()=>{const b=await chromium.launch();
const N=+process.argv[2]||60;
for(let u=0;u<N;u++){
 const w=pick([320,375,390,414,768,1024,1280,1440]);
 const p=await b.newPage({viewport:{width:w,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/rekeningen-nl/qa/test.html');await p.waitForSelector('.cb-c');
 const seg=pick(['particular','empresa']);
 if(seg==='empresa')await p.click('[data-seg="empresa"]');
 const pf=pick(PF[seg]);await p.selectOption('#cb-perfil',pf);
 const chips=Object.keys(CH[seg]).filter(()=>rnd()<0.25);
 for(const c of chips)await p.click('[data-chip="'+c+'"]');
 const sort=pick(['rec','custo','juros','nome']);await p.selectOption('#cb-sort',sort);
 if(await p.$('[data-all]'))await p.click('[data-all]');
 // expected list
 let exp=D.contas.filter(o=>o.seg===seg).filter(o=>{if(!pf||pf==='jovem')return true;if(['eenmanszaak','vof','bv'].includes(pf))return !!o.f[pf];return !!(o.perfis&&o.perfis[pf])});
 const cost=o=>(['jovem','menor'].includes(pf)&&o.perfis&&o.perfis[pf])?o.perfis[pf].custoMes:o.f.custoMes;
 const vo=o=>{const v={...o,f:{...o.f}};if(['jovem','menor'].includes(pf)&&o.perfis&&o.perfis[pf]){v.f.custoMes=o.perfis[pf].custoMes;v.promo=o.perfis[pf].promo||null}return v};
 exp=exp.map(vo).filter(o=>chips.every(c=>CH[seg][c](o)));
 const ids=await p.$$eval('.cb-c',e=>e.map(x=>x.dataset.id));
 const es=new Set(exp.map(o=>o.id));
 if(ids.length!==exp.length||ids.some(i=>!es.has(i)))fail(u,`list mismatch seg=${seg} pf=${pf} chips=${chips} got=${ids} exp=${[...es]}`);
 // sort check
 const got=ids.map(i=>exp.find(o=>o.id===i)).filter(Boolean);
 for(let i=1;i<got.length;i++){const a=got[i-1],c=got[i];
  if(sort==='custo'&&a.f.custoMes>c.f.custoMes)fail(u,'sort custo '+a.id+'>'+c.id);
  if(sort==='juros'&&(a.f.jurosMax||0)<(c.f.jurosMax||0))fail(u,'sort juros '+a.id+'<'+c.id);
  if(sort==='nome'&&a.name.localeCompare(c.name,'nl')>0)fail(u,'sort nome');}
 // KPI cost matches
 for(const id of ids){const o=exp.find(x=>x.id===id);const t=await p.$eval(`.cb-c[data-id="${id}"] .cb-kpi-v`,e=>e.innerText);
  const want='€'+o.f.custoMes.toFixed(2).replace('.',',');if(t!==want)fail(u,`cost ${id} ${t} != ${want} pf=${pf}`);}
 // open details of a random card
 if(ids.length){const id=pick(ids);await p.click(`[data-more="${id}"]`);const dt=await p.$eval(`.cb-c[data-id="${id}"] .cb-c-detail`,e=>e.innerText);
  if(/undefined|NaN|null|\n-\n|Niet bevestigd/.test(dt))fail(u,'bad detail text '+id);}
 // compare view
 if(rnd()<0.6&&ids.length>=2){await p.click('[data-go="comparar"]');await p.waitForTimeout(150);
  const t=await p.$eval('#cb-view',e=>e.innerText);if(/undefined|NaN|null|Niet bevestigd/.test(t))fail(u,'bad compare text');
  const url=p.url();const q=new URL(url).searchParams;const sel=(q.get('vergelijk')||'').split(',').filter(Boolean);
  if(sel.length<1)fail(u,'no vergelijk in url '+url);
  // reload with URL and check same selection
  const p2=await b.newPage({viewport:{width:w,height:900}});await p2.goto(url);await p2.waitForTimeout(400);
  const t2=await p2.$eval('#cb-view',e=>e.innerText);for(const s of sel){if(!t2.includes(byId[s].name))fail(u,'url roundtrip missing '+s)}await p2.close();}
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>w)fail(u,`horizontal overflow ${sw}>${w}`);
 if(errs.length)fail(u,'js errors '+errs.join(';'));
 await p.close();}
await b.close();console.log('users',N,'fails',fails.length);console.log(fails.slice(0,30).join('\n'));})();
