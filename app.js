/* ============ UTILS ============ */
const DAYS=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì"];
const MONTHS=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const MONTHS_LONG=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const ROLE={main:"Piatto principale",base:"Base (cereale)",side:"Contorno",scorta:"Sugo da freezer",fermento:"Fermentato",dolce:"Dolce"};
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
const shuffle=(a,rnd)=>{a=a.slice();for(let j=a.length-1;j>0;j--){const k=Math.floor(rnd()*(j+1));[a[j],a[k]]=[a[k],a[j]]}return a};

/* ============ STATE + MIGRAZIONE ============ */
const KEY="mealprep-app-v3", OLD_KEY="mealprep-app-v2";
const OLD_LIB_IDS=["farro","orzo","riso","couscous","pasta","pane","verd_aut","verd_inv","verd_est","piselli","slaw","spinaci","fagiolini","insalata","pomodori","merluzzo","merluzzo_piselli","polp_merluzzo","polp_tonno","dahl","chili","lenticchie","cannellini_tonno","frit_zucchine","frit_broccoli","frit_asparagi","torta_spinaci","tofu","sugo_sgombro","sardine","peperoni_ripieni","parmigiana","zuppa_ceci","vellutata_zucca"];
const RENAMED={chili:"stufato"}, REMOVED=["pomodori"];
function emptySlot(){return{m:null,b:null,s:null,k:null,x:[],n:""}}
function emptyDay(){return{p:emptySlot(),c:emptySlot(),sn:{col:{id:null,f:null},spu:{id:null,f:null}}}}
function emptyWeek(){return DAYS.map(emptyDay)}
function defaults(){return{v:4,libVersion:LIB_VERSION,recipes:clone(LIB),week:null,weekStart:null,extras:[{q:"",n:"sale iodato, pepe, olio EVO",r:"Basi"},{q:"",n:"spezie dolci (curcuma, cumino, paprika dolce, origano, cannella)",r:"Basi"}],have:[],history:[],stock:[],addons:[],prices:{},planView:"list",filter:"tutte",seed:1,leftoverDone:[]}}
function mapId(id){if(!id)return null;if(RENAMED[id])return RENAMED[id];if(REMOVED.includes(id))return null;return id}
function mergeLib(st){
  const libIds=new Set(LIB.map(r=>r.id));const out=[];const seen=new Set();
  st.recipes.forEach(r=>{const id=mapId(r.id);if(!id||seen.has(id))return;
    if(libIds.has(id)){const lib=LIB.find(l=>l.id===id);out.push(r.edited?{...clone(lib),...r,id}:{...clone(lib),fav:!!r.fav,photo:r.photo||null})}
    else if(!OLD_LIB_IDS.includes(r.id))out.push({spicy:false,dairy:false,temp:0,needsBase:"",months:M("all"),fridgeDays:3,freezer:false,kcal:0,...r});
    seen.add(id)});
  LIB.forEach(l=>{if(!seen.has(l.id))out.push(clone(l))});
  st.recipes=out;st.libVersion=LIB_VERSION;
  if(st.week)st.week=st.week.map(d=>({p:{...emptySlot(),...d.p,m:mapId(d.p.m),b:mapId(d.p.b),s:mapId(d.p.s)},c:{...emptySlot(),...d.c,m:mapId(d.c.m),b:mapId(d.c.b),s:mapId(d.c.s)},sn:d.sn||null}));
}
function load(){
  let st=null;try{st=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(st&&st.recipes){if((st.libVersion||0)<LIB_VERSION)mergeLib(st);return{...defaults(),...st}}
  let old=null;try{old=JSON.parse(localStorage.getItem(OLD_KEY))}catch(e){}
  if(old&&old.recipes){const st=defaults();st.recipes=old.recipes;st.week=old.week||null;mergeLib(st);
    st.weekStart=old.weekStart||null;st.have=old.have||[];st.seed=old.seed||1;st.extras=(old.extras&&old.extras.length?old.extras:st.extras);
    st.history=(old.history||[]).map(h=>({...h,ids:h.ids.map(mapId).filter(Boolean)}));return st}
  return defaults();
}
let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){toast("Memoria piena: togli qualche foto o esporta un backup");return false}}
const R=id=>S.recipes.find(r=>r.id===id);
const B=id=>BOOSTERS.find(b=>b.id===id);
const SN=id=>SNACKS.find(s=>s.id===id);
const FRT=id=>FRUITS.find(f=>f.id===id);
const weekMonth=()=>addDays(S.weekStart,0).getMonth()+1;
const inSeason=(r,m)=>!r.months||!r.months.length||r.months.includes(m);
function monthsLabel(ms){if(!ms||ms.length>=12)return "tutto l'anno";const set=new Set(ms);const runs=[];ms.slice().sort((a,b)=>a-b).forEach(m=>{if(!set.has(m===1?12:m-1)){let e=m;while(set.has(e%12+1)&&e%12+1!==m)e=e%12+1;runs.push(MONTHS[m-1]+(e!==m?"–"+MONTHS[e-1]:""))}});return runs.join(", ")||"tutto l'anno"}


