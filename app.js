/* ============ UTILS ============ */
const DAYS=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì"];
const MONTHS=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const MONTHS_LONG=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const ROLE={main:"Piatto principale",base:"Base",side:"Contorno",scorta:"Scorta da freezer",dolce:"Dolce"};
const PARTS=["m","b","s"];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const euro=n=>"€ "+n.toFixed(2).replace(".",",");
const euroD=(a,b)=>Math.abs(a-b)<.005?euro(a):`€ ${a.toFixed(2).replace(".",",")}–${b.toFixed(2).replace(".",",")}`;
const euroR=(a,b)=>Math.abs(a-b)<.05?euro(a):`€ ${a.toFixed(0)}–${Math.ceil(b).toFixed(0)}`;
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function nextMonday(from=new Date()){const d=new Date(from.getFullYear(),from.getMonth(),from.getDate(),12);const wd=d.getDay();d.setDate(d.getDate()+(wd===1?0:(8-wd)%7));return iso(d)}
function addDays(s,n){const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d}
function addMonths(s,n){const d=new Date(s+"T12:00:00");d.setMonth(d.getMonth()+n);return d}
const fmtDate=d=>d.toLocaleDateString("it-IT",{day:"numeric",month:"short"});
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function uid(p="r"){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clone=o=>JSON.parse(JSON.stringify(o));

/* ============ STATE + MIGRAZIONE ============ */
const KEY="mealprep-app-v3", OLD_KEY="mealprep-app-v2";
const OLD_LIB_IDS=["farro","orzo","riso","couscous","pasta","pane","verd_aut","verd_inv","verd_est","piselli","slaw","spinaci","fagiolini","insalata","pomodori","merluzzo","merluzzo_piselli","polp_merluzzo","polp_tonno","dahl","chili","lenticchie","cannellini_tonno","frit_zucchine","frit_broccoli","frit_asparagi","torta_spinaci","tofu","sugo_sgombro","sardine","peperoni_ripieni","parmigiana","zuppa_ceci","vellutata_zucca"];
const RENAMED={chili:"stufato"}, REMOVED=["pomodori"];
function emptySlot(){return{m:null,b:null,s:null,k:null,x:[],n:""}}
function emptyWeek(){return DAYS.map(()=>({p:emptySlot(),c:emptySlot()}))}
function defaults(){return{v:3,libVersion:LIB_VERSION,recipes:clone(LIB),week:null,weekStart:null,extras:[{q:"",n:"sale, pepe, olio EVO",r:"Basi"},{q:"",n:"spezie dolci (curcuma, cumino, paprika dolce, origano)",r:"Basi"}],have:[],history:[],stock:[],addons:[],prices:{},planView:"list",filter:"tutte",seed:1,leftoverDone:[]}}
function mapId(id){if(!id)return null;if(RENAMED[id])return RENAMED[id];if(REMOVED.includes(id))return null;return id}
function mergeLib(st){ // aggiunge ricette nuove e aggiorna quelle non modificate da te
  const libIds=new Set(LIB.map(r=>r.id));
  const out=[];const seen=new Set();
  st.recipes.forEach(r=>{
    const id=mapId(r.id);if(!id)return;
    if(libIds.has(id)){const lib=LIB.find(l=>l.id===id);out.push(r.edited?{...clone(lib),...r,id}: {...clone(lib),fav:!!r.fav,photo:r.photo||null});}
    else if(!OLD_LIB_IDS.includes(r.id)) out.push({spicy:false,dairy:false,temp:0,needsBase:"",months:M("all"),fridgeDays:3,freezer:false,...r,atMoment:false});
    seen.add(id);
  });
  LIB.forEach(l=>{if(!seen.has(l.id))out.push(clone(l))});
  st.recipes=out;st.libVersion=LIB_VERSION;
}
function load(){
  let st=null;
  try{st=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(st&&st.recipes){if((st.libVersion||0)<LIB_VERSION)mergeLib(st);return st}
  let old=null;try{old=JSON.parse(localStorage.getItem(OLD_KEY))}catch(e){}
  if(old&&old.recipes){
    const st=defaults();st.recipes=old.recipes;mergeLib(st);
    st.weekStart=old.weekStart||null;st.have=old.have||[];st.seed=old.seed||1;st.planView=old.planView||"list";
    st.extras=(old.extras&&old.extras.length?old.extras:st.extras);
    st.week=old.week?old.week.map(d=>({p:{...emptySlot(),...d.p,m:mapId(d.p.m),b:mapId(d.p.b),s:mapId(d.p.s),k:null},c:{...emptySlot(),...d.c,m:mapId(d.c.m),b:mapId(d.c.b),s:mapId(d.c.s),k:null}})):null;
    st.history=(old.history||[]).map(h=>({...h,ids:h.ids.map(mapId).filter(Boolean)}));
    return st;
  }
  return defaults();
}
let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){toast("Memoria piena: togli qualche foto o esporta un backup");return false}}
const R=id=>S.recipes.find(r=>r.id===id);
const B=id=>BOOSTERS.find(b=>b.id===id);
const weekMonth=()=>addDays(S.weekStart,0).getMonth()+1;
const inSeason=(r,m)=>!r.months||!r.months.length||r.months.includes(m);
function monthsLabel(ms){if(!ms||ms.length>=12)return "tutto l'anno";const set=new Set(ms);const runs=[];ms.slice().sort((a,b)=>a-b).forEach(m=>{if(!set.has(m===1?12:m-1)){let e=m;while(set.has(e%12+1)&&e%12+1!==m)e=e%12+1;runs.push(MONTHS[m-1]+(e!==m?"–"+MONTHS[e-1]:""))}});return runs.join(", ")||"tutto l'anno"}

/* ============ SETTIMANA: MODELLO ============ */
function eachUse(week,fn){week.forEach((d,i)=>["p","c"].forEach(meal=>PARTS.forEach(k=>{const id=d[meal][k];if(id&&R(id))fn(R(id),i+1,meal,k)})))}
function usage(week=S.week){const u={};eachUse(week,(r,day,meal)=>{(u[r.id]=u[r.id]||[]).push({day,meal})});return u}
function status(r,day){
  if(r.id==="pane"&&day<=r.fridgeDays) return{k:"pn",t:"dispensa"};
  if(day<=r.fridgeDays) return{k:"fr",t:day===r.fridgeDays?"frigo · ultimo giorno":"frigo"};
  if(r.freezer) return{k:"fz",t:"dal freezer"};
  return{k:"bad",t:`dura ${r.fridgeDays} gg, non congelabile`};
}
function slotProtein(s){let p=0;PARTS.forEach(k=>{const r=s[k]&&R(s[k]);if(r)p+=+r.protein||0});if(s.k&&R(s.k))p+=+R(s.k).protein||0;(s.x||[]).forEach(id=>{const b=B(id);if(b)p+=b.protein});return p}
const dayProtein=d=>slotProtein(d.p)+slotProtein(d.c);

/* ============ SPESA + COSTO ============ */
const FR={"½":.5,"¼":.25,"¾":.75};
function parseQ(q){const x=String(q||"").trim().match(/^([\d.,]+|½|¼|¾)\s*(.*)$/);if(!x)return null;return{n:FR[x[1]]??parseFloat(x[1].replace(",",".")),u:x[2].trim()}}
function scaleQ(q,m){if(m===1||!q)return q;const p=parseQ(q);if(!p)return `${q} ×${m}`;return `${String(Math.round(p.n*m*100)/100).replace(".",",")} ${p.u}`.trim()}
function mergeQ(list){const groups=new Map(),other=[];list.filter(Boolean).forEach(q=>{const p=parseQ(q);if(!p){other.push(q);return}const k=p.u.slice(0,5).toLowerCase();const g=groups.get(k)||{n:0,u:p.u,max:0};g.n+=p.n;if(p.n>=g.max){g.max=p.n;g.u=p.u}groups.set(k,g)});
  return[...[...groups.values()].map(g=>`${String(Math.round(g.n*100)/100).replace(".",",")} ${g.u}`.trim()),...other].join(" + ")}