/* ============ STAGIONE: RICETTE CHE SI ADATTANO E CONTROLLO ============ */
function hashStr(x){let h=2166136261;for(const c of String(x)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const SEASON_NEED={forno:4,crudo:3,frittata:2};
function seasonalPick(r,month=weekMonth(),key=S.weekStart){
  const pool=SEASONAL_VEG.filter(v=>v.months.includes(month)&&v[r.seasonal]);const rnd=mulberry(hashStr(key+"|"+r.id));
  const strict=pool.filter(v=>v.months.length<12),always=pool.filter(v=>v.months.length===12);
  return[...shuffle(strict,rnd),...shuffle(always,rnd)].slice(0,SEASON_NEED[r.seasonal]||3)}
function ingOf(r,month,key){if(!r||!r.seasonal)return r?r.ing:[];return[...seasonalPick(r,month,key).map(v=>({q:v[r.seasonal],n:v.n,r:"Ortofrutta"})),...r.ing]}
function nameOf(r){if(!r)return"";if(!r.seasonal)return r.name;return r.name+": "+seasonalPick(r).map(v=>v.n).join(", ")}
function produceSeason(name){const n=name.trim().toLowerCase();if(PRODUCE_SEASON[n])return PRODUCE_SEASON[n];const k=Object.keys(PRODUCE_SEASON).find(k=>n.startsWith(k+" ")||n===k);return k?PRODUCE_SEASON[k]:null}
function seasonIssues(ing,months){return ing.filter(i=>(i.r||"Ortofrutta")==="Ortofrutta"&&i.n).map(i=>({n:i.n,s:produceSeason(i.n)})).filter(x=>x.s&&x.s.length<12&&months.some(m=>!x.s.includes(m)))}
function seasonIntersection(ing){let set=M("all");ing.forEach(i=>{if((i.r||"Ortofrutta")!=="Ortofrutta")return;const s=produceSeason(i.n||"");if(s&&s.length<12)set=set.filter(m=>s.includes(m))});return set}

/* ============ NUTRIZIONE ============ */
function eachUse(week,fn){week.forEach((d,i)=>["p","c"].forEach(meal=>{PARTS.forEach(k=>{const id=d[meal][k];if(id&&R(id))fn(R(id),i+1,meal,k)})}))}
function usage(week=S.week){const u={};eachUse(week,(r,day,meal)=>{(u[r.id]=u[r.id]||[]).push({day,meal})});return u}
function status(r,day){
  if(r.id==="pane"&&day<=r.fridgeDays)return{k:"pn",t:"dispensa"};
  if(day<=r.fridgeDays)return{k:"fr",t:day===r.fridgeDays?"frigo · ultimo giorno":"frigo"};
  if(r.freezer)return{k:"fz",t:"dal freezer"};
  return{k:"bad",t:`dura ${r.fridgeDays} gg, non congelabile`};
}
function slotNut(s){let k=0,p=0;PARTS.forEach(key=>{const r=s[key]&&R(s[key]);if(r){k+=+r.kcal||0;p+=+r.protein||0}});if(s.k&&R(s.k)){k+=+R(s.k).kcal||0;p+=+R(s.k).protein||0}(s.x||[]).forEach(id=>{const b=B(id);if(b){k+=b.kcal;p+=b.protein}});return{k,p}}
function snackNut(x){if(!x||!x.id)return{k:0,p:0};const s=SN(x.id);if(!s)return{k:0,p:0};let k=s.kcal,p=s.protein;if(s.fruit&&x.f&&FRT(x.f)){k+=FRT(x.f).kcal;p+=1}return{k,p}}
function dayNut(d){const a=slotNut(d.p),b=slotNut(d.c),c=snackNut(d.sn&&d.sn.col),e=snackNut(d.sn&&d.sn.spu);return{k:a.k+b.k+c.k+e.k,p:a.p+b.p+c.p+e.p,mk:a.k+b.k,mp:a.p+b.p}}
function dayFerm(d){return["col","spu"].some(t=>{const x=d.sn&&d.sn[t];const s=x&&SN(x.id);return!!(s&&s.ferm)})||["p","c"].some(m=>(d[m].x||[]).some(id=>B(id)&&B(id).ferm))}

/* ============ SPESA + COSTO ============ */
const FR={"½":.5,"¼":.25,"¾":.75};
function parseQ(q){const x=String(q||"").trim().match(/^([\d.,]+|½|¼|¾)\s*(.*)$/);if(!x)return null;return{n:FR[x[1]]??parseFloat(x[1].replace(",",".")),u:x[2].trim()}}
function scaleQ(q,m){if(m===1||!q)return q;const p=parseQ(q);if(!p)return `${q} ×${m}`;return `${String(Math.round(p.n*m*100)/100).replace(".",",")} ${p.u}`.trim()}
function mergeQ(list){const groups=new Map(),other=[];list.filter(Boolean).forEach(q=>{const p=parseQ(q);if(!p){other.push(q);return}const k=p.u.slice(0,5).toLowerCase();const g=groups.get(k)||{n:0,u:p.u,max:0};g.n+=p.n;if(p.n>=g.max){g.max=p.n;g.u=p.u}groups.set(k,g)});
  return[...[...groups.values()].map(g=>`${String(Math.round(g.n*100)/100).replace(".",",")} ${g.u}`.trim()),...other].join(" + ")}
function canon(q){const p=parseQ(q);if(!p)return null;const u=p.u.toLowerCase();
  if(/^kg\b/.test(u))return{n:p.n*1000,u:"g"};if(/^g\b/.test(u))return{n:p.n,u:"g"};
  if(/^l\b/.test(u))return{n:p.n*1000,u:"ml"};if(/^cl\b/.test(u))return{n:p.n*10,u:"ml"};if(/^ml\b/.test(u))return{n:p.n,u:"ml"};
  if(/^cucchiain/.test(u))return{n:p.n*4,u:"g"};if(/^cucchia/.test(u))return{n:p.n*10,u:"g"};
  if(/^spicch/.test(u))return{n:p.n,u:"spicch"};if(/^cost/.test(u))return{n:p.n,u:"costa"};if(/^cm\b/.test(u))return{n:p.n,u:"cm"};
  return{n:p.n,u:"pz"}}
function priceEntry(name){const k=name.trim().toLowerCase();return S.prices[k]||PRICES[k]||null}
function itemCost(it){const e=priceEntry(it.n);if(!e)return null;let tot=0,mismatch=false;
  it.q.forEach(q=>{const c=canon(q);if(!c||(c.u!==e.unit&&e.unit!=="pack")){mismatch=true;return}tot+=c.n});
  if(e.unit==="pack")return{min:e.min,max:e.max,packs:1,e};
  let packs;if(e.bulk){packs=tot/e.size;if(mismatch&&packs===0)packs=1}else{packs=Math.ceil(tot/e.size-1e-9);if(mismatch)packs=Math.max(packs,1);if(packs<1)packs=1}
  return{min:e.min*packs,max:e.max*packs,packs,e}}
function aggregate(week,addons,extras){
  const u=usage(week),map=new Map();
  const add=(i,q,src)=>{const k=i.n.trim().toLowerCase();if(!k)return;const e=map.get(k)||{n:i.n,r:i.r||"Dispensa",q:[],src:new Set()};if(q)e.q.push(q);e.src.add(src);map.set(k,e)};
  Object.entries(u).forEach(([id,list])=>{const r=R(id);const m=Math.ceil(list.length/Math.max(1,r.portions));ingOf(r).forEach(i=>add(i,scaleQ(i.q,m),r.name.split(" ")[0].replace(/[,.;']$/,"")))});
  (addons||[]).forEach(id=>{const r=R(id);if(r)ingOf(r).forEach(i=>add(i,i.q,r.name.split(" ")[0]))});
  const bc={};week.forEach(d=>["p","c"].forEach(meal=>(d[meal].x||[]).forEach(id=>bc[id]=(bc[id]||0)+1)));
  Object.entries(bc).forEach(([id,n])=>{const b=B(id);if(b&&b.ing)add(b.ing,scaleQ(b.ing.q,n),"aggiunte")});
  week.forEach(d=>["col","spu"].forEach(t=>{const x=d.sn&&d.sn[t];const s=x&&SN(x.id);if(!s)return;
    s.ing.forEach(i=>add(i,i.q,t==="col"?"colazioni":"spuntini"));
    if(s.fruit&&x.f&&FRT(x.f)){const f=FRT(x.f);add({n:f.n,r:"Ortofrutta"},f.q,"frutta")}}));
  (extras||[]).forEach(i=>add(i,i.q,"extra"));
  return[...map.entries()].map(([k,v])=>({k,...v,src:[...v.src]}));
}
const shopItems=()=>aggregate(S.week,S.addons,S.extras);
function costOf(items,have=new Set()){let min=0,max=0,unknown=0;items.forEach(it=>{if(have.has(it.k)||it.r==="Basi")return;const c=itemCost(it);if(!c){unknown++;return}min+=c.min;max+=c.max});return{min,max,unknown}}
const shopKeys=(week,addons=[])=>new Set(aggregate(week,addons,[]).filter(i=>i.r!=="Basi").map(i=>i.k));
function jaccard(a,b){if(!a.size&&!b.size)return 1;let i=0;a.forEach(x=>b.has(x)&&i++);return i/(a.size+b.size-i)}

/* ============ VARIABILITÀ ============ */
function plantKey(name,rep){const n=name.trim().toLowerCase();if(PLANT[n])return PLANT[n];if(rep==="Ortofrutta")return n;return null}
function weekPlants(week,addons=[]){const set=new Set(),herbs=new Set();aggregate(week,addons,[]).forEach(it=>{const k=plantKey(it.n,it.r);if(!k)return;(HERBS.has(k)?herbs:set).add(k)});return{set,herbs}}
function weekFamilies(week){const f=new Set();eachUse(week,(r,d,m,k)=>{if(r.role==="base"&&r.family)f.add(r.family);if(r.withBase)f.add("riso")});return f}
function weekOily(week){const o=new Set();eachUse(week,r=>{if(r.oily)o.add(r.name)});return[...o]}

/* ============ GENERATORE ============ */
function fillSnacks(week,month,rnd,keep){
  const fruits=shuffle(FRUITS.filter(f=>f.months.includes(month)),rnd);
  const okNeeds=s=>!s.needs||stockCount(s.needs)>0;
  const cols=SNACKS.filter(s=>s.type==="colazione"&&okNeeds(s)),spus=SNACKS.filter(s=>s.type==="spuntino"&&okNeeds(s));
  let fi=0,prevC=null,prevS=null;
  const seen=weekPlants(week).set;
  const pk=(s,f)=>{const o=[];s.ing.forEach(i=>{const k=plantKey(i.n,i.r);if(k&&!HERBS.has(k))o.push(k)});if(f)o.push(plantKey(f.n,"Ortofrutta"));return o};
  week.forEach(d=>{
    if(!d.sn)d.sn={col:{id:null,f:null},spu:{id:null,f:null}};
    if(keep&&d.sn.col.id&&d.sn.spu.id){prevC=d.sn.col.id;prevS=d.sn.spu.id;return}
    const a=slotNut(d.p),b=slotNut(d.c);const mk=a.k+b.k,mp=a.p+b.p;const mealFerm=["p","c"].some(m=>(d[m].x||[]).some(id=>B(id)&&B(id).ferm));
    const f1=fruits.length?fruits[fi%fruits.length]:null,f2=fruits.length>1?fruits[(fi+1)%fruits.length]:f1;
    let best=null;
    cols.forEach(c=>spus.forEach(s=>{
      if(!c.ferm&&!s.ferm&&!mealFerm)return;
      const fc=c.fruit?f1:null,fs=s.fruit?(c.fruit?f2:f1):null;
      const k=mk+c.kcal+s.kcal+(fc?fc.kcal:0)+(fs?fs.kcal:0),p=mp+c.protein+s.protein+(fc?1:0)+(fs?1:0);
      const fresh=new Set([...pk(c,fc),...pk(s,fs)].filter(x=>!seen.has(x))).size;
      const sc=Math.abs(k-KCAL_TARGET)/15+Math.max(0,PROT_MIN-p)*3+Math.max(0,p-PROT_MAX)+(c.id===prevC?4:0)+(s.id===prevS?4:0)-fresh*2.5+rnd()*.8;
      if(!best||sc<best.sc)best={sc,c,s,fc,fs}}));
    if(best){d.sn={col:{id:best.c.id,f:best.fc?best.fc.id:null},spu:{id:best.s.id,f:best.fs?best.fs.id:null}};prevC=best.c.id;prevS=best.s.id;fi+=(best.fc?1:0)+(best.fs?1:0);[...pk(best.c,best.fc),...pk(best.s,best.fs)].forEach(x=>seen.add(x))}
  });
}
function addBoosters(week,rnd){
  const order=["yogurt_greco","uova","edamame","tofu_aff","parm","ceci","feta"];let o=Math.floor(rnd()*order.length),n=0;
  week.forEach(d=>{let g=0;while(dayNut(d).p<PROT_MIN&&g++<3){let meal=slotNut(d.p).p<=slotNut(d.c).p?"p":"c";if(d[meal].x.length>=1)meal=meal==="p"?"c":"p";if(d[meal].x.length>=2)break;d[meal].x.push(order[o++%order.length]);n++}});
  return n;
}
function generateWeek(weekStart,seed){
  const month=addDays(weekStart,0).getMonth()+1;
  const rnd=mulberry(seed*9973+Number(weekStart.replace(/-/g,"")));
  const prev=S.history[0]||null,prevIds=new Set(prev?prev.ids:[]),prevKeys=new Set(prev?prev.keys:[]),prevFam=new Set(prev&&prev.families?prev.families:[]);
  const recent=new Map();S.history.slice(0,3).forEach((h,k)=>h.ids.forEach(id=>recent.set(id,(recent.get(id)||0)+(3-k))));
  const pool=S.recipes.filter(r=>inSeason(r,month)&&!r.spicy);
  const mains=pool.filter(r=>r.role==="main"),bases=pool.filter(r=>r.role==="base"),sides=pool.filter(r=>r.role==="side");
  if(mains.length<2||bases.length<2)return{week:emptyWeek(),note:"Servono almeno 2 piatti principali e 2 basi di stagione nel ricettario."};
  const hasOily=mains.some(r=>r.oily);
  const weight=r=>(r.fav?2.2:1)/(1+(recent.get(r.id)||0)*.6)*(r.role==="base"&&prevFam.has(r.family)?.35:1);
  const pick=(arr,ex)=>{const c=arr.filter(r=>!ex.has(r.id));if(!c.length)return null;const tot=c.reduce((a,r)=>a+weight(r),0);let x=rnd()*tot;for(const r of c){x-=weight(r);if(x<=0)return r}return c[c.length-1]};
  const ok=(r,day)=>day<=r.fridgeDays||r.freezer;
  let best=null;
  for(let att=0;att<350;att++){
    const chosen=[],ex=new Set();let por=0,overlap=0;const want=rnd()<.85?4:3;
    if(hasOily&&rnd()<.85){const o=pick(mains.filter(r=>r.oily),ex);if(o){chosen.push(o);ex.add(o.id);por+=o.portions;if(prevIds.has(o.id))overlap++}}
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
    // basi: due famiglie diverse
    const b1=pick(bases,new Set());if(!b1)continue;const b2=pick(bases.filter(b=>b.family!==b1.family),new Set([b1.id]));if(!b2)continue;const bList=[b1,b2];
    const sx=new Set(),sList=[];const cooked=sides.filter(s=>s.equip!=="nessuno"),raw=sides.filter(s=>s.equip==="nessuno");
    const s1=pick(cooked.length?cooked:sides,sx);if(s1){sList.push(s1);sx.add(s1.id)}const s2=pick(raw.length?raw:sides,sx)||pick(sides,sx);if(s2){sList.push(s2);sx.add(s2.id)}
    const fw1=s1?s1.name.split(" ")[0]:"";const s3=pick(cooked.filter(s=>s.name.split(" ")[0]!==fw1&&(!s1||s.equip!==s1.equip||s.freezer)),sx)||pick(sides.filter(s=>s.name.split(" ")[0]!==fw1),sx);if(s3){sList.push(s3);sx.add(s3.id)}
    const week=emptyWeek();
    for(let i=0;i<10;i++){const day=Math.floor(i/2)+1,meal=i%2?"c":"p",slot=week[day-1][meal],m=slots[i];slot.m=m.id;
      if(!m.withBase){const st=day+(meal==="c"?1:0);for(let t=0;t<bList.length;t++){const b=bList[(st+t)%bList.length];if(ok(b,day)){slot.b=b.id;break}}}
      const st2=day+(meal==="p"?1:0);for(let t=0;t<sList.length;t++){const s=sList[(st2+t)%sList.length];if(ok(s,day)){slot.s=s.id;break}}
    }
    fillSnacks(week,month,rnd,false);
    const boosts=addBoosters(week,rnd);
    const keys=shopKeys(week);const sim=prev?jaccard(keys,prevKeys):0;
    if(prev&&sim>.6)continue;
    const ids=new Set();eachUse(week,r=>ids.add(r.id));const sunday=[...ids].map(R).filter(r=>r.prepMin||r.cookMin);
    const temps=new Set(sunday.filter(r=>r.equip==="forno").map(r=>r.temp)).size;
    const ovenMin=sunday.filter(r=>r.equip==="forno").reduce((a,r)=>a+r.cookMin,0),handMin=sunday.reduce((a,r)=>a+r.prepMin,0);
    let consec=0;for(let i=1;i<10;i++)if(slots[i]===slots[i-1])consec++;
    const cnt={};slots.forEach(t=>cnt[t.id]=(cnt[t.id]||0)+1);const overuse=Object.values(cnt).reduce((a,c)=>a+Math.max(0,c-3),0);
    const fw=chosen.map(r=>r.name.split(" ")[0].toLowerCase());const samey=fw.length-new Set(fw).size;
    const noOily=hasOily&&!chosen.some(r=>r.oily)?1:0;
    const lentils=Math.max(0,chosen.filter(r=>r.ing.some(i=>/lenticch/.test(i.n))).length-1);
    const famRepeat=[b1,b2].filter(b=>prevFam.has(b.family)).length;
    const plants=weekPlants(week).set.size;
    const nut=week.map(dayNut);const kDev=nut.reduce((a,n)=>a+Math.abs(n.k-KCAL_TARGET),0)/5;const pShort=nut.reduce((a,n)=>a+Math.max(0,PROT_MIN-n.p),0);
    const mealLow=nut.reduce((a,n)=>a+Math.max(0,MEAL_PROT_MIN-n.mp),0);
    const favs=[...ids].filter(id=>R(id).fav).length,rec=[...ids].reduce((a,id)=>a+(recent.get(id)||0),0);
    const cost=costOf(aggregate(week,[],[]));const costMid=(cost.min+cost.max)/2;
    const score=noOily*25+famRepeat*8+lentils*6+overuse*8+samey*7+boosts*3+kDev/12+pShort*2+mealLow*.8-Math.min(plants,36)*3
      +Math.max(0,sunday.length-8)*12+Math.max(0,temps-2)*12+Math.max(0,ovenMin-120)*.3+Math.max(0,handMin-100)*.4+consec*3-favs*2+rec*1.5+sim*20+costMid*.3+rnd();
    if(!best||score<best.score)best={score,week,sim};
  }
  if(!best)return{week:emptyWeek(),note:"Non trovo una combinazione valida con le ricette di stagione: aggiungine qualcuna."};
  return best;
}
function archiveCurrent(){
  if(!S.week||!S.weekStart)return;
  S.week.forEach(d=>["p","c"].forEach(m=>{const k=d[m].k;if(k)takeStock(k,1)}));
  S.history.unshift({weekStart:S.weekStart,ids:[...new Set(Object.keys(usage()))],keys:[...shopKeys(S.week)],families:[...weekFamilies(S.week)]});
  S.history=S.history.slice(0,6);S.addons=[];
}
function newWeekFor(ws){S.weekStart=ws;S.seed=1;const g=generateWeek(ws,S.seed);S.week=g.week;S.have=[];save();if(g.note)toast(g.note)}
function autoWeek(){
  const today=new Date();
  if(!S.week||!S.weekStart){newWeekFor(nextMonday(today));return}
  const fri=addDays(S.weekStart,4);fri.setHours(23,59);
  if(today>fri){archiveCurrent();newWeekFor(nextMonday(today));setTimeout(()=>toast("Nuova settimana pronta"),400);return}
  if(S.week.some(d=>!d.sn||!d.sn.col||!d.sn.col.id)){const rnd=mulberry(7);fillSnacks(S.week,weekMonth(),rnd,true);save()}
}

/* ============ SCORTE (magazzino) ============ */
function stockCount(rid,where){return S.stock.filter(s=>s.rid===rid&&(!where||s.where===where)).reduce((a,s)=>a+s.n,0)}
function plannedK(rid){let n=0;S.week.forEach(d=>["p","c"].forEach(m=>{if(d[m].k===rid)n++}));return n}
function addStock(rid,n,where,date){const r=R(rid);const d=date||iso(new Date());let exp;
  if(r&&r.role==="dolce"){const st=r.store||{};exp=where==="freezer"?iso(addMonths(d,st.freezer||3)):iso(addDays(d,where==="frigo"?(st.frigo||4):(st.dispensa||3)))}
  else if(r&&r.role==="fermento"){exp=iso(addMonths(iso(addDays(d,r.fermDays||7)),r.fridgeMonths||2))}
  else exp=iso(addMonths(d,(r&&r.freezerMonths)||3));
  S.stock.push({id:uid("s"),rid,name:r?r.name:rid,n,where:where||"freezer",date:d,exp});save()}
function takeStock(rid,n){let left=n;S.stock.filter(s=>s.rid===rid).sort((a,b)=>a.exp.localeCompare(b.exp)).forEach(s=>{const t=Math.min(s.n,left);s.n-=t;left-=t});S.stock=S.stock.filter(s=>s.n>0)}

/* ============ NAV ============ */
const TITLES={settimana:"Settimana",spesa:"Lista della spesa",piano:"Piano di lavoro",ricette:"Ricette",scorte:"Scorte",spuntini:"Spuntini e dolci",guida:"Guida"};
let view="settimana",backTo="ricette",scorteSeg="sughi",spSeg="frutta";
function show(v){
  view=v;Object.keys(TITLES).forEach(k=>document.getElementById("v-"+k).hidden=k!==v);
  document.querySelectorAll("nav.tabbar button").forEach(b=>b.setAttribute("aria-current",b.dataset.v===v?"page":"false"));
  document.getElementById("viewTitle").textContent=TITLES[v];
  document.getElementById("guideBtn").hidden=v==="guida";
  ({settimana:renderWeek,spesa:renderShop,piano:renderPlan,ricette:showList,scorte:renderScorte,spuntini:renderSpuntini,guida:renderGuide})[v]();
  window.scrollTo(0,0);
}
document.querySelectorAll("nav.tabbar button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.v)));
document.getElementById("guideBtn").addEventListener("click",()=>show("guida"));
function renderLabel(){document.getElementById("weekLabel").textContent=`${fmtDate(addDays(S.weekStart,0))} – ${fmtDate(addDays(S.weekStart,4))}`}

/* ============ VISTA SETTIMANA ============ */
function optList(role,sel){const m=weekMonth();const rs=S.recipes.filter(r=>r.role===role&&!r.spicy).sort((a,b)=>inSeason(b,m)-inSeason(a,m)||a.name.localeCompare(b.name));
  return `<option value="">— nessuno —</option>`+rs.map(r=>`<option value="${r.id}"${r.id===sel?" selected":""}>${esc(r.name)}${inSeason(r,m)?"":" (fuori stagione)"} · ${r.protein} g · ${r.kcal} kcal</option>`).join("")}
function stockOpts(sel){const rids=[...new Set(S.stock.filter(s=>s.where==="freezer").map(s=>s.rid))];if(sel&&!rids.includes(sel))rids.push(sel);
  return `<option value="">— nessuno —</option>`+rids.map(id=>{const r=R(id);const avail=stockCount(id,"freezer")-plannedK(id)+(id===sel?1:0);return `<option value="${id}"${id===sel?" selected":""}>${esc(r?r.name:id)} (${Math.max(0,avail)} in freezer)</option>`}).join("")}
function snackOpts(type,sel){const list=SNACKS.filter(s=>s.type===type);return `<option value="">— nessuno —</option>`+list.map(s=>`<option value="${s.id}"${s.id===sel?" selected":""}>${esc(s.name)}${s.needs&&!stockCount(s.needs)?" (serve farla)":""} · ${s.protein} g</option>`).join("")}
function fruitOpts(sel){const m=weekMonth();const list=FRUITS.slice().sort((a,b)=>b.months.includes(m)-a.months.includes(m));return list.map(f=>`<option value="${f.id}"${f.id===sel?" selected":""}>${esc(f.label)}${f.months.includes(m)?"":" (fuori stagione)"}</option>`).join("")}
function renderCostBox(el){const c=costOf(shopItems(),new Set(S.have));el.innerHTML=`<div><div class="eyebrow">Spesa stimata alla Coop</div><div class="big num">${euroR(c.min,c.max)}</div></div><div class="small muted" style="max-width:34ch">pasti, colazioni e spuntini${c.unknown?` · ${c.unknown} articoli senza prezzo`:""} · esclusi quelli già in casa</div>`}
function bar(label,val,unit,lo,hi,max){const pct=Math.min(100,val/max*100);const low=val<lo,high=val>hi;return `<div class="daybar"><div class="track"><div class="band" style="left:${lo/max*100}%;width:${(hi-lo)/max*100}%"></div><div class="fill${low||high?" low":""}" style="width:${pct}%"></div></div><div class="txt"><span>${label}</span><b class="num">${Math.round(val)} ${unit}</b></div></div>`}
function renderVariety(){
  const pl=weekPlants(S.week,S.addons),fam=[...weekFamilies(S.week)],oily=weekOily(S.week);
  const fermDays=S.week.filter(dayFerm).length;const nut=S.week.map(dayNut);
  const avgK=nut.reduce((a,n)=>a+n.k,0)/5,avgP=nut.reduce((a,n)=>a+n.p,0)/5;
  const prevFam=new Set((S.history[0]&&S.history[0].families)||[]);const famNew=fam.filter(f=>!prevFam.has(f)).length;
  const bases=[...new Set(S.week.flatMap(d=>[d.p.b,d.c.b]).filter(Boolean))].map(id=>R(id)&&R(id).name).filter(Boolean);
  document.getElementById("variety").innerHTML=`<div class="row" style="justify-content:space-between"><h3>Variabilità della settimana</h3><span class="small muted">media ${Math.round(avgK)} kcal · ${Math.round(avgP)} g proteine al giorno</span></div>
   <div class="vgrid">
    <div class="vitem ${pl.set.size>=PLANTS_TARGET?"ok":"no"}"><span class="eyebrow">Piante diverse</span><span class="big num">${pl.set.size} / ${PLANTS_TARGET}</span><span class="sub">regola dell'American Gut Project</span></div>
    <div class="vitem ${fermDays>=5?"ok":"no"}"><span class="eyebrow">Fermentati</span><span class="big num">${fermDays} / 5 giorni</span><span class="sub">almeno uno al giorno</span></div>
    <div class="vitem ${fam.length>=2&&(!prevFam.size||famNew>0)?"ok":"no"}"><span class="eyebrow">Cereali</span><span class="big">${fam.map(f=>FAMILY_LABEL[f]||f).join(" + ")||"—"}</span><span class="sub">${esc(bases.join(", "))}${prevFam.size?` · ${famNew?"diversi dalla settimana prima":"uguali alla settimana prima"}`:""}</span></div>
    <div class="vitem ${oily.length?"ok":"no"}"><span class="eyebrow">Pesce azzurro</span><span class="big">${oily.length?"sì":"no"}</span><span class="sub">${oily.length?esc(oily.join(", ")):"aggiungi sgombro o sardine: omega-3"}</span></div>
   </div>
   ${pl.set.size<PLANTS_TARGET?`<div class="infobox small"><b>Per arrivare a ${PLANTS_TARGET}:</b> ${varietyTips(pl.set).join(" · ")}</div>`:""}
   <details class="more"><summary>Quali piante ci sono</summary><p class="plantlist">${[...pl.set].sort().join(" · ")}</p>${pl.herbs.size?`<p class="plantlist"><b>Erbe e spezie:</b> ${[...pl.herbs].sort().join(" · ")}</p>`:""}</details>`;
}
function varietyTips(set){const m=weekMonth();const tips=[];
  const fr=FRUITS.filter(f=>f.months.includes(m)&&!set.has(plantKey(f.n,"Ortofrutta"))).slice(0,3).map(f=>f.label.replace(/^\d+\s*(g di )?/,""));
  if(fr.length)tips.push(`cambia la frutta di uno spuntino con ${fr.join(", ")}`);
  const nuts=[["mandorle","mandorle"],["noci","noci"],["semi di zucca","semi di zucca"],["girasole","semi di girasole"],["sesamo","semi di sesamo"]].filter(([k])=>!set.has(k)).slice(0,2).map(x=>x[1]);
  if(nuts.length)tips.push(`un cucchiaio di ${nuts.join(" o ")} su yogurt o insalata`);
  const sides=S.recipes.filter(r=>r.role==="side"&&inSeason(r,m)&&ingOf(r).some(i=>{const k=plantKey(i.n,i.r);return k&&!set.has(k)})).slice(0,2).map(r=>r.name.toLowerCase());
  if(sides.length)tips.push(`un contorno diverso (${sides.join(", ")})`);
  const ferm=S.recipes.filter(r=>r.role==="fermento"&&inSeason(r,m)&&r.ing.some(i=>{const k=plantKey(i.n,i.r);return k&&!set.has(k)})).slice(0,1).map(r=>r.name.toLowerCase());
  if(ferm.length)tips.push(`${ferm[0]} dal barattolo`);
  return tips.length?tips:["prova un cereale o un legume che non usi da tempo"]}
function computeMoves(){ // chiave = sera (0 = domenica, 1 = lunedì, ...)
  const moves={};Object.entries(usage()).forEach(([id,list])=>{const r=R(id);list.forEach(x=>{if(status(r,x.day).k==="fz")(moves[x.day-1]=moves[x.day-1]||new Set()).add(r.name)})});
  S.week.forEach((d,i)=>["p","c"].forEach(meal=>{const k=d[meal].k;if(k)(moves[i]=moves[i]||new Set()).add((R(k)||{name:k}).name+" (scorta)")}));
  return moves}
function slotStatus(s,day){const sts=PARTS.map(k=>s[k]&&R(s[k])).filter(Boolean).map(r=>status(r,day));
  if(sts.some(x=>x.k==="bad"))return{k:"bad",t:"non si conserva"};if(sts.some(x=>x.k==="fz")||s.k)return{k:"fz",t:"dal freezer"};if(sts.length)return{k:"fr",t:"frigo"};return null}
function mealTile(d,i,meal){const s=d[meal];const n=slotNut(s);const m=s.m&&R(s.m);const st=slotStatus(s,i+1);
  const extra=[s.b&&R(s.b)&&R(s.b).name,s.s&&R(s.s)&&nameOf(R(s.s)),s.k&&R(s.k)&&R(s.k).name].filter(Boolean).map(x=>x.toLowerCase());
  const adds=(s.x||[]).map(id=>B(id)).filter(Boolean).map(b=>"+ "+b.name.toLowerCase());
  return `<button class="tile" type="button" data-d="${i}" data-t="${meal}">
    <span class="tile-h"><span class="when">${meal==="p"?"Pranzo":"Cena"}</span><span class="nut">${n.k} kcal · ${n.p} g</span></span>
    ${m?`<b class="dish">${esc(nameOf(m))}</b>`:`<span class="dish muted">Tocca per scegliere</span>`}
    ${extra.length?`<span class="sub">con ${esc(extra.join(" · "))}</span>`:""}
    ${adds.length?`<span class="sub add">${esc(adds.join(" · "))}</span>`:""}
    ${s.n?`<span class="sub">${esc(s.n)}</span>`:""}
    ${st?`<span class="tape ${st.k}">${st.t}</span>`:""}
  </button>`}
function snackTile(d,i,t){const x=d.sn[t];const s=x.id&&SN(x.id);const n=snackNut(x);const f=x.f&&FRT(x.f);
  return `<button class="tile soft" type="button" data-d="${i}" data-t="${t}">
    <span class="tile-h"><span class="when">${t==="col"?"Colazione":"Spuntino"}</span><span class="nut">${s?`${n.k} kcal · ${n.p} g`:""}</span></span>
    ${s?`<b class="dish">${esc(s.name)}</b>`:`<span class="dish muted">Nessuno · tocca per scegliere</span>`}
    ${s&&s.fruit&&f?`<span class="sub">frutta: ${esc(f.label)}</span>`:""}
    <span class="row" style="gap:4px"><span class="pill">consigliato</span>${s&&s.ferm?`<span class="badge">fermentato</span>`:""}</span>
  </button>`}
function renderWeek(){
  renderLabel();const m=weekMonth();
  document.getElementById("weekIntro").innerHTML=`Settimana di <b>${MONTHS_LONG[m-1]}</b>: ricette di stagione e non piccanti, ${KCAL_TARGET} kcal e ${PROT_MIN}–${PROT_MAX} g di proteine al giorno, due cereali di famiglie diverse, un fermentato al giorno, pesce azzurro e una spesa diversa dalla settimana precedente. Tocca un riquadro per cambiarlo.`;
  renderVariety();renderCostBox(document.getElementById("weekCost"));
  const moves=computeMoves();
  const moveLine=(k,label)=>moves[k]?`<div class="moveline"><span class="tape fz">${label}</span> sposta dal freezer al frigo: ${esc([...moves[k]].join(", "))}</div>`:"";
  document.getElementById("days").innerHTML=(moves[0]?`<div class="move"><h4>Domenica sera: dal freezer al frigo</h4><p class="small">${esc([...moves[0]].join(", "))}</p></div>`:"")+S.week.map((d,i)=>{const n=dayNut(d);
    const pOk=n.p>=PROT_MIN&&n.p<=PROT_MAX,kOk=Math.abs(n.k-KCAL_TARGET)<=100;
    return `<section class="dayrow">
      <div class="dayhead"><h3>${DAYS[i]} <span>${fmtDate(addDays(S.weekStart,i))}</span></h3>
        <div class="daytot"><span class="${pOk?"okv":"badv"}">${n.p} g proteine</span><span class="${kOk?"okv":"badv"}">${n.k} kcal</span>${dayFerm(d)?`<span class="okv">fermentato ✓</span>`:`<span class="badv">manca un fermentato</span>`}</div></div>
      <div class="tiles">${snackTile(d,i,"col")}${mealTile(d,i,"p")}${snackTile(d,i,"spu")}${mealTile(d,i,"c")}</div>
      ${i<4?moveLine(i+1,"Stasera"):""}
    </section>`}).join("");
  document.querySelectorAll("#days .tile").forEach(t=>t.addEventListener("click",()=>openEditor(+t.dataset.d,t.dataset.t)));
  renderAddons();renderChecks();
}
/* ---- pannello di modifica ---- */
let editing=null;
function openEditor(i,t){editing={i,t};renderEditor();const sh=document.getElementById("sheet");sh.hidden=false;document.body.style.overflow="hidden";setTimeout(()=>{const f=sh.querySelector("select");f&&f.focus()},50)}
function closeEditor(){document.getElementById("sheet").hidden=true;document.body.style.overflow="";const e=editing;editing=null;renderWeek();if(e){const t=document.querySelector(`#days .tile[data-d="${e.i}"][data-t="${e.t}"]`);t&&t.focus()}}
document.getElementById("sheetClose").addEventListener("click",closeEditor);
document.getElementById("sheet").addEventListener("click",e=>{if(e.target.id==="sheet")closeEditor()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&editing)closeEditor()});
function renderEditor(){
  const{i,t}=editing;const d=S.week[i];const body=document.getElementById("sheetBody");
  const label={col:"Colazione",p:"Pranzo",spu:"Spuntino",c:"Cena"}[t];
  document.getElementById("sheetTitle").textContent=`${DAYS[i]} · ${label}`;
  if(t==="col"||t==="spu"){const x=d.sn[t];const s=x.id&&SN(x.id);const n=snackNut(x);
    body.innerHTML=`<label class="f">${t==="col"?"Colazione consigliata":"Spuntino consigliato"}<select id="ed-sn">${snackOpts(t==="col"?"colazione":"spuntino",x.id)}</select></label>
      ${s&&s.fruit?`<label class="f">Frutta<select id="ed-fr">${fruitOpts(x.f)}</select></label>`:""}
      ${s?`<div class="infobox small"><b>${n.k} kcal · ${n.p} g di proteine</b>${s.ferm?" · fermentato":""}<br>${esc(s.why)}</div>`:""}`;
    const sel=body.querySelector("#ed-sn");sel.addEventListener("change",()=>{x.id=sel.value||null;const ns=SN(sel.value);if(ns&&ns.fruit&&!x.f){const f=FRUITS.find(f=>f.months.includes(weekMonth()));x.f=f?f.id:null}save();renderEditor()});
    const fr=body.querySelector("#ed-fr");fr&&fr.addEventListener("change",()=>{x.f=fr.value;save();renderEditor()});
  }else{const s=d[t];const n=slotNut(s);
    const line=(k,lab,role)=>{const r=s[k]&&R(s[k]);const st=r?status(r,i+1):null;return `<label class="f">${lab}<select data-k="${k}">${optList(role,s[k])}</select></label>${st?`<div><span class="tape ${st.k}">${esc(st.t)}</span></div>`:""}`};
    const boostOpts=`<option value="">+ aggiungi</option>`+BOOSTERS.map(b=>`<option value="${b.id}">${esc(b.name)}${b.home?" (fatti in casa)":""} · +${b.protein} g</option>`).join("");
    const hasStock=S.stock.some(x=>x.where==="freezer");
    body.innerHTML=`${line("m","Piatto principale","main")}${line("b","Base (cereale)","base")}${line("s","Contorno","side")}
      ${hasStock||s.k?`<label class="f">Sugo dalle scorte<select data-kk="1">${stockOpts(s.k)}</select></label>`:""}
      <div class="f"><span class="small" style="font-weight:700;color:var(--ink-2)">Aggiunte</span><div class="row">${(s.x||[]).map((id,k)=>{const b=B(id);return b?`<span class="boost">+ ${esc(b.name)}${b.ing?` (${b.ing.q})`:""} · ${b.protein} g<button type="button" data-bx="${k}" aria-label="Togli">×</button></span>`:""}).join("")}<select class="addx" aria-label="Aggiungi" style="width:auto">${boostOpts}</select></div></div>
      <label class="f">Note<input type="text" id="ed-note" value="${esc(s.n)}" placeholder="Es. condire con limone"></label>
      <div class="infobox small"><b>${n.k} kcal · ${n.p} g di proteine</b> in questo pasto</div>`;
    body.querySelectorAll("select[data-k]").forEach(sel=>sel.addEventListener("change",()=>{s[sel.dataset.k]=sel.value||null;save();renderEditor()}));
    const kk=body.querySelector("select[data-kk]");kk&&kk.addEventListener("change",()=>{s.k=kk.value||null;save();renderEditor()});
    body.querySelectorAll("[data-bx]").forEach(b=>b.addEventListener("click",()=>{s.x.splice(+b.dataset.bx,1);save();renderEditor()}));
    body.querySelector(".addx").addEventListener("change",e=>{if(!e.target.value)return;s.x.push(e.target.value);save();renderEditor()});
    body.querySelector("#ed-note").addEventListener("change",e=>{s.n=e.target.value;save()});
  }
  const dn=dayNut(d);document.getElementById("sheetDay").innerHTML=`Giornata: <b>${dn.p} g</b> di proteine · <b>${dn.k} kcal</b>`;
}
function renderAddons(){
  const el=document.getElementById("addonsBox");if(!S.addons.length){el.innerHTML="";return}
  el.innerHTML=`<div class="panel stack"><h3>In programma domenica, oltre ai pasti</h3>${S.addons.map((id,i)=>{const r=R(id);if(!r)return"";
    const where=r.role==="dolce"?Object.entries(r.store||{}).filter(([,v])=>v>0).map(([w])=>w):r.role==="fermento"?["frigo"]:["freezer"];
    return `<div class="stockrow"><div><b>${esc(r.name)}</b><div class="sub">${ROLE[r.role]} · ${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}</div></div>
      <div class="row">${where.map(w=>`<button class="btn sm" type="button" data-done="${i}" data-w="${w}">Fatto → ${r.role==="fermento"?"barattolo":w}</button>`).join("")}<button class="btn ghost sm" type="button" data-rm="${i}" aria-label="Togli">×</button></div></div>`}).join("")}
    <p class="small muted">Gli ingredienti sono nella lista della spesa e i tempi nel piano. Quando l'hai preparato, tocca "Fatto" per metterlo nelle scorte.</p></div>`;
  el.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>{S.addons.splice(+b.dataset.rm,1);save();renderWeek()}));
  el.querySelectorAll("[data-done]").forEach(b=>b.addEventListener("click",()=>{const id=S.addons[+b.dataset.done];const r=R(id);addStock(id,r.portions,b.dataset.w);S.addons.splice(+b.dataset.done,1);save();toast(`${r.name}: nelle scorte`);renderWeek()}));
}
function renderChecks(){
  const u=usage(),moves={},warns=[],extra=[];
  Object.entries(u).forEach(([id,list])=>{const r=R(id);
    list.forEach(x=>{const st=status(r,x.day);if(st.k==="fz")(moves[x.day-1]=moves[x.day-1]||new Set()).add(r.name);
      if(st.k==="bad")warns.push(`<b>${esc(r.name)}</b> ${DAYS[x.day-1].toLowerCase()}: dura ${r.fridgeDays} giorni e non si congela. Spostala prima nella settimana.`)});
    const batches=Math.ceil(list.length/Math.max(1,r.portions)),left=batches*r.portions-list.length;
    if(batches>1)warns.push(`<b>${esc(r.name)}</b> serve ${list.length} volte e rende ${r.portions} porzioni: nella spesa le dosi sono ×${batches}.`);
    if(left>0&&r.role==="main")extra.push({r,left})});
  S.week.forEach((d,i)=>["p","c"].forEach(meal=>{const k=d[meal].k;if(k)(moves[i]=moves[i]||new Set()).add((R(k)||{name:k}).name+" (scorta)")}));
  S.week.forEach((d,i)=>{const n=dayNut(d);if(n.p<PROT_MIN)warns.push(`<b>${DAYS[i]}</b>: ${n.p} g di proteine, sotto gli ${PROT_MIN}.`);
    if(Math.abs(n.k-KCAL_TARGET)>200)warns.push(`<b>${DAYS[i]}</b>: ${n.k} kcal, ${n.k>KCAL_TARGET?"sopra":"sotto"} le ${KCAL_TARGET} di più di 200.`)});
  S.week.forEach((d,i)=>["col","spu"].forEach(t=>{const s=SN(d.sn[t].id);if(s&&s.needs&&!stockCount(s.needs)&&!S.addons.includes(s.needs))warns.push(`<b>${DAYS[i]}</b>: "${esc(s.name)}" richiede ${esc(R(s.needs).name.toLowerCase())}, che non hai in casa. Mettila in programma dalla sezione Dolci.`)}));
  [...new Set(S.week.flatMap(d=>[d.p.k,d.c.k]).filter(Boolean))].filter(id=>plannedK(id)>stockCount(id,"freezer")).forEach(id=>warns.push(`<b>${esc((R(id)||{}).name||id)}</b>: in settimana ne usi ${plannedK(id)}, in freezer ne hai ${stockCount(id,"freezer")}.`));
  const prev=S.history[0];
  if(prev){const sim=jaccard(shopKeys(S.week,S.addons),new Set(prev.keys));if(sim>.6)warns.push(`La spesa è molto simile a quella della settimana precedente (${Math.round(sim*100)}% di ingredienti in comune).`)}
  let h="";
  if(warns.length)h+=`<div class="warnbox"><h4>Da controllare</h4><ul>${warns.map(w=>`<li>${w}</li>`).join("")}</ul></div>`;
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
      ${editingPrice===i.k?`<div class="priceedit"><label>Confezione<input type="text" id="pe-size" value="${e?esc(e.unit==="pack"?"1":`${e.size} ${e.unit}`):""}" placeholder="500 g"></label><label>Prezzo €<input type="number" step="0.01" min="0" id="pe-price" value="${e?((e.min+e.max)/2).toFixed(2):""}"></label><button class="btn sm" type="button" id="pe-save">Salva</button></div>`:""}</div>`}).join("")});
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
  for(const r of order){const prep=r5(r.prepMin||0),cook=r5(r.cookMin||0);const pe=hands+prep;
    if(prep>0){tasks.push({lane:"mani",s:hands,e:pe,t:`Prepara: ${r.name}`});hands=pe}
    if(r.equip==="forno"&&cook>0){const temp=r.temp||200;let t=Math.max(pe,PREHEAT,oven.length?oven[oven.length-1].s:0);
      for(let g=0;g<400;g++,t+=5){const over=oven.filter(o=>o.s<t+cook&&o.e>t);if(over.some(o=>o.temp!==temp))continue;
        const before=oven.filter(o=>o.e<=t).sort((a,b)=>b.e-a.e)[0];if(before&&before.temp!==temp&&!over.length&&t<before.e+(temp<before.temp?5:10))continue;
        let fit=true;for(let m=t;m<t+cook;m+=5)if(oven.filter(o=>o.s<=m&&o.e>m).length>=2){fit=false;break}if(fit)break}
      oven.push({s:t,e:t+cook,temp});tasks.push({lane:"forno",s:t,e:t+cook,t:`${r.name} · ${temp} °C`})}
    else if(r.equip==="fuochi"&&cook>0){const b=burners[0]<=burners[1]?0:1;const s=Math.max(pe,burners[b]);burners[b]=s+cook;tasks.push({lane:b?"f2":"f1",s,e:s+cook,t:r.name})}}
  return{tasks,oven,end:Math.max(hands,0,...tasks.map(t=>t.e))};
}
function bestPlan(recs){
  if(!recs.length)return null;let best=null;const tryO=o=>{const s=simulate(o);if(!best||s.end<best.end)best=s};
  if(recs.length<=7){const perm=function*(a){if(a.length<=1){yield a.slice();return}for(let i=0;i<a.length;i++){const rest=a.slice(0,i).concat(a.slice(i+1));for(const p of perm(rest)){p.unshift(a[i]);yield p}}};for(const p of perm(recs))tryO(p)}
  else{const rnd=mulberry(42);tryO(recs.slice().sort((a,b)=>b.cookMin-a.cookMin));for(let i=0;i<6000;i++)tryO(shuffle(recs,rnd))}
  if(best.oven.length){const f=best.oven.slice().sort((a,b)=>a.s-b.s)[0];best.tasks.push({lane:"forno",s:Math.max(0,f.s-PREHEAT),e:f.s,t:`Accendi a ${f.temp} °C`})}
  best.tasks.push({lane:"mani",s:best.end,e:best.end+20,t:"Porziona, etichetta, frigo o freezer entro 2 h"});best.end+=20;return best;
}
const fmtT=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
function eggsNeeded(){let n=0;S.week.forEach(d=>{["p","c"].forEach(m=>(d[m].x||[]).forEach(id=>{if(id==="uova")n+=2}));["col","spu"].forEach(t=>{const s=SN(d.sn[t].id);if(s&&s.eggs)n+=s.eggs})});return n}
function renderPlan(){
  const recs=[...Object.keys(usage()).map(R),...S.addons.map(R)].filter(r=>r&&(r.prepMin||r.cookMin));
  const eggs=eggsNeeded();if(eggs)recs.push({name:`${eggs} uova sode (9 minuti)`,prepMin:0,cookMin:10,equip:"fuochi"});
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
function card(r){const m=weekMonth();const season=inSeason(r,m)?"di stagione":"fuori stagione";
  const sub=r.role==="dolce"?`${r.kcal} kcal/pezzo · ${season}`:r.role==="scorta"?`${stockCount(r.id,"freezer")} in freezer · ${season}`:r.role==="fermento"?`${r.fermDays} giorni · ${season}`:`${r.protein} g · ${r.kcal} kcal · ${season}`;
  return `<button class="rcard" type="button" data-id="${r.id}">${picHTML(r)}${r.fav?`<span class="favdot" aria-label="Preferita">★</span>`:""}<div class="t"><b>${esc(r.name)}</b><span>${sub}</span></div></button>`}
const FILTERS=[["tutte","Tutte"],["preferite","★ Preferite"],["stagione","Di stagione"],["main","Principali"],["base","Cereali"],["side","Contorni"],["mie","Mie"]];
function bindCards(root,from){root.querySelectorAll(".rcard").forEach(b=>b.addEventListener("click",()=>{backTo=from;if(view!=="ricette"){view="ricette";Object.keys(TITLES).forEach(k=>document.getElementById("v-"+k).hidden=k!=="ricette");document.querySelectorAll("nav.tabbar button").forEach(x=>x.setAttribute("aria-current",x.dataset.v===from?"page":"false"))}showDetail(b.dataset.id)}))}
function showList(){
  document.getElementById("rList").hidden=false;document.getElementById("rDetail").hidden=true;document.getElementById("rEdit").hidden=true;
  document.getElementById("viewTitle").textContent="Ricette";
  const favs=S.recipes.filter(r=>r.fav);const fs=document.getElementById("favSection");
  fs.innerHTML=`<h2>★ Preferite</h2>`+(favs.length?`<div class="fav-strip">${favs.map(card).join("")}</div><p class="small muted">Le preferite compaiono più spesso nelle settimane generate.</p>`:`<p class="small muted">Nessuna preferita ancora. Apri una ricetta, un sugo, un fermentato o un dolce e tocca la stella.</p>`);
  const f=S.filter||"tutte",m=weekMonth();
  document.getElementById("filters").innerHTML=FILTERS.map(([k,l])=>`<button class="chip" type="button" data-f="${k}" aria-pressed="${k===f}">${l}</button>`).join("");
  document.querySelectorAll("[data-f]").forEach(b=>b.addEventListener("click",()=>{S.filter=b.dataset.f;save();showList()}));
  const libIds=new Set(LIB.map(l=>l.id));const meal=r=>["main","base","side"].includes(r.role);
  const list=S.recipes.filter(r=>f==="tutte"?meal(r):f==="preferite"?r.fav:f==="stagione"?meal(r)&&inSeason(r,m):f==="mie"?!libIds.has(r.id):r.role===f);
  const g=document.getElementById("rgrid");g.innerHTML=list.map(card).join("")||`<p class="muted">Nessuna ricetta in questo filtro.</p>`;
  bindCards(fs,"ricette");bindCards(g,"ricette");drawCanvases();
}
function goBack(){if(backTo==="ricette")showList();else show(backTo)}
function showDetail(id){
  const r=R(id);if(!r)return goBack();
  document.getElementById("rList").hidden=true;document.getElementById("rEdit").hidden=true;
  const el=document.getElementById("rDetail");el.hidden=false;
  const eq=r.equip==="forno"?`forno ${r.temp} °C`:r.equip==="fuochi"?"fornello":"senza cottura";const m=weekMonth();
  let meta=`<span>${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}</span><span>prep ${r.prepMin} min</span>${r.cookMin?`<span>cottura ${r.cookMin} min · ${eq}</span>`:""}`;
  meta=`<span><b>${r.kcal||"?"} kcal</b> e <b>${r.protein||0} g</b> proteine ${r.role==="dolce"?"a pezzo":"a porzione"}</span>`+meta;
  if(["main","base","side"].includes(r.role))meta+=`<span>${r.id==="pane"?"dispensa":"frigo"} ${r.fridgeDays} gg</span><span>${r.freezer?"si congela":"non congelare"}</span>`;
  if(r.role==="base"&&r.family)meta+=`<span>famiglia: ${FAMILY_LABEL[r.family]||r.family}</span>`;
  if(r.role==="scorta")meta+=`<span>freezer ${r.freezerMonths||3} mesi</span>`;
  if(r.role==="fermento")meta+=`<span>fermenta ${r.fermDays} giorni</span><span>poi frigo ${r.fridgeMonths} mesi</span>`;
  let action="";
  if(["scorta","dolce","fermento"].includes(r.role)){const inProg=S.addons.includes(r.id);
    const where=r.role==="dolce"?Object.entries(r.store||{}).filter(([,v])=>v>0).map(([w])=>w):r.role==="fermento"?["frigo"]:["freezer"];
    action=`<div class="panel stack"><div class="row"><button class="btn sm" type="button" id="prog">${inProg?"✓ In programma domenica (togli)":"Metti in programma domenica"}</button></div>
      <p class="small muted">In programma: gli ingredienti entrano nella spesa e i tempi nel piano.</p>
      <div class="row"><span class="small"><b>L'hai già preparato?</b> Aggiungi ${r.portions} ${r.role==="dolce"?"pezzi":"porzioni"}:</span>${where.map(w=>`<button class="btn ghost sm" type="button" data-add="${w}">${r.role==="fermento"?"barattolo avviato oggi":"in "+w}</button>`).join("")}</div></div>`}
  el.innerHTML=`<div class="row"><button class="btn ghost sm" type="button" id="back">← Indietro</button><span style="flex:1"></span><button class="star" type="button" id="fav" aria-pressed="${!!r.fav}" aria-label="Preferita">${r.fav?"★":"☆"}</button><button class="btn sm" type="button" id="edit">Modifica</button></div>
    ${picHTML(r,"hero")}
    <div class="eyebrow">${ROLE[r.role]||""}</div><h2>${esc(r.name)}</h2>
    <div class="meta">${meta}</div>
    <div class="season"><span class="pill ${inSeason(r,m)?"in":""}">stagione: ${monthsLabel(r.months)}</span>${r.oily?`<span class="pill in">pesce azzurro · omega-3</span>`:""}${r.role==="dolce"?`<span class="pill in">zuccheri aggiunti: ${r.sugar||0} g</span>`:""}${r.spicy?`<span class="pill dairy">piccante: non viene proposta</span>`:""}</div>
    ${r.uses?`<div class="infobox small"><b>Condisce:</b> ${esc(r.uses)}</div>`:""}
    ${r.salt?`<div class="infobox small"><b>Sale:</b> ${esc(r.salt)}</div>`:""}
    ${r.store?`<div class="infobox small"><b>Si conserva:</b> ${[r.store.dispensa?`dispensa ${r.store.dispensa} gg`:"",r.store.frigo?`frigo ${r.store.frigo} gg`:"",r.store.freezer?`freezer ${r.store.freezer} mesi`:""].filter(Boolean).join(" · ")}</div>`:""}
    ${action}
    ${r.seasonal?`<div class="infobox small"><b>Si adatta alla stagione.</b> Questa settimana: ${esc(seasonalPick(r).map(v=>v.n).join(", "))}. A ${MONTHS_LONG[m-1]} può usare: ${esc(SEASONAL_VEG.filter(v=>v.months.includes(m)&&v[r.seasonal]).map(v=>v.n).join(", "))}. Cambia ogni settimana.</div>`:""}
    ${(()=>{const off=seasonIssues(ingOf(r),[m]);return off.length?`<div class="warnbox small">A ${MONTHS_LONG[m-1]} non sono di stagione: ${off.map(x=>`<b>${esc(x.n)}</b> (${monthsLabel(x.s)})`).join(", ")}.</div>`:""})()}
    <div class="panel"><h4 style="margin-bottom:6px">Ingredienti${r.seasonal?" di questa settimana":""}</h4><ul class="ing">${ingOf(r).map(i=>`<li><span class="q">${esc(i.q)}</span><span>${esc(i.n)}</span></li>`).join("")}</ul></div>
    <div class="panel"><h4 style="margin-bottom:6px">Procedimento</h4><ol class="steps">${r.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
    <div class="notes">${r.cons?`<div class="note cons"><h4>Conservazione</h4>${esc(r.cons)}</div>`:""}${r.par?`<div class="note par"><h4>In parallelo</h4>${esc(r.par)}</div>`:""}${r.think?`<div class="note think"><h4>Pensaci</h4>${esc(r.think)}</div>`:""}</div>
    ${r.photo?"":`<p class="small muted">Tocca Modifica per aggiungere una tua foto.</p>`}`;
  el.querySelector("#back").addEventListener("click",goBack);
  el.querySelector("#edit").addEventListener("click",()=>showEdit(id));
  el.querySelector("#fav").addEventListener("click",e=>{r.fav=!r.fav;save();e.currentTarget.setAttribute("aria-pressed",r.fav);e.currentTarget.textContent=r.fav?"★":"☆";toast(r.fav?"Aggiunta alle preferite":"Tolta dalle preferite")});
  const pg=el.querySelector("#prog");pg&&pg.addEventListener("click",()=>{const i=S.addons.indexOf(r.id);i>=0?S.addons.splice(i,1):S.addons.push(r.id);save();toast(i>=0?"Tolta dal programma":"In programma domenica: è nella spesa");showDetail(id)});
  el.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{addStock(r.id,r.portions,b.dataset.add);toast("Aggiunto alle scorte");showDetail(id)}));
  document.getElementById("viewTitle").textContent=ROLE[r.role]||"Ricetta";drawCanvases();window.scrollTo(0,0);
}
let draft=null;
function showEdit(id,role){
  const src=id?R(id):{id:null,name:"",role:role||"main",protein:20,kcal:300,portions:4,prepMin:10,cookMin:20,equip:"fuochi",temp:180,fridgeDays:3,freezer:true,family:"",months:M("all"),fav:false,spicy:false,freezerMonths:3,uses:"",fermDays:7,fridgeMonths:3,salt:"",store:{dispensa:3,frigo:5,freezer:3},sugar:0,ing:[{q:"",n:"",r:"Ortofrutta"}],steps:[],cons:"",par:"",think:"",photo:null};
  draft=clone(src);if(!draft.store)draft.store={dispensa:0,frigo:0,freezer:0};
  document.getElementById("rList").hidden=true;document.getElementById("rDetail").hidden=true;
  const f=document.getElementById("rEdit");f.hidden=false;
  document.getElementById("viewTitle").textContent=id?"Modifica":"Nuova ricetta";
  f.innerHTML=`<div class="row"><button class="btn ghost sm" type="button" id="cancel">Annulla</button><span style="flex:1"></span><button class="btn sm" type="submit">Salva</button></div>
    <label class="f">Nome<input type="text" id="e-name" required value="${esc(draft.name)}" placeholder="Es. Vellutata di zucca e ceci"></label>
    <div class="three"><label class="f">Tipo<select id="e-role">${Object.entries(ROLE).map(([k,l])=>`<option value="${k}"${draft.role===k?" selected":""}>${l}</option>`).join("")}</select></label>
      <label class="f">Proteine / porzione (g)<input type="number" id="e-prot" min="0" max="120" value="${draft.protein||0}"></label>
      <label class="f">Calorie / porzione<input type="number" id="e-kcal" min="0" max="2000" value="${draft.kcal||0}"></label></div>
    <p class="small muted">Per stimare: somma proteine e calorie degli ingredienti (sull'etichetta, per 100 g) più l'olio di cottura, e dividi per le porzioni.</p>
    <label class="f" id="e-fam-l">Famiglia del cereale<select id="e-fam">${Object.entries(FAMILY_LABEL).map(([k,l])=>`<option value="${k}"${draft.family===k?" selected":""}>${l}</option>`).join("")}<option value="altro"${draft.family==="altro"?" selected":""}>altro</option></select></label>
    <div class="row"><label class="check"><input type="checkbox" id="e-spicy" ${draft.spicy?"checked":""}> Piccante (non verrà mai proposta)</label><label class="check"><input type="checkbox" id="e-oily" ${draft.oily?"checked":""}> Pesce azzurro</label></div>
    <div class="panel stack"><h4>Foto</h4><div id="e-photo-prev"></div>
      <div class="row"><label class="btn ghost sm" for="e-photo" style="display:inline-flex;align-items:center">${draft.photo?"Cambia foto":"Scatta o scegli una foto"}</label><input type="file" id="e-photo" accept="image/*" hidden>${draft.photo?`<button class="btn warn sm" type="button" id="e-photo-rm">Togli foto</button>`:""}</div></div>
    <div class="panel stack"><h4>Stagione</h4><p class="small muted">Nei mesi non spuntati non viene proposta in automatico.</p>
      <div class="months">${MONTHS.map((mm,k)=>`<label><input type="checkbox" data-mo="${k+1}" ${draft.months.includes(k+1)?"checked":""}>${mm}</label>`).join("")}</div>
      <div class="row"><button class="btn ghost sm" type="button" id="allM">Tutto l'anno</button><button class="btn ghost sm" type="button" id="fromIng">Usa i mesi degli ingredienti</button></div>
      <div id="e-season"></div></div>
    ${draft.seasonal?`<div class="infobox small">Le verdure di questa ricetta le sceglie l'app in base al mese. Qui modifichi solo gli ingredienti fissi.</div>`:""}
    <div class="panel stack"><h4>Tempi e attrezzatura</h4><p class="small muted">"Preparazione" è il tempo in cui usi le mani, "cottura" quello in cui cuoce da sola: servono al piano di lavoro.</p>
      <div class="three"><label class="f">Porzioni / pezzi<input type="number" id="e-portions" min="1" max="40" value="${draft.portions}"></label>
        <label class="f">Preparazione (min)<input type="number" id="e-prep" min="0" max="240" value="${draft.prepMin}"></label>
        <label class="f">Cottura (min)<input type="number" id="e-cook" min="0" max="480" value="${draft.cookMin}"></label></div>
      <div class="two"><label class="f">Cottura in<select id="e-equip"><option value="forno"${draft.equip==="forno"?" selected":""}>Forno</option><option value="fuochi"${draft.equip==="fuochi"?" selected":""}>Fornello</option><option value="nessuno"${draft.equip==="nessuno"?" selected":""}>Niente</option></select></label>
        <label class="f" id="e-temp-l">Temperatura (°C)<input type="number" id="e-temp" min="50" max="280" step="5" value="${draft.temp||180}"></label></div>
      <label class="check" id="e-wb-l"><input type="checkbox" id="e-wb" ${draft.withBase?"checked":""}> Contiene già il cereale (niente base in quel pasto)</label></div>
    <div class="panel stack" id="e-cons-meal"><h4>Conservazione</h4>
      <div class="two"><label class="f">Giorni in frigo<input type="number" id="e-fridge" min="0" max="10" value="${draft.fridgeDays||0}"></label>
      <label class="check" style="align-self:end;padding-bottom:10px"><input type="checkbox" id="e-freezer" ${draft.freezer?"checked":""}> Si può congelare</label></div></div>
    <div class="panel stack" id="e-cons-scorta"><h4>Sugo da freezer</h4>
      <div class="two"><label class="f">Mesi in freezer<input type="number" id="e-fzm" min="1" max="12" value="${draft.freezerMonths||3}"></label>
      <label class="f">Condisce<input type="text" id="e-uses" value="${esc(draft.uses||"")}" placeholder="pasta, riso, legumi"></label></div></div>
    <div class="panel stack" id="e-cons-ferm"><h4>Fermentazione</h4>
      <div class="three"><label class="f">Giorni di fermentazione<input type="number" id="e-fd" min="1" max="60" value="${draft.fermDays||7}"></label>
      <label class="f">Poi in frigo (mesi)<input type="number" id="e-fm" min="1" max="12" value="${draft.fridgeMonths||2}"></label>
      <label class="f">Sale<input type="text" id="e-salt" value="${esc(draft.salt||"")}" placeholder="2,5%"></label></div></div>
    <div class="panel stack" id="e-cons-dolce"><h4>Dove si conserva (0 = no)</h4>
      <div class="three"><label class="f">Dispensa (giorni)<input type="number" id="e-sd" min="0" max="90" value="${draft.store.dispensa||0}"></label>
      <label class="f">Frigo (giorni)<input type="number" id="e-sf" min="0" max="90" value="${draft.store.frigo||0}"></label>
      <label class="f">Freezer (mesi)<input type="number" id="e-sz" min="0" max="12" value="${draft.store.freezer||0}"></label></div>
      <label class="f">Zuccheri aggiunti per pezzo (g)<input type="number" id="e-sugar" min="0" max="50" value="${draft.sugar||0}"></label></div>
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
  const sync=()=>{const role=g("#e-role").value;g("#e-temp-l").hidden=g("#e-equip").value!=="forno";g("#e-cons-meal").hidden=!["main","base","side"].includes(role);g("#e-cons-scorta").hidden=role!=="scorta";g("#e-cons-dolce").hidden=role!=="dolce";g("#e-cons-ferm").hidden=role!=="fermento";g("#e-fam-l").hidden=role!=="base";g("#e-wb-l").hidden=role!=="main"};
  sync();g("#e-equip").addEventListener("change",sync);g("#e-role").addEventListener("change",sync);
  const checkSeason=()=>{readIng();const months=[...f.querySelectorAll("[data-mo]")].filter(c=>c.checked).map(c=>+c.dataset.mo);const off=seasonIssues(draft.ing,months);const box=g("#e-season");
    box.innerHTML=off.length?`<div class="warnbox small">Fuori stagione in alcuni mesi spuntati: ${off.map(x=>`<b>${esc(x.n)}</b> (di stagione ${monthsLabel(x.s)})`).join(", ")}.</div>`:(draft.ing.some(i=>produceSeason(i.n||""))?`<p class="small muted">Tutti gli ingredienti freschi sono di stagione nei mesi spuntati.</p>`:"")};
  g("#allM").addEventListener("click",()=>{f.querySelectorAll("[data-mo]").forEach(c=>c.checked=true);checkSeason()});
  g("#fromIng").addEventListener("click",()=>{readIng();const inter=seasonIntersection(draft.ing);if(!inter.length){g("#e-season").innerHTML=`<div class="warnbox small">Non c'è nessun mese in cui questi ingredienti siano tutti di stagione insieme. Forse conviene dividerla in due versioni, una per stagione.</div>`;return}
    f.querySelectorAll("[data-mo]").forEach(c=>c.checked=inter.includes(+c.dataset.mo));checkSeason();toast(inter.length===12?"Tutto l'anno":"Mesi impostati: "+monthsLabel(inter))});
  f.querySelectorAll("[data-mo]").forEach(c=>c.addEventListener("change",checkSeason));
  g("#e-ing").addEventListener("change",checkSeason);checkSeason();
  g("#cancel").addEventListener("click",()=>id?showDetail(id):goBack());
  g("#e-addIng").addEventListener("click",()=>{readIng();draft.ing.push({q:"",n:"",r:"Ortofrutta"});renderIngRows()});
  g("#e-photo").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{draft.photo=await shrink(file);renderPhotoPrev();toast("Foto pronta: ricordati di salvare")}catch(err){toast("Non riesco a leggere questa foto")}});
  const rm=g("#e-photo-rm");rm&&rm.addEventListener("click",()=>{draft.photo=null;renderPhotoPrev();rm.remove()});
  if(id){g("#e-del").addEventListener("click",()=>g("#delConfirm").hidden=false);g("#delNo").addEventListener("click",()=>g("#delConfirm").hidden=true);
    g("#delYes").addEventListener("click",()=>{S.recipes=S.recipes.filter(r=>r.id!==id);S.week.forEach(d=>["p","c"].forEach(m=>{PARTS.forEach(k=>{if(d[m][k]===id)d[m][k]=null});if(d[m].k===id)d[m].k=null}));S.addons=S.addons.filter(a=>a!==id);save();toast("Eliminata");goBack()});
    g("#e-dup").addEventListener("click",()=>{const c=clone(R(id));c.id=uid();c.name+=" (copia)";delete c.draw;c.edited=true;S.recipes.push(c);save();toast("Duplicata");showEdit(c.id)})}
  f.onsubmit=e=>{e.preventDefault();readIng();
    const months=[...f.querySelectorAll("[data-mo]")].filter(c=>c.checked).map(c=>+c.dataset.mo);
    const rec={...draft,edited:true,name:g("#e-name").value.trim()||"Senza nome",role:g("#e-role").value,protein:Math.max(0,+g("#e-prot").value||0),kcal:Math.max(0,+g("#e-kcal").value||0),portions:Math.max(1,+g("#e-portions").value||1),
      prepMin:Math.max(0,+g("#e-prep").value||0),cookMin:Math.max(0,+g("#e-cook").value||0),equip:g("#e-equip").value,temp:+g("#e-temp").value||180,family:g("#e-fam").value,withBase:g("#e-wb").checked,
      spicy:g("#e-spicy").checked,oily:g("#e-oily").checked,fridgeDays:Math.max(0,+g("#e-fridge").value||0),freezer:g("#e-freezer").checked,
      freezerMonths:Math.max(1,+g("#e-fzm").value||3),uses:g("#e-uses").value.trim(),fermDays:Math.max(1,+g("#e-fd").value||7),fridgeMonths:Math.max(1,+g("#e-fm").value||2),salt:g("#e-salt").value.trim(),
      store:{dispensa:+g("#e-sd").value||0,frigo:+g("#e-sf").value||0,freezer:+g("#e-sz").value||0},sugar:Math.max(0,+g("#e-sugar").value||0),
      cons:g("#e-cons").value.trim(),months:months.length?months:M("all"),steps:g("#e-steps").value.split("\n").map(s=>s.trim()).filter(Boolean),par:g("#e-par").value.trim(),think:g("#e-think").value.trim(),fav:g("#e-fav").checked,ing:draft.ing.filter(i=>i.n.trim())};
    if(rec.role!=="dolce"){delete rec.store;delete rec.sugar}
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

/* ============ SCORTE E FERMENTATI ============ */
function stockRows(filterFn,emptyMsg){
  const today=iso(new Date());const items=S.stock.filter(filterFn).sort((a,b)=>a.exp.localeCompare(b.exp));
  if(!items.length)return `<p class="small muted">${emptyMsg}</p>`;
  return items.map(s=>{const r=R(s.rid);const late=s.exp<today,soon=!late&&s.exp<iso(addDays(today,14));
    let where=s.where;if(r&&r.role==="fermento"){const ready=iso(addDays(s.date,r.fermDays||7));where=ready>today?`in fermentazione fino al ${fmtDate(new Date(ready+"T12:00:00"))}, poi frigo`:"in frigo"}
    return `<div class="stockrow"><div><b>${esc(s.name)}</b><div class="sub${late?" late":""}">${where} · dal ${fmtDate(new Date(s.date+"T12:00:00"))} · ${late?"scaduto il ":soon?"da usare entro il ":"entro il "}${fmtDate(new Date(s.exp+"T12:00:00"))}</div></div>
      <div class="counter"><button type="button" data-sm="${s.id}" aria-label="Usa una porzione">−</button><span>${s.n}</span><button type="button" data-sp="${s.id}" aria-label="Aggiungi una porzione">+</button></div></div>`}).join("")}
function bindStock(root,rerender){
  root.querySelectorAll("[data-sm]").forEach(b=>b.addEventListener("click",()=>{const s=S.stock.find(x=>x.id===b.dataset.sm);if(!s)return;s.n--;if(s.n<=0)S.stock=S.stock.filter(x=>x!==s);save();rerender()}));
  root.querySelectorAll("[data-sp]").forEach(b=>b.addEventListener("click",()=>{const s=S.stock.find(x=>x.id===b.dataset.sp);if(!s)return;s.n++;save();rerender()}))}
let scorteF="stagione",dolciF="stagione",fermF="stagione";
function seasonFilter(id,cur,set,labelAll,newLabel,role,from){const m=weekMonth();
  const el=document.getElementById(id);el.innerHTML=[["stagione","Di stagione"],["tutte",labelAll]].map(([k,l])=>`<button class="chip" type="button" data-sf="${k}" aria-pressed="${k===cur}">${l}</button>`).join("")+`<button class="btn ghost sm" type="button" data-new="1">+ ${newLabel}</button>`;
  el.querySelectorAll("[data-sf]").forEach(b=>b.addEventListener("click",()=>set(b.dataset.sf)));
  el.querySelector("[data-new]").addEventListener("click",()=>{backTo=from;view="ricette";document.getElementById("v-"+from).hidden=true;document.getElementById("v-ricette").hidden=false;showEdit(null,role)})}
function renderGrid(gridId,role,filter,from,emptyMsg){const m=weekMonth();const list=S.recipes.filter(r=>r.role===role&&(filter==="tutte"||inSeason(r,m))).sort((a,b)=>inSeason(b,m)-inSeason(a,m));
  const g=document.getElementById(gridId);g.innerHTML=list.map(card).join("")||`<p class="muted">${emptyMsg}</p>`;bindCards(g,from);drawCanvases()}
function renderScorte(){
  document.querySelectorAll("[data-seg]").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.seg===scorteSeg);b.onclick=()=>{scorteSeg=b.dataset.seg;renderScorte()}});
  document.getElementById("seg-sughi").hidden=scorteSeg!=="sughi";document.getElementById("seg-fermentati").hidden=scorteSeg!=="fermentati";
  if(scorteSeg==="sughi"){
    const el=document.getElementById("stockList");
    el.innerHTML=`<h3 style="margin-bottom:6px">In freezer adesso</h3>`+stockRows(s=>s.where==="freezer"&&(!R(s.rid)||!["dolce","fermento"].includes(R(s.rid).role)),"Il freezer è vuoto. Prepara un sugo qui sotto, oppure metti nelle scorte le porzioni che avanzano dalla settimana.");
    bindStock(el,renderScorte);
    seasonFilter("scorteFilter",scorteF,v=>{scorteF=v;renderScorte()},"Tutte","Nuovo sugo","scorta","scorte");
    renderGrid("scorteGrid","scorta",scorteF,"scorte","Nessun sugo di stagione: guarda \"Tutte\".");
  }else{
    const el=document.getElementById("fermStock");
    el.innerHTML=`<h3 style="margin-bottom:6px">Barattoli in corso e in frigo</h3>`+stockRows(s=>R(s.rid)&&R(s.rid).role==="fermento","Nessun barattolo. Scegli una ricetta qui sotto: quando l'avvii, toccando \"barattolo avviato oggi\" l'app ti dice quando è pronto e fino a quando dura.");
    bindStock(el,renderScorte);
    renderFermGuide();
    seasonFilter("fermFilter",fermF,v=>{fermF=v;renderScorte()},"Tutti","Nuovo fermentato","fermento","scorte");
    renderGrid("fermGrid","fermento",fermF,"scorte","Nessun fermentato di stagione: guarda \"Tutti\".");
  }
}
function renderFermGuide(){
  document.getElementById("fermGuide").innerHTML=`
  <h3>Perché un fermentato al giorno</h3>
  <p class="small muted">In uno studio di Stanford (Wastyk e colleghi, Cell 2021) 36 adulti sani hanno aumentato per 10 settimane i cibi fermentati (yogurt, kefir, verdure fermentate, kombucha) fino a circa 6 porzioni al giorno. La varietà del loro microbiota è salita e 19 marcatori infiammatori sono scesi. Il gruppo che aveva aumentato solo le fibre, nello stesso tempo, non ha visto crescere la varietà. È uno studio piccolo, ma coerente con l'idea che i fermentati "portano" microrganismi nuovi, mentre le fibre nutrono quelli che ci sono già: servono entrambi.</p>
  <p class="small muted">Pensaci: se le fibre sono il cibo e i fermentati sono i nuovi arrivati, cosa succede a introdurre batteri nuovi in un intestino povero di fibre?</p>
  <h3>Come introdurli</h3>
  <ol class="steplist">
    <li><b>Parti piano:</b> una porzione al giorno per 1–2 settimane, poi due. All'inizio un po' di gonfiore è normale.</li>
    <li><b>Porzioni:</b> yogurt o yogurt greco 125–170 g, kefir 150–200 ml, verdure fermentate 30–50 g (sono salate), miso 1 cucchiaino.</li>
    <li><b>Devono essere vivi:</b> quelli pastorizzati o cotti (crauti in barattolo a scaffale, tempeh cotto, pane a lievitazione naturale, salsa di soia) non contengono più microrganismi vivi. Al supermercato cerca i crauti nel banco frigo con scritto "non pastorizzati".</li>
    <li><b>Il miso non va bollito:</b> scioglilo nel piatto a fine cottura, fuori dal fuoco.</li>
    <li><b>Varia anche qui:</b> yogurt, kefir e verdure fermentate portano specie diverse.</li>
  </ol>
  <h3>Verdure in salamoia: il metodo</h3>
  <ol class="steplist">
    <li><b>Barattolo pulito</b>, lavato in lavastoviglie o sciacquato con acqua bollente. Non serve sterilizzarlo come per le conserve.</li>
    <li><b>Salamoia al 2–3,5%:</b> 20–35 g di sale grosso per litro d'acqua. Pesalo con la bilancia, non a occhio: sotto il 2% rischi muffe, sopra il 5% la fermentazione rallenta troppo. Per i crauti il sale si calcola sul peso del cavolo (2%).</li>
    <li><b>Tutto sott'acqua:</b> le verdure devono restare coperte, con un peso (un sacchetto gelo pieno di salamoia funziona). Sotto il liquido non c'è ossigeno: i lattobacilli ci stanno bene, le muffe no.</li>
    <li><b>18–22 °C, al buio.</b> Coperchio appoggiato, oppure chiuso e aperto una volta al giorno per far uscire l'anidride carbonica.</li>
    <li><b>Assaggia dal terzo giorno.</b> Quando l'acidità ti piace, in frigo: la fermentazione rallenta quasi fino a fermarsi.</li>
  </ol>
  <h3>Cosa è normale e cosa no</h3>
  <ul class="steplist">
    <li><b>Normale:</b> bollicine, salamoia torbida, odore acidulo, un velo bianco e piatto in superficie (lieviti "kahm": toglilo, è innocuo).</li>
    <li><b>Butta tutto:</b> muffa pelosa o colorata (verde, nera, rosa), verdure viscide, odore di marcio.</li>
  </ul>
  <p class="small muted"><b>Sicurezza.</b> Quello che rende sicure le verdure fermentate è l'acidità che producono i lattobacilli: sotto pH 4,6 il Clostridium botulinum non cresce, e le verdure ben fermentate arrivano intorno a 3,5–4. Per questo contano la percentuale di sale giusta, le verdure sempre sommerse e un tempo sufficiente. Se vuoi una conferma, le cartine per il pH costano pochi euro.</p>
  <p class="small muted"><b>Conservazione.</b> In frigo a 4 °C, sempre sommerse nel loro liquido, con posate pulite: crauti fino a 6 mesi, carote e cavolfiore 3 mesi, cetrioli e kimchi 2 mesi. Col tempo diventano più acide e morbide.</p>`;
}

/* ============ SPUNTINI E DOLCI ============ */
function renderSpuntini(){
  document.querySelectorAll("[data-spseg]").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.spseg===spSeg);b.onclick=()=>{spSeg=b.dataset.spseg;renderSpuntini()}});
  document.getElementById("sp-frutta").hidden=spSeg!=="frutta";document.getElementById("sp-dolci").hidden=spSeg!=="dolci";
  if(spSeg==="dolci")return renderDolci();
  const m=weekMonth();const fr=FRUITS.filter(f=>f.months.includes(m));
  const combo=s=>`<div class="combo"><b>${esc(s.name)}</b><span class="nut">${s.kcal}${s.fruit?"+frutta":""} kcal · ${s.protein} g${s.ferm?` · <span class="badge">fermentato</span>`:""}</span><div class="why">${esc(s.why)}${s.needs?` Serve ${esc((R(s.needs)||{}).name||"").toLowerCase()} fatta in casa.`:""}</div></div>`;
  document.getElementById("sp-frutta").innerHTML=`
   <div class="panel stack"><h3>Frutta di stagione a ${MONTHS_LONG[m-1]}</h3>
    <div class="fruitgrid">${fr.map(f=>`<div class="fruit"><b>${esc(f.label)}</b><span>${f.kcal} kcal · ${esc(f.pair)}</span></div>`).join("")}</div>
    <p class="small muted">Nella settimana l'app fa ruotare questi frutti tra colazioni e spuntini: ogni frutto diverso è una pianta in più nel conto dei 30.</p></div>
   <div class="panel stack"><h3>Come abbinare la frutta</h3>
    <p class="small muted"><b>Frutta intera, non succo.</b> La fibra della frutta intera rallenta l'arrivo degli zuccheri nel sangue; nel succo la fibra non c'è più e gli zuccheri diventano "liberi", come quelli aggiunti.</p>
    <p class="small muted"><b>Con proteine o grassi.</b> Yogurt greco, frutta secca, formaggio o un uovo rallentano lo svuotamento dello stomaco: la risposta glicemica si appiattisce e la sazietà dura di più. Per te c'è un secondo vantaggio: ogni spuntino così porta proteine verso gli 80–100 g della giornata.</p>
    <p class="small muted"><b>Con la vitamina C vicino ai legumi.</b> Agrumi, kiwi, fragole: se li mangi a fine pranzo dopo un piatto di legumi aiutano ad assorbirne il ferro.</p>
    <p class="small muted">Pensaci: 150 g di uva e 150 g di fragole hanno circa 100 e 45 kcal. Da dove viene la differenza, se sono entrambe frutta "dolce"?</p></div>
   <div class="panel"><h3 style="margin-bottom:4px">Colazioni</h3>${SNACKS.filter(s=>s.type==="colazione").map(combo).join("")}</div>
   <div class="panel"><h3 style="margin-bottom:4px">Spuntini</h3>${SNACKS.filter(s=>s.type==="spuntino").map(combo).join("")}</div>
   <p class="small muted">Colazione e spuntino di ogni giorno si scelgono nella Settimana: l'app li propone per arrivare a ${KCAL_TARGET} kcal e ${PROT_MIN}–${PROT_MAX} g di proteine, con almeno un fermentato. Gli ingredienti finiscono nella spesa.</p>`;
}
function renderDolci(){
  const el=document.getElementById("sweetStock");
  el.innerHTML=`<h3 style="margin-bottom:6px">In casa adesso</h3>`+stockRows(s=>R(s.rid)&&R(s.rid).role==="dolce","Nessun dolce in casa. Scegline uno qui sotto e mettilo in programma per domenica.");
  bindStock(el,renderSpuntini);
  seasonFilter("dolciFilter",dolciF,v=>{dolciF=v;renderSpuntini()},"Tutti","Nuovo dolce","dolce","spuntini");
  renderGrid("dolciGrid","dolce",dolciF,"spuntini","Nessun dolce di stagione: guarda \"Tutti\".");
}

/* ============ BACKUP ============ */
document.getElementById("exportBtn").addEventListener("click",async()=>{
  const blob=new Blob([JSON.stringify(S)],{type:"application/json"});const name=`mealprep-backup-${iso(new Date())}.json`;
  try{const file=new File([blob],name,{type:"application/json"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Backup meal prep"});return}}catch(e){if(e&&e.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)});
document.getElementById("importFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d.recipes)throw 0;S={...defaults(),...d};if((S.libVersion||0)<LIB_VERSION)mergeLib(S);autoWeek();save();toast("Backup importato");showList()}catch(err){toast("Questo file non è un backup dell'app")}};rd.readAsText(f);e.target.value=""});
document.getElementById("resetAll").addEventListener("click",()=>document.getElementById("resetConfirm").hidden=false);
document.getElementById("resetNo").addEventListener("click",()=>document.getElementById("resetConfirm").hidden=true);
document.getElementById("resetYes").addEventListener("click",()=>{S=defaults();autoWeek();save();document.getElementById("resetConfirm").hidden=true;toast("Ripristinato");showList()});