function canon(q){ // -> {n, u} in unità canoniche
  const p=parseQ(q);if(!p)return null;const u=p.u.toLowerCase();
  if(/^kg\b/.test(u))return{n:p.n*1000,u:"g"};if(/^g\b/.test(u))return{n:p.n,u:"g"};
  if(/^l\b/.test(u))return{n:p.n*1000,u:"ml"};if(/^cl\b/.test(u))return{n:p.n*10,u:"ml"};if(/^ml\b/.test(u))return{n:p.n,u:"ml"};
  if(/^cucchiain/.test(u))return{n:p.n*4,u:"g"};if(/^cucchia/.test(u))return{n:p.n*10,u:"g"};
  if(/^spicch/.test(u))return{n:p.n,u:"spicch"};if(/^cost/.test(u))return{n:p.n,u:"costa"};
  if(/^cm\b/.test(u))return{n:p.n,u:"cm"};
  return{n:p.n,u:"pz"};
}
function priceEntry(name){const k=name.trim().toLowerCase();return S.prices[k]||PRICES[k]||null}
function itemCost(it){
  const e=priceEntry(it.n);if(!e)return null;
  let tot=0,mismatch=false;it.q.forEach(q=>{const c=canon(q);if(!c||(c.u!==e.unit&&e.unit!=="pack")){mismatch=true;return}tot+=c.n});
  if(e.unit==="pack")return{min:e.min,max:e.max,packs:1,e};
  let packs;
  if(e.bulk){packs=tot/e.size;if(mismatch&&packs===0)packs=1}
  else{packs=Math.ceil(tot/e.size-1e-9);if(mismatch)packs=Math.max(packs,1);if(packs<1)packs=1}
  return{min:e.min*packs,max:e.max*packs,packs,e};
}
function aggregate(week,addons,extras,boostersFromWeek=true){
  const u=usage(week),map=new Map();
  const add=(i,q,src)=>{const k=i.n.trim().toLowerCase();if(!k)return;const e=map.get(k)||{n:i.n,r:i.r||"Dispensa",q:[],src:new Set()};if(q)e.q.push(q);e.src.add(src);map.set(k,e)};
  Object.entries(u).forEach(([id,list])=>{const r=R(id);const m=Math.ceil(list.length/Math.max(1,r.portions));r.ing.forEach(i=>add(i,scaleQ(i.q,m),r.name.split(" ")[0].replace(/[,.;']$/,"")))});
  (addons||[]).forEach(id=>{const r=R(id);if(r)r.ing.forEach(i=>add(i,i.q,r.name.split(" ")[0]))});
  if(boostersFromWeek){const bc={};week.forEach(d=>["p","c"].forEach(meal=>(d[meal].x||[]).forEach(id=>bc[id]=(bc[id]||0)+1)));
    Object.entries(bc).forEach(([id,n])=>{const b=B(id);if(b)add(b.ing,scaleQ(b.ing.q,n),"aggiunte")})}
  (extras||[]).forEach(i=>add(i,i.q,"extra"));
  return[...map.entries()].map(([k,v])=>({k,...v,src:[...v.src]}));
}
const shopItems=()=>aggregate(S.week,S.addons,S.extras);
function costOf(items,have=new Set()){let min=0,max=0,unknown=0;items.forEach(it=>{if(have.has(it.k)||it.r==="Basi")return;const c=itemCost(it);if(!c){unknown++;return}min+=c.min;max+=c.max});return{min,max,unknown}}
const shopKeys=(week,addons=[])=>new Set(aggregate(week,addons,[]).filter(i=>i.r!=="Basi").map(i=>i.k));
function jaccard(a,b){if(!a.size&&!b.size)return 1;let i=0;a.forEach(x=>b.has(x)&&i++);return i/(a.size+b.size-i)}

/* ============ GENERATORE ============ */
function generateWeek(weekStart,seed){
  const month=addDays(weekStart,0).getMonth()+1;
  const rnd=mulberry(seed*9973+Number(weekStart.replace(/-/g,"")));
  const prev=S.history[0]||null,prevIds=new Set(prev?prev.ids:[]),prevKeys=new Set(prev?prev.keys:[]);
  const recent=new Map();S.history.slice(0,3).forEach((h,k)=>h.ids.forEach(id=>recent.set(id,(recent.get(id)||0)+(3-k))));
  const pool=S.recipes.filter(r=>inSeason(r,month)&&!r.spicy);
  const mains=pool.filter(r=>r.role==="main"),bases=pool.filter(r=>r.role==="base"),sides=pool.filter(r=>r.role==="side");
  if(mains.length<2||!bases.length)return{week:emptyWeek(),note:"Servono almeno 2 piatti principali e una base di stagione nel ricettario."};
  const weight=r=>(r.fav?2.2:1)/(1+(recent.get(r.id)||0)*.6);
  const pick=(arr,ex)=>{const c=arr.filter(r=>!ex.has(r.id));if(!c.length)return null;const tot=c.reduce((a,r)=>a+weight(r),0);let x=rnd()*tot;for(const r of c){x-=weight(r);if(x<=0)return r}return c[c.length-1]};
  const ok=(r,day)=>day<=r.fridgeDays||r.freezer;
  let best=null;
  for(let att=0;att<500;att++){
    const chosen=[],ex=new Set();let por=0,overlap=0;const want=rnd()<.7?4:3;
    while((por<10||chosen.length<want)&&chosen.length<5){const r=pick(mains,ex);if(!r)break;ex.add(r.id);if(prevIds.has(r.id)){if(overlap>=1)continue;overlap++}chosen.push(r);por+=r.portions}
    if(por<10)continue;
    let tokens=[];chosen.forEach(r=>{for(let i=0;i<r.portions;i++)tokens.push(r)});
    tokens.sort((a,b)=>(a.freezer-b.freezer)||(a.fridgeDays-b.fridgeDays)||(rnd()-.5));
    while(tokens.length>10){const k=tokens.map(t=>t.freezer).lastIndexOf(true);if(k<0)break;tokens.splice(k,1)}
    if(tokens.length>10)continue;
    tokens.sort((a,b)=>a.fridgeDays-b.fridgeDays||(rnd()-.5));
    const slots=new Array(10).fill(null);let valid=true;const rest=tokens.slice();
    for(let i=0;i<10;i++){const day=Math.floor(i/2)+1,other=i%2?slots[i-1]:null;
      let k=rest.findIndex(t=>ok(t,day)&&t!==other&&t!==slots[i-1]);if(k<0)k=rest.findIndex(t=>ok(t,day)&&t!==other);
      if(k<0){valid=false;break}slots[i]=rest.splice(k,1)[0]}
    if(!valid)continue;
    const bx=new Set(),bList=[];const b1=pick(bases,bx);if(b1){bList.push(b1);bx.add(b1.id)}const b2=pick(bases,bx);if(b2){bList.push(b2);bx.add(b2.id)}
    const sx=new Set(),sList=[];const cooked=sides.filter(s=>s.equip!=="nessuno"),raw=sides.filter(s=>s.equip==="nessuno");
    const s1=pick(cooked.length?cooked:sides,sx);if(s1){sList.push(s1);sx.add(s1.id)}const s2=pick(raw.length?raw:sides,sx)||pick(sides,sx);if(s2){sList.push(s2);sx.add(s2.id)}
    const week=emptyWeek();
    for(let i=0;i<10;i++){const day=Math.floor(i/2)+1,meal=i%2?"c":"p",slot=week[day-1][meal],m=slots[i];slot.m=m.id;
      if(m.needsBase&&R(m.needsBase))slot.b=m.needsBase;
      else if(m.id!=="peperoni_ripieni"){const st=day+(meal==="c"?1:0);for(let t=0;t<bList.length;t++){const b=bList[(st+t)%bList.length];if(ok(b,day)){slot.b=b.id;break}}}
      if(!/zuppa|vellutata/.test(m.id)||rnd()<.4){const st=day+(meal==="p"?1:0);for(let t=0;t<sList.length;t++){const s=sList[(st+t)%sList.length];if(ok(s,day)){slot.s=s.id;break}}}
    }
    let boosts=0;const bOrder=BOOSTERS.slice().sort(()=>rnd()-.5);let bo=0;
    week.forEach(d=>{let g=0;while(dayProtein(d)<PROT_TARGET&&g++<4){let meal=slotProtein(d.p)<=slotProtein(d.c)?"p":"c";if(d[meal].x.length>=2)meal=meal==="p"?"c":"p";if(d[meal].x.length>=2)break;d[meal].x.push(bOrder[bo++%bOrder.length].id);boosts++}});
    const keys=shopKeys(week);const sim=prev?jaccard(keys,prevKeys):0;
    if(prev&&sim>.6)continue;
    const ids=new Set();eachUse(week,r=>ids.add(r.id));const sunday=[...ids].map(R);
    const temps=new Set(sunday.filter(r=>r.equip==="forno").map(r=>r.temp)).size;
    const ovenMin=sunday.filter(r=>r.equip==="forno").reduce((a,r)=>a+r.cookMin,0);
    const handMin=sunday.reduce((a,r)=>a+r.prepMin,0);
    let consec=0;for(let i=1;i<10;i++)if(slots[i]===slots[i-1])consec++;
    const cnt={};slots.forEach(t=>cnt[t.id]=(cnt[t.id]||0)+1);const overuse=Object.values(cnt).reduce((a,c)=>a+Math.max(0,c-3),0);
    const fw=chosen.map(r=>r.name.split(" ")[0].toLowerCase());const samey=fw.length-new Set(fw).size;
    const noFish=chosen.some(r=>r.ing.some(i=>i.r==="Pesce"))?0:1;
    const lentils=Math.max(0,chosen.filter(r=>r.ing.some(i=>/lenticch/.test(i.n))).length-1);
    const dairy=Math.max(0,chosen.filter(r=>r.dairy).length-1);
    const favs=[...ids].filter(id=>R(id).fav).length;
    const rec=[...ids].reduce((a,id)=>a+(recent.get(id)||0),0);
    const cost=costOf(aggregate(week,[],[]));const costMid=(cost.min+cost.max)/2;
    const score=dairy*15+noFish*9+lentils*6+overuse*8+samey*7+boosts*3+Math.max(0,sunday.length-8)*12+Math.max(0,temps-2)*12+Math.max(0,ovenMin-120)*.3+Math.max(0,handMin-100)*.4+consec*3-favs*2+rec*1.5+sim*20+costMid*.35+rnd();
    if(!best||score<best.score)best={score,week,sim};
  }
  if(!best)return{week:emptyWeek(),note:"Non trovo una combinazione valida con le ricette di stagione: aggiungine qualcuna."};
  return best;
}
function archiveCurrent(){
  if(!S.week||!S.weekStart)return;
  // consuma dalle scorte i sughi usati nella settimana
  S.week.forEach(d=>["p","c"].forEach(m=>{const k=d[m].k;if(k)takeStock(k,1)}));
  S.history.unshift({weekStart:S.weekStart,ids:[...new Set(Object.keys(usage()))],keys:[...shopKeys(S.week)]});
  S.history=S.history.slice(0,6);S.addons=[];
}
function newWeekFor(ws){S.weekStart=ws;S.seed=1;const g=generateWeek(ws,S.seed);S.week=g.week;S.have=[];save();if(g.note)toast(g.note)}
function autoWeek(){
  const today=new Date();
  if(!S.week||!S.weekStart){newWeekFor(nextMonday(today));return}
  const fri=addDays(S.weekStart,4);fri.setHours(23,59);
  if(today>fri){archiveCurrent();newWeekFor(nextMonday(today));setTimeout(()=>toast("Nuova settimana pronta"),400)}
}

/* ============ SCORTE (magazzino) ============ */
function stockCount(rid,where){return S.stock.filter(s=>s.rid===rid&&(!where||s.where===where)).reduce((a,s)=>a+s.n,0)}
function plannedK(rid){let n=0;S.week.forEach(d=>["p","c"].forEach(m=>{if(d[m].k===rid)n++}));return n}
function addStock(rid,n,where,date){const r=R(rid);const d=date||iso(new Date());let exp;
  if(r&&r.role==="dolce"){const st=r.store||{};exp=where==="freezer"?iso(addMonths(d,st.freezer||3)):iso(addDays(d,where==="frigo"?(st.frigo||4):(st.dispensa||3)))}
  else exp=iso(addMonths(d,(r&&r.freezerMonths)||3));
  S.stock.push({id:uid("s"),rid,name:r?r.name:rid,n,where:where||"freezer",date:d,exp});save()}
function takeStock(rid,n){let left=n;S.stock.filter(s=>s.rid===rid).sort((a,b)=>a.exp.localeCompare(b.exp)).forEach(s=>{const t=Math.min(s.n,left);s.n-=t;left-=t});S.stock=S.stock.filter(s=>s.n>0)}

/* ============ NAV ============ */
const TITLES={settimana:"Settimana",spesa:"Lista della spesa",piano:"Piano di lavoro",ricette:"Ricette",scorte:"Scorte da freezer",dolci:"Dolci che durano",guida:"Guida frigo"};
let view="settimana",backTo="ricette";
function show(v){
  view=v;Object.keys(TITLES).forEach(k=>document.getElementById("v-"+k).hidden=k!==v);
  document.querySelectorAll("nav.tabbar button").forEach(b=>b.setAttribute("aria-current",b.dataset.v===v?"page":"false"));
  document.getElementById("viewTitle").textContent=TITLES[v];
  document.getElementById("guideBtn").hidden=v==="guida";
  ({settimana:renderWeek,spesa:renderShop,piano:renderPlan,ricette:showList,scorte:renderScorte,dolci:renderDolci,guida:renderGuide})[v]();
  window.scrollTo(0,0);
}
document.querySelectorAll("nav.tabbar button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.v)));
document.getElementById("guideBtn").addEventListener("click",()=>show("guida"));
function renderLabel(){document.getElementById("weekLabel").textContent=`${fmtDate(addDays(S.weekStart,0))} – ${fmtDate(addDays(S.weekStart,4))}`}

/* ============ VISTA SETTIMANA ============ */
function optList(role,sel){const m=weekMonth();const rs=S.recipes.filter(r=>r.role===role&&!r.spicy).sort((a,b)=>inSeason(b,m)-inSeason(a,m)||a.name.localeCompare(b.name));
  return `<option value="">— nessuno —</option>`+rs.map(r=>`<option value="${r.id}"${r.id===sel?" selected":""}>${esc(r.name)}${inSeason(r,m)?"":" (fuori stagione)"} · ${r.protein} g</option>`).join("")}
function stockOpts(sel){const rids=[...new Set(S.stock.filter(s=>s.where==="freezer").map(s=>s.rid))];if(sel&&!rids.includes(sel))rids.push(sel);
  return `<option value="">— nessuno —</option>`+rids.map(id=>{const r=R(id);const avail=stockCount(id,"freezer")-plannedK(id)+(id===sel?1:0);return `<option value="${id}"${id===sel?" selected":""}>${esc(r?r.name:id)} (${Math.max(0,avail)} in freezer)</option>`}).join("")}
function renderCostBox(el){const c=costOf(shopItems(),new Set(S.have));el.innerHTML=`<div><div class="eyebrow">Spesa stimata alla Coop</div><div class="big num">${euroR(c.min,c.max)}</div></div><div class="small muted" style="max-width:34ch">${c.unknown?`${c.unknown} articoli senza prezzo · `:""}esclusi quelli che hai spuntato come già in casa</div>`}
function renderWeek(){
  renderLabel();const m=weekMonth();
  document.getElementById("weekIntro").innerHTML=`Settimana di <b>${MONTHS_LONG[m-1]}</b>: solo ricette di stagione e non piccanti, almeno ${PROT_MIN} g di proteine al giorno tra pranzo e cena, latticini animali al massimo in un piatto, e una spesa diversa dalla settimana precedente.`;
  renderCostBox(document.getElementById("weekCost"));
  const hasStock=S.stock.some(s=>s.where==="freezer");
  document.getElementById("days").innerHTML=S.week.map((d,i)=>{
    const tot=dayProtein(d),pct=Math.min(100,tot/90*100);
    return `<div class="day"><h3>${DAYS[i]}<span>${fmtDate(addDays(S.weekStart,i))}</span></h3>
    <div class="daybar"><div class="track"><div class="band" style="left:${PROT_MIN/90*100}%;width:${(PROT_MAX-PROT_MIN)/90*100}%"></div><div class="fill${tot<PROT_MIN?" low":""}" style="width:${pct}%"></div></div><div class="txt"><span>proteine del giorno</span><b class="num">${tot} g</b></div></div>
    ${["p","c"].map(meal=>{const s=d[meal];
      const line=(k,lab,role)=>{const r=s[k]&&R(s[k]);const st=r?status(r,i+1):null;
        return `<div class="line"><span class="lab">${lab}</span><div class="sel"><select data-k="${k}" aria-label="${lab}, ${DAYS[i]} ${meal==="p"?"pranzo":"cena"}">${optList(role,s[k])}</select>${st?`<div><span class="tape ${st.k}">${esc(st.t)}</span></div>`:""}</div></div>`};
      return `<div class="slot" data-d="${i}" data-m="${meal}"><div class="row" style="justify-content:space-between"><span class="when">${meal==="p"?"Pranzo":"Cena"}</span><span class="prot num">${slotProtein(s)} g proteine</span></div>
        ${line("m","Piatto","main")}${line("b","Base","base")}${line("s","Contorno","side")}
        ${hasStock||s.k?`<div class="line"><span class="lab">Sugo</span><div class="sel"><select data-kk="1" aria-label="Sugo dalle scorte">${stockOpts(s.k)}</select>${s.k?`<div><span class="tape fz">dalle scorte</span></div>`:""}</div></div>`:""}
        <div class="row">${(s.x||[]).map((id,k)=>{const b=B(id);return b?`<span class="boost">+ ${esc(b.name)} (${b.ing.q}) · ${b.protein} g<button type="button" data-bx="${k}" aria-label="Togli">×</button></span>`:""}).join("")}
          <select class="addx" aria-label="Aggiungi proteine" style="width:auto;font-size:14px;padding:4px 6px"><option value="">+ proteine</option>${BOOSTERS.map(b=>`<option value="${b.id}">${esc(b.name)} (+${b.protein} g)</option>`).join("")}</select></div>
        <input class="note" type="text" placeholder="Note" value="${esc(s.n)}" aria-label="Note">
      </div>`}).join("")}</div>`}).join("");
  document.querySelectorAll(".slot").forEach(el=>{
    const s=S.week[+el.dataset.d][el.dataset.m];
    el.querySelectorAll("select[data-k]").forEach(sel=>sel.addEventListener("change",()=>{s[sel.dataset.k]=sel.value||null;save();renderWeek()}));
    const kk=el.querySelector("select[data-kk]");kk&&kk.addEventListener("change",()=>{s.k=kk.value||null;save();renderWeek()});
    el.querySelectorAll("[data-bx]").forEach(b=>b.addEventListener("click",()=>{s.x.splice(+b.dataset.bx,1);save();renderWeek()}));
    el.querySelector(".addx").addEventListener("change",e=>{if(!e.target.value)return;s.x.push(e.target.value);save();renderWeek()});
    el.querySelector("input.note").addEventListener("change",e=>{s.n=e.target.value;save()});
  });
  renderAddons();renderChecks();
}
function renderAddons(){
  const el=document.getElementById("addonsBox");
  if(!S.addons.length){el.innerHTML="";return}
  el.innerHTML=`<div class="panel stack"><h3>In programma domenica, oltre ai pasti</h3>${S.addons.map((id,i)=>{const r=R(id);if(!r)return"";
    const where=r.role==="dolce"?Object.entries(r.store||{}).filter(([,v])=>v>0).map(([w])=>w):["freezer"];
    return `<div class="stockrow"><div><b>${esc(r.name)}</b><div class="sub">${ROLE[r.role]} · ${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}</div></div>
      <div class="row">${where.map(w=>`<button class="btn sm" type="button" data-done="${i}" data-w="${w}">Fatto → ${w}</button>`).join("")}<button class="btn ghost sm" type="button" data-rm="${i}" aria-label="Togli">×</button></div></div>`}).join("")}
    <p class="small muted">Gli ingredienti sono già nella lista della spesa e i tempi nel piano. Quando l'hai preparato, tocca "Fatto" per metterlo nelle scorte.</p></div>`;
  el.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>{S.addons.splice(+b.dataset.rm,1);save();renderWeek()}));
  el.querySelectorAll("[data-done]").forEach(b=>b.addEventListener("click",()=>{const id=S.addons[+b.dataset.done];const r=R(id);addStock(id,r.portions,b.dataset.w);S.addons.splice(+b.dataset.done,1);save();toast(`${r.name}: ${r.portions} in ${b.dataset.w}`);renderWeek()}));
}
function renderChecks(){
  const u=usage(),moves={},warns=[],extra=[];
  Object.entries(u).forEach(([id,list])=>{const r=R(id);
    list.forEach(x=>{const st=status(r,x.day);
      if(st.k==="fz")(moves[x.day-1]=moves[x.day-1]||new Set()).add(r.name);
      if(st.k==="bad")warns.push(`<b>${esc(r.name)}</b> ${DAYS[x.day-1].toLowerCase()}: dura ${r.fridgeDays} giorni e non si congela. Spostala prima nella settimana.`)});
    const batches=Math.ceil(list.length/Math.max(1,r.portions)),left=batches*r.portions-list.length;
    if(batches>1)warns.push(`<b>${esc(r.name)}</b> serve ${list.length} volte e rende ${r.portions} porzioni: nella spesa le dosi sono ×${batches}.`);
    if(left>0&&r.role==="main")extra.push({r,left});
  });
  S.week.forEach((d,i)=>["p","c"].forEach(meal=>{const k=d[meal].k;if(k)(moves[i]=moves[i]||new Set()).add((R(k)||{name:k}).name+" (scorta)")}));
  S.week.forEach((d,i)=>{const p=dayProtein(d);if(p<PROT_MIN)warns.push(`<b>${DAYS[i]}</b>: ${p} g di proteine, sotto i ${PROT_MIN}. Aggiungi una fonte proteica.`)});
  const over=[...new Set(S.week.flatMap(d=>[d.p.k,d.c.k]).filter(Boolean))].filter(id=>plannedK(id)>stockCount(id,"freezer"));
  over.forEach(id=>warns.push(`<b>${esc((R(id)||{}).name||id)}</b>: in settimana ne usi ${plannedK(id)}, in freezer ne hai ${stockCount(id,"freezer")}.`));
  if(S.week.some(d=>[d.p,d.c].filter(s=>s.m&&R(s.m)&&R(s.m).dairy).length))if(new Set(S.week.flatMap(d=>[d.p.m,d.c.m]).filter(id=>id&&R(id)&&R(id).dairy)).size>1)warns.push("Più di un piatto con latticini animali questa settimana.");
  const prev=S.history[0];
  if(prev){const sim=jaccard(shopKeys(S.week,S.addons),new Set(prev.keys));if(sim>.6)warns.push(`La spesa è molto simile a quella della settimana precedente (${Math.round(sim*100)}% di ingredienti in comune). Cambia qualche piatto.`)}
  let h="";
  if(warns.length)h+=`<div class="warnbox"><h4>Da controllare</h4><ul>${warns.map(w=>`<li>${w}</li>`).join("")}</ul></div>`;
  const mk=Object.keys(moves).map(Number).sort((a,b)=>a-b);
  if(mk.length)h+=`<div class="moves">${mk.map(k=>`<div class="move"><div class="eyebrow">Sera di trasloco</div><h4>${k===0?"Domenica":DAYS[k-1]} sera: dal freezer al frigo</h4><ul>${[...moves[k]].map(x=>`<li>1 porzione di ${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>`;
  if(extra.length){const tag=S.weekStart;h+=`<div class="okbox stack"><div><b>Porzioni extra</b> che avanzano a fine settimana:</div>${extra.map(({r,left})=>{const done=S.leftoverDone.includes(tag+r.id);
    return `<div class="row" style="justify-content:space-between"><span>${left} × ${esc(r.name)}${r.freezer?"":" (non congelabile: mangiala entro "+r.fridgeDays+" gg)"}</span>${r.freezer?(done?`<span class="small muted">nelle scorte</span>`:`<button class="btn sm" type="button" data-left="${r.id}" data-n="${left}">Metti nelle scorte</button>`):""}</div>`}).join("")}</div>`}
  const el=document.getElementById("weekChecks");el.innerHTML=h;
  el.querySelectorAll("[data-left]").forEach(b=>b.addEventListener("click",()=>{const id=b.dataset.left;addStock(id,+b.dataset.n,"freezer",iso(addDays(S.weekStart,-1)));S.leftoverDone.push(S.weekStart+id);save();toast("Aggiunte alle scorte");renderWeek()}));
}
let regenArmed=false;
document.getElementById("regen").addEventListener("click",e=>{
  if(!regenArmed){regenArmed=true;e.target.textContent="Tocca di nuovo: sostituisce la settimana";setTimeout(()=>{regenArmed=false;e.target.textContent="Genera un'altra proposta"},3500);return}
  regenArmed=false;e.target.textContent="Genera un'altra proposta";S.seed=(S.seed||1)+1;const g=generateWeek(S.weekStart,S.seed);S.week=g.week;S.have=[];save();renderWeek();toast(g.note||"Nuova proposta");
});

/* ============ VISTA SPESA ============ */
let editingPrice=null;
function renderShop(){
  const items=shopItems(),have=new Set(S.have),todo=items.filter(i=>!have.has(i.k)).length;
  renderCostBox(document.getElementById("shopCost"));
  const prev=S.history[0];
  document.getElementById("shopDiff").innerHTML=prev?(()=>{const cur=shopKeys(S.week,S.addons);const old=new Set(prev.keys);const nw=[...cur].filter(k=>!old.has(k)).length;return `<div class="infobox small">Rispetto alla settimana precedente: <b>${nw} ingredienti nuovi</b> su ${cur.size}.</div>`})():"";
  let h=`<div class="eyebrow">${todo} da comprare · ${items.length-todo} già in casa</div>`;
  REPARTI.forEach(rep=>{const its=items.filter(i=>i.r===rep);if(!its.length)return;
    h+=`<div class="rep">${rep==="Basi"?"Basi: probabilmente le hai già (non nel costo)":rep}</div>`+its.map(i=>{const c=rep==="Basi"?null:itemCost(i);const e=priceEntry(i.n);
      return `<div class="item${have.has(i.k)?" have":""}"><input type="checkbox" id="s-${esc(i.k)}" data-k="${esc(i.k)}" ${have.has(i.k)?"checked":""}><label for="s-${esc(i.k)}">${esc(i.n)}</label><span class="qty">${esc(mergeQ(i.q))}</span>
      <div class="src"><span>${esc(i.src.join(" · "))}</span>${rep==="Basi"?"":`<button class="price" type="button" data-pk="${esc(i.k)}">${c?`${euroD(c.min,c.max)}${c.e.bulk?"":` · ${c.packs} conf.`}`:"aggiungi prezzo"}</button>`}</div>
      ${editingPrice===i.k?`<div class="priceedit"><label>Confezione<input type="text" id="pe-size" value="${e?esc(e.unit==="pack"?"1":`${e.size} ${e.unit==="pz"?"pz":e.unit}`):""}" placeholder="500 g"></label><label>Prezzo €<input type="number" step="0.01" min="0" id="pe-price" value="${e?((e.min+e.max)/2).toFixed(2):""}"></label><button class="btn sm" type="button" id="pe-save">Salva</button></div>`:""}</div>`}).join("")});
  if(!items.length)h+=`<p class="muted" style="margin-top:8px">La settimana è vuota.</p>`;
  h+=`<p class="small muted" style="margin-top:12px">${PRICE_SOURCE}</p>`;
  const el=document.getElementById("shop");el.innerHTML=h;
  el.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.addEventListener("change",()=>{const s=new Set(S.have);cb.checked?s.add(cb.dataset.k):s.delete(cb.dataset.k);S.have=[...s];save();renderShop()}));
  el.querySelectorAll("[data-pk]").forEach(b=>b.addEventListener("click",()=>{editingPrice=editingPrice===b.dataset.pk?null:b.dataset.pk;renderShop()}));
  const ps=el.querySelector("#pe-save");ps&&ps.addEventListener("click",()=>{const c=canon(el.querySelector("#pe-size").value||"1");const p=parseFloat(String(el.querySelector("#pe-price").value).replace(",","."));
    if(!c||!(p>=0)){toast("Scrivi confezione (es. 500 g) e prezzo");return}
    const old=priceEntry(editingPrice)||{};S.prices[editingPrice]={size:c.n,unit:c.u,min:p,max:p,bulk:!!old.bulk};editingPrice=null;save();toast("Prezzo salvato");renderShop()});
  renderExtras();
}
function repSelect(v){return `<select aria-label="Reparto">${REPARTI.map(r=>`<option${r===v?" selected":""}>${r}</option>`).join("")}</select>`}
function renderExtras(){
  const el=document.getElementById("extras");
  el.innerHTML=S.extras.map((x,i)=>`<div class="ingrow" data-i="${i}"><input type="text" value="${esc(x.q)}" placeholder="Quantità" aria-label="Quantità"><input type="text" value="${esc(x.n)}" placeholder="Cosa" aria-label="Cosa">${repSelect(x.r)}<button class="btn ghost sm" type="button" aria-label="Rimuovi">×</button></div>`).join("")||`<p class="muted small">Nessun extra.</p>`;
  el.querySelectorAll(".ingrow").forEach(row=>{const x=S.extras[+row.dataset.i];const[q,n]=row.querySelectorAll("input");
    q.addEventListener("change",()=>{x.q=q.value;save();renderShop()});n.addEventListener("change",()=>{x.n=n.value;save();renderShop()});
    row.querySelector("select").addEventListener("change",e=>{x.r=e.target.value;save();renderShop()});
    row.querySelector("button").addEventListener("click",()=>{S.extras.splice(+row.dataset.i,1);save();renderShop()})});
}
document.getElementById("addExtra").addEventListener("click",()=>{S.extras.push({q:"",n:"",r:"Ortofrutta"});save();renderExtras()});
document.getElementById("clearHave").addEventListener("click",()=>{S.have=[];save();renderShop()});
document.getElementById("copyShop").addEventListener("click",()=>{
  const have=new Set(S.have),items=shopItems().filter(i=>!have.has(i.k));const c=costOf(items);
  const txt=REPARTI.map(rep=>{const its=items.filter(i=>i.r===rep);return its.length?rep.toUpperCase()+"\n"+its.map(i=>`- ${i.n}${i.q.length?" ("+mergeQ(i.q)+")":""}`).join("\n"):""}).filter(Boolean).join("\n\n")+`\n\nStima Coop: ${euroR(c.min,c.max)}`;
  const fb=document.getElementById("copyFallback");const fail=()=>{fb.hidden=false;fb.value=txt;fb.focus();fb.select();toast("Seleziona e copia dal riquadro")};
  try{navigator.clipboard.writeText(txt).then(()=>toast("Lista copiata"),fail)}catch(e){fail()}
});

/* ============ VISTA PIANO ============ */
const PREHEAT=15;
function simulate(order){
  const tasks=[];let hands=0;const burners=[0,0];const oven=[];const r5=x=>Math.ceil(x/5)*5;
  for(const r of order){
    const prep=r5(r.prepMin||0),cook=r5(r.cookMin||0);const pe=hands+prep;
    if(prep>0){tasks.push({lane:"mani",s:hands,e:pe,t:`Prepara: ${r.name}`});hands=pe}
    if(r.equip==="forno"&&cook>0){
      const temp=r.temp||200;let t=Math.max(pe,PREHEAT,oven.length?oven[oven.length-1].s:0);
      for(let g=0;g<400;g++,t+=5){const over=oven.filter(o=>o.s<t+cook&&o.e>t);
        if(over.some(o=>o.temp!==temp))continue;
        const before=oven.filter(o=>o.e<=t).sort((a,b)=>b.e-a.e)[0];
        if(before&&before.temp!==temp&&!over.length&&t<before.e+(temp<before.temp?5:10))continue;
        let fit=true;for(let m=t;m<t+cook;m+=5)if(oven.filter(o=>o.s<=m&&o.e>m).length>=2){fit=false;break}
        if(fit)break}
      oven.push({s:t,e:t+cook,temp});tasks.push({lane:"forno",s:t,e:t+cook,t:`${r.name} · ${temp} °C`});
    }else if(r.equip==="fuochi"&&cook>0){const b=burners[0]<=burners[1]?0:1;const s=Math.max(pe,burners[b]);burners[b]=s+cook;tasks.push({lane:b?"f2":"f1",s,e:s+cook,t:r.name})}
  }
  return{tasks,oven,end:Math.max(hands,0,...tasks.map(t=>t.e))};
}
function bestPlan(recs){
  if(!recs.length)return null;let best=null;const tryO=o=>{const s=simulate(o);if(!best||s.end<best.end)best=s};
  if(recs.length<=7){const perm=function*(a){if(a.length<=1){yield a.slice();return}for(let i=0;i<a.length;i++){const rest=a.slice(0,i).concat(a.slice(i+1));for(const p of perm(rest)){p.unshift(a[i]);yield p}}};for(const p of perm(recs))tryO(p)}
  else{const rnd=mulberry(42);tryO(recs.slice().sort((a,b)=>b.cookMin-a.cookMin));for(let i=0;i<6000;i++){const a=recs.slice();for(let j=a.length-1;j>0;j--){const k=Math.floor(rnd()*(j+1));[a[j],a[k]]=[a[k],a[j]]}tryO(a)}}
  if(best.oven.length){const f=best.oven.slice().sort((a,b)=>a.s-b.s)[0];best.tasks.push({lane:"forno",s:Math.max(0,f.s-PREHEAT),e:f.s,t:`Accendi a ${f.temp} °C`})}
  best.tasks.push({lane:"mani",s:best.end,e:best.end+20,t:"Porziona, etichetta, frigo o freezer entro 2 h"});best.end+=20;return best;
}
const fmtT=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
function renderPlan(){
  const recs=[...Object.keys(usage()).map(R),...S.addons.map(R)].filter(r=>r&&(r.prepMin||r.cookMin));
  if(S.week.some(d=>["p","c"].some(m=>d[m].x.includes("uova"))))recs.push({name:"Uova sode (9 minuti)",prepMin:0,cookMin:10,equip:"fuochi"});
  const plan=bestPlan(recs),sum=document.getElementById("planSummary");
  if(!plan){sum.innerHTML=`<p class="muted">Niente da cucinare la domenica.</p>`;["tlList","tl","parNotes"].forEach(i=>document.getElementById(i).innerHTML="");return}
  const busy=plan.tasks.filter(t=>t.lane==="mani").reduce((a,t)=>a+t.e-t.s,0);
  sum.innerHTML=`<div class="okbox"><b>≈ ${fmtT(plan.end)} in tutto</b> per ${recs.length} preparazioni. Le mani lavorano ${busy} minuti, il resto cuoce da solo.${recs.length>7?" Con tante preparazioni l'app prova 6.000 ordini a caso invece di tutti.":""}</div>`;
  const LN={forno:"Forno",f1:"Fuoco 1",f2:"Fuoco 2",mani:"Mani"},LC={forno:"l-forno",f1:"l-f1",f2:"l-f2",mani:"l-mani"},ORD=["forno","f1","f2","mani"];
  const tasks=plan.tasks.slice().sort((a,b)=>a.s-b.s||ORD.indexOf(a.lane)-ORD.indexOf(b.lane));
  document.getElementById("tlList").innerHTML=tasks.map(t=>`<li><span class="muted num">${fmtT(t.s)}</span><div class="task ${LC[t.lane]}"><b>${LN[t.lane]} · fino a ${fmtT(t.e)}</b>${esc(t.t)}</div></li>`).join("");
  const U=5,rows=Math.ceil(plan.end/U),tl=document.getElementById("tl");tl.style.gridTemplateRows=`auto repeat(${rows},var(--u))`;
  let h=`<div class="lh" style="grid-column:1"></div>`+ORD.map((l,i)=>`<div class="lh" style="grid-column:${i+2}">${LN[l]}</div>`).join("");
  for(let m=0;m<plan.end;m+=15)h+=`<div class="tm" style="grid-column:1;grid-row:${m/U+2} / span ${Math.min(3,rows-m/U)}">${fmtT(m)}</div>`;
  tasks.forEach(t=>h+=`<div class="task ${LC[t.lane]}${t.e-t.s<=5?" short":""}" style="grid-column:${ORD.indexOf(t.lane)+2};grid-row:${t.s/U+2} / ${t.e/U+2}" title="${esc(t.t)}"><b>${fmtT(t.s)}–${fmtT(t.e)}</b>${esc(t.t)}</div>`);
  tl.innerHTML=h;
  document.getElementById("parNotes").innerHTML=`<h3>Note delle ricette</h3>`+recs.filter(r=>r.par).map(r=>`<div class="note par"><h4>${esc(r.name)}</h4>${esc(r.par)}</div>`).join("");
  setPlanView(S.planView||"list");
}
function setPlanView(v){S.planView=v;save();document.getElementById("tlList").hidden=v!=="list";document.getElementById("tlGridWrap").hidden=v!=="grid";document.querySelectorAll("[data-pv]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.pv===v))}
document.querySelectorAll("[data-pv]").forEach(b=>b.addEventListener("click",()=>setPlanView(b.dataset.pv)));

/* ============ RICETTE ============ */
function picHTML(r,cls="pic"){
  if(r.photo)return `<img class="${cls}" src="${r.photo}" alt="${esc(r.name)}">`;
  if(r.draw)return `<canvas class="${cls}" data-draw="${r.id}" role="img" aria-label="Illustrazione: ${esc(r.name)}"></canvas>`;
  return `<div class="${cls} ph" aria-hidden="true">${esc(((r.name||"?").trim()[0]||"?").toUpperCase())}</div>`}
function card(r){const m=weekMonth();const sub=r.role==="dolce"?`${r.portions} pezzi · ${inSeason(r,m)?"di stagione":"fuori stagione"}`:r.role==="scorta"?`${stockCount(r.id,"freezer")} in freezer · ${inSeason(r,m)?"di stagione":"fuori stagione"}`:`${r.protein} g prot · ${inSeason(r,m)?"di stagione":"fuori stagione"}`;
  return `<button class="rcard" type="button" data-id="${r.id}">${picHTML(r)}${r.fav?`<span class="favdot" aria-label="Preferita">★</span>`:""}<div class="t"><b>${esc(r.name)}</b><span>${sub}</span></div></button>`}
const FILTERS=[["tutte","Tutte"],["preferite","★ Preferite"],["stagione","Di stagione"],["main","Principali"],["base","Basi"],["side","Contorni"],["mie","Mie"]];
function bindCards(root,from){root.querySelectorAll(".rcard").forEach(b=>b.addEventListener("click",()=>{backTo=from;if(view!=="ricette"){view="ricette";Object.keys(TITLES).forEach(k=>document.getElementById("v-"+k).hidden=k!=="ricette");document.querySelectorAll("nav.tabbar button").forEach(x=>x.setAttribute("aria-current",x.dataset.v===from?"page":"false"))}showDetail(b.dataset.id)}))}
function showList(){
  document.getElementById("rList").hidden=false;document.getElementById("rDetail").hidden=true;document.getElementById("rEdit").hidden=true;
  document.getElementById("viewTitle").textContent="Ricette";
  const favs=S.recipes.filter(r=>r.fav);
  const fs=document.getElementById("favSection");
  fs.innerHTML=`<h2>★ Preferite</h2>`+(favs.length?`<div class="fav-strip">${favs.map(card).join("")}</div><p class="small muted">Le preferite (pasti) compaiono più spesso nelle settimane generate.</p>`:`<p class="small muted">Nessuna preferita ancora. Apri una ricetta, un sugo o un dolce e tocca la stella.</p>`);
  const f=S.filter||"tutte",m=weekMonth();
  document.getElementById("filters").innerHTML=FILTERS.map(([k,l])=>`<button class="chip" type="button" data-f="${k}" aria-pressed="${k===f}">${l}</button>`).join("");
  document.querySelectorAll("[data-f]").forEach(b=>b.addEventListener("click",()=>{S.filter=b.dataset.f;save();showList()}));
  const libIds=new Set(LIB.map(l=>l.id));
  const list=S.recipes.filter(r=>["main","base","side"].includes(r.role)||(f==="mie"&&!libIds.has(r.id))||f==="preferite").filter(r=>f==="tutte"||(f==="preferite"&&r.fav)||(f==="stagione"&&inSeason(r,m))||(f===r.role)||(f==="mie"&&!libIds.has(r.id)));
  const g=document.getElementById("rgrid");g.innerHTML=list.map(card).join("")||`<p class="muted">Nessuna ricetta in questo filtro.</p>`;
  bindCards(fs,"ricette");bindCards(g,"ricette");drawCanvases();
}
function goBack(){if(backTo==="ricette")showList();else show(backTo)}
function showDetail(id){
  const r=R(id);if(!r)return goBack();
  document.getElementById("rList").hidden=true;document.getElementById("rEdit").hidden=true;
  const el=document.getElementById("rDetail");el.hidden=false;
  const eq=r.equip==="forno"?`forno ${r.temp} °C`:r.equip==="fuochi"?"fornello":"senza cottura";
  const m=weekMonth();
  let meta=`<span>${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}</span><span>prep ${r.prepMin} min</span><span>cottura ${r.cookMin} min · ${eq}</span>`;
  if(["main","base","side","scorta"].includes(r.role))meta=`<span><b>${r.protein} g</b> proteine/porz.</span>`+meta;
  if(["main","base","side"].includes(r.role))meta+=`<span>${r.id==="pane"?"dispensa":"frigo"} ${r.fridgeDays} gg</span><span>${r.freezer?"si congela":"non congelare"}</span>`;
  if(r.role==="scorta")meta+=`<span>freezer ${r.freezerMonths||3} mesi</span>`;
  let action="";
  if(r.role==="scorta"||r.role==="dolce"){
    const inProg=S.addons.includes(r.id);
    action=`<div class="panel stack"><div class="row"><button class="btn sm" type="button" id="prog">${inProg?"✓ In programma domenica (togli)":"Metti in programma domenica"}</button></div>
      <p class="small muted">In programma: gli ingredienti entrano nella spesa e i tempi nel piano della settimana.</p>
      <div class="row"><span class="small"><b>L'hai già preparato?</b> Aggiungi ${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}:</span>${(r.role==="dolce"?Object.entries(r.store||{}).filter(([,v])=>v>0).map(([w])=>w):["freezer"]).map(w=>`<button class="btn ghost sm" type="button" data-add="${w}">in ${w}</button>`).join("")}</div></div>`;
  }
  el.innerHTML=`<div class="row"><button class="btn ghost sm" type="button" id="back">← Indietro</button><span style="flex:1"></span><button class="star" type="button" id="fav" aria-pressed="${!!r.fav}" aria-label="Preferita">${r.fav?"★":"☆"}</button><button class="btn sm" type="button" id="edit">Modifica</button></div>
    ${picHTML(r,"hero")}
    <div class="eyebrow">${ROLE[r.role]||""}</div><h2>${esc(r.name)}</h2>
    <div class="meta">${meta}</div>
    <div class="season"><span class="pill ${inSeason(r,m)?"in":""}">stagione: ${monthsLabel(r.months)}</span>${r.dairy?`<span class="pill dairy">latticini animali</span>`:""}${r.spicy?`<span class="pill dairy">piccante: non viene proposta</span>`:""}</div>
    ${r.uses?`<div class="infobox small"><b>Condisce:</b> ${esc(r.uses)}</div>`:""}
    ${r.store?`<div class="infobox small"><b>Si conserva:</b> ${[r.store.dispensa?`dispensa ${r.store.dispensa} gg`:"",r.store.frigo?`frigo ${r.store.frigo} gg`:"",r.store.freezer?`freezer ${r.store.freezer} mesi`:""].filter(Boolean).join(" · ")}</div>`:""}
    ${action}
    <div class="panel"><h4 style="margin-bottom:6px">Ingredienti</h4><ul class="ing">${r.ing.map(i=>`<li><span class="q">${esc(i.q)}</span><span>${esc(i.n)}</span></li>`).join("")}</ul></div>
    <div class="panel"><h4 style="margin-bottom:6px">Procedimento</h4><ol class="steps">${r.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
    <div class="notes">${r.cons?`<div class="note cons"><h4>Conservazione</h4>${esc(r.cons)}</div>`:""}${r.par?`<div class="note par"><h4>In parallelo</h4>${esc(r.par)}</div>`:""}${r.think?`<div class="note think"><h4>Pensaci</h4>${esc(r.think)}</div>`:""}</div>
    ${r.photo?"":`<p class="small muted">Tocca Modifica per aggiungere una tua foto.</p>`}`;
  el.querySelector("#back").addEventListener("click",goBack);
  el.querySelector("#edit").addEventListener("click",()=>showEdit(id));
  el.querySelector("#fav").addEventListener("click",e=>{r.fav=!r.fav;save();e.currentTarget.setAttribute("aria-pressed",r.fav);e.currentTarget.textContent=r.fav?"★":"☆";toast(r.fav?"Aggiunta alle preferite":"Tolta dalle preferite")});
  const pg=el.querySelector("#prog");pg&&pg.addEventListener("click",()=>{const i=S.addons.indexOf(r.id);i>=0?S.addons.splice(i,1):S.addons.push(r.id);save();toast(i>=0?"Tolta dal programma":"In programma domenica: è nella spesa");showDetail(id)});
  el.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{addStock(r.id,r.portions,b.dataset.add);toast(`${r.portions} in ${b.dataset.add}`);showDetail(id)}));
  document.getElementById("viewTitle").textContent=ROLE[r.role]||"Ricetta";drawCanvases();window.scrollTo(0,0);
}
let draft=null;
function showEdit(id,role){
  const src=id?R(id):{id:null,name:"",role:role||"main",protein:20,portions:4,prepMin:10,cookMin:20,equip:"fuochi",temp:180,fridgeDays:3,freezer:true,needsBase:"",months:M("all"),fav:false,dairy:false,spicy:false,freezerMonths:3,uses:"",store:{dispensa:3,frigo:5,freezer:3},ing:[{q:"",n:"",r:"Ortofrutta"}],steps:[],cons:"",par:"",think:"",photo:null};
  draft=clone(src);if(!draft.store)draft.store={dispensa:0,frigo:0,freezer:0};
  document.getElementById("rList").hidden=true;document.getElementById("rDetail").hidden=true;
  const f=document.getElementById("rEdit");f.hidden=false;
  document.getElementById("viewTitle").textContent=id?"Modifica":"Nuova ricetta";
  const bases=S.recipes.filter(r=>r.role==="base");
  f.innerHTML=`<div class="row"><button class="btn ghost sm" type="button" id="cancel">Annulla</button><span style="flex:1"></span><button class="btn sm" type="submit">Salva</button></div>
    <label class="f">Nome<input type="text" id="e-name" required value="${esc(draft.name)}" placeholder="Es. Vellutata di zucca e ceci"></label>
    <div class="two"><label class="f">Tipo<select id="e-role">${Object.entries(ROLE).map(([k,l])=>`<option value="${k}"${draft.role===k?" selected":""}>${l}</option>`).join("")}</select></label>
      <label class="f">Proteine per porzione (g)<input type="number" id="e-prot" min="0" max="120" value="${draft.protein||0}"></label></div>
    <p class="small muted">Per stimare le proteine: somma quelle degli ingredienti principali (sull'etichetta, per 100 g) e dividi per le porzioni.</p>
    <div class="row"><label class="check"><input type="checkbox" id="e-dairy" ${draft.dairy?"checked":""}> Contiene latticini animali</label><label class="check"><input type="checkbox" id="e-spicy" ${draft.spicy?"checked":""}> Piccante (non verrà mai proposta)</label></div>
    <div class="panel stack"><h4>Foto</h4><div id="e-photo-prev"></div>
      <div class="row"><label class="btn ghost sm" for="e-photo" style="display:inline-flex;align-items:center">${draft.photo?"Cambia foto":"Scatta o scegli una foto"}</label><input type="file" id="e-photo" accept="image/*" hidden>${draft.photo?`<button class="btn warn sm" type="button" id="e-photo-rm">Togli foto</button>`:""}</div></div>
    <div class="panel stack"><h4>Stagione</h4><p class="small muted">Nei mesi non spuntati non viene proposta in automatico.</p>
      <div class="months">${MONTHS.map((mm,k)=>`<label><input type="checkbox" data-mo="${k+1}" ${draft.months.includes(k+1)?"checked":""}>${mm}</label>`).join("")}</div>
      <div class="row"><button class="btn ghost sm" type="button" id="allM">Tutto l'anno</button></div></div>
    <div class="panel stack"><h4>Tempi e attrezzatura</h4><p class="small muted">"Preparazione" è il tempo in cui usi le mani, "cottura" quello in cui cuoce da sola: servono al piano di lavoro.</p>
      <div class="three"><label class="f">Porzioni / pezzi<input type="number" id="e-portions" min="1" max="40" value="${draft.portions}"></label>
        <label class="f">Preparazione (min)<input type="number" id="e-prep" min="0" max="240" value="${draft.prepMin}"></label>
        <label class="f">Cottura (min)<input type="number" id="e-cook" min="0" max="480" value="${draft.cookMin}"></label></div>
      <div class="two"><label class="f">Cottura in<select id="e-equip"><option value="forno"${draft.equip==="forno"?" selected":""}>Forno</option><option value="fuochi"${draft.equip==="fuochi"?" selected":""}>Fornello</option><option value="nessuno"${draft.equip==="nessuno"?" selected":""}>Niente</option></select></label>
        <label class="f" id="e-temp-l">Temperatura (°C)<input type="number" id="e-temp" min="50" max="280" step="5" value="${draft.temp||180}"></label></div>
      <label class="f" id="e-needs-l">Va sempre con<select id="e-needs"><option value="">qualsiasi base</option>${bases.map(b=>`<option value="${b.id}"${draft.needsBase===b.id?" selected":""}>${esc(b.name)}</option>`).join("")}</select></label></div>
    <div class="panel stack" id="e-cons-meal"><h4>Conservazione</h4>
      <div class="two"><label class="f">Giorni in frigo<input type="number" id="e-fridge" min="0" max="10" value="${draft.fridgeDays||0}"></label>
      <label class="check" style="align-self:end;padding-bottom:10px"><input type="checkbox" id="e-freezer" ${draft.freezer?"checked":""}> Si può congelare</label></div></div>
    <div class="panel stack" id="e-cons-scorta"><h4>Scorta da freezer</h4>
      <div class="two"><label class="f">Mesi in freezer<input type="number" id="e-fzm" min="1" max="12" value="${draft.freezerMonths||3}"></label>
      <label class="f">Condisce<input type="text" id="e-uses" value="${esc(draft.uses||"")}" placeholder="pasta, riso, legumi"></label></div></div>
    <div class="panel stack" id="e-cons-dolce"><h4>Dove si conserva (0 = no)</h4>
      <div class="three"><label class="f">Dispensa (giorni)<input type="number" id="e-sd" min="0" max="90" value="${draft.store.dispensa||0}"></label>
      <label class="f">Frigo (giorni)<input type="number" id="e-sf" min="0" max="30" value="${draft.store.frigo||0}"></label>
      <label class="f">Freezer (mesi)<input type="number" id="e-sz" min="0" max="12" value="${draft.store.freezer||0}"></label></div></div>
    <label class="f">Note di conservazione<input type="text" id="e-cons" value="${esc(draft.cons)}"></label>
    <div class="panel stack"><h4>Ingredienti</h4><div id="e-ing" class="stack"></div><div><button class="btn ghost sm" type="button" id="e-addIng">+ Ingrediente</button></div></div>
    <label class="f">Procedimento (un passaggio per riga)<textarea id="e-steps">${esc(draft.steps.join("\n"))}</textarea></label>
    <label class="f">In parallelo (cosa fare mentre cuoce)<input type="text" id="e-par" value="${esc(draft.par)}"></label>
    <label class="f">Pensaci (una curiosità o domanda)<input type="text" id="e-think" value="${esc(draft.think)}"></label>
    <label class="check"><input type="checkbox" id="e-fav" ${draft.fav?"checked":""}> ★ Preferita</label>
    <div class="row">${id?`<button class="btn warn sm" type="button" id="e-del">Elimina</button><button class="btn ghost sm" type="button" id="e-dup">Duplica</button>`:""}</div>
    <div class="row" id="delConfirm" hidden><span class="small">Eliminarla anche dalla settimana?</span><button class="btn warn sm" type="button" id="delYes">Sì, elimina</button><button class="btn ghost sm" type="button" id="delNo">Annulla</button></div>`;
  renderIngRows();renderPhotoPrev();
  const g=s=>f.querySelector(s);
  const sync=()=>{const role=g("#e-role").value;g("#e-temp-l").hidden=g("#e-equip").value!=="forno";g("#e-cons-meal").hidden=!["main","base","side"].includes(role);g("#e-cons-scorta").hidden=role!=="scorta";g("#e-cons-dolce").hidden=role!=="dolce";g("#e-needs-l").hidden=role!=="main"};
  sync();g("#e-equip").addEventListener("change",sync);g("#e-role").addEventListener("change",sync);
  g("#allM").addEventListener("click",()=>f.querySelectorAll("[data-mo]").forEach(c=>c.checked=true));
  g("#cancel").addEventListener("click",()=>id?showDetail(id):goBack());
  g("#e-addIng").addEventListener("click",()=>{readIng();draft.ing.push({q:"",n:"",r:"Ortofrutta"});renderIngRows()});
  g("#e-photo").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{draft.photo=await shrink(file);renderPhotoPrev();toast("Foto pronta: ricordati di salvare")}catch(err){toast("Non riesco a leggere questa foto")}});
  const rm=g("#e-photo-rm");rm&&rm.addEventListener("click",()=>{draft.photo=null;renderPhotoPrev();rm.remove()});
  if(id){g("#e-del").addEventListener("click",()=>g("#delConfirm").hidden=false);g("#delNo").addEventListener("click",()=>g("#delConfirm").hidden=true);
    g("#delYes").addEventListener("click",()=>{S.recipes=S.recipes.filter(r=>r.id!==id);S.week.forEach(d=>["p","c"].forEach(m=>{PARTS.forEach(k=>{if(d[m][k]===id)d[m][k]=null});if(d[m].k===id)d[m].k=null}));S.addons=S.addons.filter(a=>a!==id);save();toast("Eliminata");goBack()});
    g("#e-dup").addEventListener("click",()=>{const c=clone(R(id));c.id=uid();c.name+=" (copia)";delete c.draw;c.edited=true;S.recipes.push(c);save();toast("Duplicata");showEdit(c.id)})}
  f.onsubmit=e=>{e.preventDefault();readIng();
    const months=[...f.querySelectorAll("[data-mo]")].filter(c=>c.checked).map(c=>+c.dataset.mo);
    const rec={...draft,edited:true,name:g("#e-name").value.trim()||"Senza nome",role:g("#e-role").value,protein:Math.max(0,+g("#e-prot").value||0),portions:Math.max(1,+g("#e-portions").value||1),
      prepMin:Math.max(0,+g("#e-prep").value||0),cookMin:Math.max(0,+g("#e-cook").value||0),equip:g("#e-equip").value,temp:+g("#e-temp").value||180,needsBase:g("#e-needs").value,
      dairy:g("#e-dairy").checked,spicy:g("#e-spicy").checked,fridgeDays:Math.max(0,+g("#e-fridge").value||0),freezer:g("#e-freezer").checked,
      freezerMonths:Math.max(1,+g("#e-fzm").value||3),uses:g("#e-uses").value.trim(),store:{dispensa:+g("#e-sd").value||0,frigo:+g("#e-sf").value||0,freezer:+g("#e-sz").value||0},
      cons:g("#e-cons").value.trim(),months:months.length?months:M("all"),steps:g("#e-steps").value.split("\n").map(s=>s.trim()).filter(Boolean),par:g("#e-par").value.trim(),think:g("#e-think").value.trim(),fav:g("#e-fav").checked,ing:draft.ing.filter(i=>i.n.trim())};
    if(rec.role!=="dolce")delete rec.store;
    if(!rec.id){rec.id=uid();S.recipes.push(rec)}else S.recipes[S.recipes.findIndex(r=>r.id===rec.id)]=rec;
    if(save()){toast("Salvata");showDetail(rec.id)}};
  window.scrollTo(0,0);
}
function renderIngRows(){const el=document.getElementById("e-ing");
  el.innerHTML=draft.ing.map((i,k)=>`<div class="ingrow" data-k="${k}"><input type="text" value="${esc(i.q)}" placeholder="300 g" aria-label="Quantità"><input type="text" value="${esc(i.n)}" placeholder="Ingrediente" aria-label="Ingrediente">${repSelect(i.r)}<button class="btn ghost sm" type="button" aria-label="Rimuovi">×</button></div>`).join("");
  el.querySelectorAll(".ingrow button").forEach(b=>b.addEventListener("click",()=>{readIng();draft.ing.splice(+b.closest(".ingrow").dataset.k,1);renderIngRows()}))}
function readIng(){document.querySelectorAll("#e-ing .ingrow").forEach(row=>{const i=draft.ing[+row.dataset.k];const[q,n]=row.querySelectorAll("input");i.q=q.value.trim();i.n=n.value.trim();i.r=row.querySelector("select").value})}
function renderPhotoPrev(){const el=document.getElementById("e-photo-prev");if(!el)return;el.innerHTML=draft.photo?`<img src="${draft.photo}" alt="Anteprima" style="border-radius:10px;max-height:220px;object-fit:cover;width:100%">`:`<p class="small muted">Nessuna foto: verrà mostrata ${draft.draw?"l'illustrazione":"l'iniziale del nome"}.</p>`}
function shrink(file){return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{const Mx=720,sc=Math.min(1,Mx/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",.72))};img.onerror=rej;img.src=url})}
document.getElementById("newRecipe").addEventListener("click",()=>{backTo="ricette";showEdit(null,"main")});

/* ============ SCORTE ============ */
function stockRows(filterFn,emptyMsg){
  const today=iso(new Date());const items=S.stock.filter(filterFn).sort((a,b)=>a.exp.localeCompare(b.exp));
  if(!items.length)return `<p class="small muted">${emptyMsg}</p>`;
  return items.map(s=>{const late=s.exp<today;const soon=!late&&s.exp<iso(addDays(today,14));
    return `<div class="stockrow"><div><b>${esc(s.name)}</b><div class="sub${late?" late":""}">${s.where} · fatto il ${fmtDate(new Date(s.date+"T12:00:00"))} · ${late?"scaduto il ":soon?"da usare entro il ":"entro il "}${fmtDate(new Date(s.exp+"T12:00:00"))}</div></div>
      <div class="counter"><button type="button" data-sm="${s.id}" aria-label="Usa una porzione">−</button><span>${s.n}</span><button type="button" data-sp="${s.id}" aria-label="Aggiungi una porzione">+</button></div></div>`}).join("");
}
function bindStock(root,rerender){
  root.querySelectorAll("[data-sm]").forEach(b=>b.addEventListener("click",()=>{const s=S.stock.find(x=>x.id===b.dataset.sm);if(!s)return;s.n--;if(s.n<=0)S.stock=S.stock.filter(x=>x!==s);save();rerender()}));
  root.querySelectorAll("[data-sp]").forEach(b=>b.addEventListener("click",()=>{const s=S.stock.find(x=>x.id===b.dataset.sp);if(!s)return;s.n++;save();rerender()}));
}
let scorteF="stagione",dolciF="stagione";
function renderScorte(){
  const el=document.getElementById("stockList");
  el.innerHTML=`<h3 style="margin-bottom:6px">In freezer adesso</h3>`+stockRows(s=>s.where==="freezer"&&(!R(s.rid)||R(s.rid).role!=="dolce"),"Il freezer è vuoto. Prepara un sugo qui sotto, oppure metti nelle scorte le porzioni che avanzano dalla settimana.");
  bindStock(el,renderScorte);
  const m=weekMonth();
  document.getElementById("scorteFilter").innerHTML=[["stagione","Di stagione"],["tutte","Tutte"]].map(([k,l])=>`<button class="chip" type="button" data-sf="${k}" aria-pressed="${k===scorteF}">${l}</button>`).join("")+`<button class="btn ghost sm" type="button" id="newScorta">+ Nuovo sugo</button>`;
  document.querySelectorAll("[data-sf]").forEach(b=>b.addEventListener("click",()=>{scorteF=b.dataset.sf;renderScorte()}));
  document.getElementById("newScorta").addEventListener("click",()=>{backTo="scorte";view="ricette";document.getElementById("v-scorte").hidden=true;document.getElementById("v-ricette").hidden=false;showEdit(null,"scorta")});
  const list=S.recipes.filter(r=>r.role==="scorta"&&(scorteF==="tutte"||inSeason(r,m))).sort((a,b)=>inSeason(b,m)-inSeason(a,m));
  const g=document.getElementById("scorteGrid");g.innerHTML=list.map(card).join("")||`<p class="muted">Nessun sugo di stagione: guarda "Tutte".</p>`;bindCards(g,"scorte");drawCanvases();
}
function renderDolci(){
  const el=document.getElementById("sweetStock");
  el.innerHTML=`<h3 style="margin-bottom:6px">In casa adesso</h3>`+stockRows(s=>R(s.rid)&&R(s.rid).role==="dolce","Nessun dolce in casa. Scegline uno qui sotto e mettilo in programma per domenica.");
  bindStock(el,renderDolci);
  const m=weekMonth();
  document.getElementById("dolciFilter").innerHTML=[["stagione","Di stagione"],["tutte","Tutti"]].map(([k,l])=>`<button class="chip" type="button" data-df="${k}" aria-pressed="${k===dolciF}">${l}</button>`).join("")+`<button class="btn ghost sm" type="button" id="newDolce">+ Nuovo dolce</button>`;
  document.querySelectorAll("[data-df]").forEach(b=>b.addEventListener("click",()=>{dolciF=b.dataset.df;renderDolci()}));
  document.getElementById("newDolce").addEventListener("click",()=>{backTo="dolci";view="ricette";document.getElementById("v-dolci").hidden=true;document.getElementById("v-ricette").hidden=false;showEdit(null,"dolce")});
  const list=S.recipes.filter(r=>r.role==="dolce"&&(dolciF==="tutte"||inSeason(r,m))).sort((a,b)=>inSeason(b,m)-inSeason(a,m));
  const g=document.getElementById("dolciGrid");g.innerHTML=list.map(card).join("")||`<p class="muted">Nessun dolce di stagione: guarda "Tutti".</p>`;bindCards(g,"dolci");drawCanvases();
}

/* ============ BACKUP ============ */
document.getElementById("exportBtn").addEventListener("click",async()=>{
  const blob=new Blob([JSON.stringify(S)],{type:"application/json"});const name=`mealprep-backup-${iso(new Date())}.json`;
  try{const file=new File([blob],name,{type:"application/json"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Backup meal prep"});return}}catch(e){if(e&&e.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)});
document.getElementById("importFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d.recipes)throw 0;S={...defaults(),...d};if((S.libVersion||0)<LIB_VERSION)mergeLib(S);if(!S.week)autoWeek();save();toast("Backup importato");showList()}catch(err){toast("Questo file non è un backup dell'app")}};rd.readAsText(f);e.target.value=""});
document.getElementById("resetAll").addEventListener("click",()=>document.getElementById("resetConfirm").hidden=false);
document.getElementById("resetNo").addEventListener("click",()=>document.getElementById("resetConfirm").hidden=true);
document.getElementById("resetYes").addEventListener("click",()=>{S=defaults();autoWeek();save();document.getElementById("resetConfirm").hidden=true;toast("Ripristinato");showList()});
