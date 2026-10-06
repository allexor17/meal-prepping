/* ============ PROFILO ============
 Il profilo è l'anamnesi: il ricettario (il "prontuario") è uguale per tutti, il profilo decide
 - quali ricette vanno bene (filtri per ricetta: dieta, allergie, gusti, utensili, abilità)
 - quanto pesa la giornata (obiettivi di kcal, proteine e carboidrati, e quindi quanto grandi le porzioni)
 - quanto tempo serve la domenica con gli utensili che si hanno.
 Le funzioni qui sotto leggono S (definito in app.js) solo quando vengono chiamate. */

const DIETS=[
 {k:"onnivora",l:"Onnivora",d:"Mangio di tutto: carne, pesce, uova e latticini.",no:[]},
 {k:"pescetariana",l:"Pescetariana",d:"Niente carne; pesce, uova e latticini sì.",no:["carne"]},
 {k:"vegetariana",l:"Vegetariana",d:"Niente carne né pesce; uova e latticini sì.",no:["carne","pesce","crostacei"]},
 {k:"vegana",l:"Vegana",d:"Solo vegetale: niente carne, pesce, uova, latticini, miele.",no:["carne","pesce","crostacei","uova","latte","lattosio","miele"]}
];
const CARB_MODES=[
 {k:"normali",l:"Normali",d:"Un cereale a pranzo e uno a cena.",max:0},
 {k:"low",l:"Pochi (low carb)",d:"Circa 130 g di carboidrati al giorno al massimo: porzioni di cereale piccole, niente piatti di soli legumi.",max:130},
 {k:"keto",l:"Chetogenica",d:"Circa 50 g al giorno al massimo: niente cereali, legumi e frutta solo a piccole dosi.",max:50}
];
/* Categorie riconosciute dal nome degli ingredienti. re = parole che la fanno scattare, not = eccezioni */
const CATS={
 carne:{re:/\b(pollo|tacchino|manzo|vitell|maiale|lonza|arista|prosciutt|speck|pancetta|guanciale|salsicc|salam|mortadell|bresaola|wurstel|agnello|coniglio|anatra|carne|cotechino|lardo|strutto)/,not:/carne di soia|carne vegetale/},
 pesce:{re:/merluzz|nasello|tonno|sgombr|sardin|\balic|acciug|salmon|orata|branzin|spigol|trota|pesce|colatura|baccal|stoccafiss|platessa|sogliol|surimi|ricciola|\bsarde\b/,not:/pesce vegetale/},
 crostacei:{re:/gamber|scamp|astic|aragost|granch|cozz|vongol|calamar|seppi|\bpolp[oi]\b|totan|ostric|capesant|frutti di mare/},
 uova:{re:/\buov[ao]\b|albume|tuorl|maionese/},
 latte:{re:/yogurt|kefir|parmigian|\bgrana\b|feta|ricott|mozzarell|\blatte\b|burro|formagg|pecorin|stracchin|panna|scamorz|mascarpon|skyr|quark|provol|fontina|gorgonzol|emmental|brise/,not:/yogurt di soia|yogurt vegetale|latte di cocco|burro di arachidi|burro di mandorle|burro di cacao/},
 lattosio:{re:/yogurt|kefir|ricott|mozzarell|\blatte\b|burro|stracchin|panna|scamorz|mascarpon|skyr|quark|feta|brise/,not:/yogurt di soia|yogurt vegetale|latte di cocco|burro di arachidi|burro di mandorle|senza lattosio|delattosat/},
 glutine:{re:/farro|\borzo\b|frumento|grano duro|grano tenero|couscous|cous cous|bulgur|seitan|pangrattato|\bpane\b|farina|\bpasta\b|brise|avena|segale|cracker|grissin|salsa di soia|piadin|tortill|biscott|semola|kamut|spelta/,not:/farina di mais|farina di riso|farina di ceci|farina di grano saraceno|farina di castagne|farina di mandorle|pasta di lenticchie|pasta di piselli|pasta di ceci|pasta di riso|pasta di mais|senza glutine|tamari/},
 guscio:{re:/\bnoci\b|\bnoce\b|nocciol|mandorl|anacard|pistacch|pinoli|pecan|macadamia/,not:/noce moscata|noce di cocco/},
 arachidi:{re:/arachid/},
 soia:{re:/\bsoia\b|tofu|tempeh|edamame|\bmiso\b|tamari/},
 sesamo:{re:/sesamo|tahin/},
 sedano:{re:/sedano/},
 senape:{re:/senape/},
 miele:{re:/\bmiele\b/},
 piccante:{re:/peperoncino|piccant|\bchili\b|nduja|tabasco|harissa|sriracha|jalapen|wasabi/,not:/non piccante/}
};
const ALLERGENS=[
 {k:"glutine",l:"Glutine (celiachia)"},{k:"lattosio",l:"Lattosio"},{k:"latte",l:"Proteine del latte"},{k:"uova",l:"Uova"},
 {k:"guscio",l:"Frutta a guscio"},{k:"arachidi",l:"Arachidi"},{k:"soia",l:"Soia"},{k:"pesce",l:"Pesce"},
 {k:"crostacei",l:"Crostacei e molluschi"},{k:"sesamo",l:"Sesamo"},{k:"sedano",l:"Sedano"},{k:"senape",l:"Senape"}
];
const ALL_LABEL=Object.fromEntries(ALLERGENS.map(a=>[a.k,a.l.toLowerCase()]));
/* Gruppi di gusti: "mai" li esclude, "meno" li propone meno spesso, "piu" più spesso.
 need = categoria che la dieta deve permettere perché abbia senso chiederlo */
const LIKE_GROUPS=[
 {k:"ceci",l:"Ceci",re:/\bceci\b|hummus|falafel/},{k:"lenticchie",l:"Lenticchie",re:/lenticch/},{k:"fagioli",l:"Fagioli",re:/fagiol|borlott|cannellin/},
 {k:"piselli",l:"Piselli",re:/pisell/},{k:"tofu",l:"Tofu",re:/tofu/},{k:"tempeh",l:"Tempeh",re:/tempeh/},{k:"seitan",l:"Seitan",re:/seitan/},
 {k:"soia_gran",l:"Soia granulare",re:/soia granulare/},{k:"edamame",l:"Edamame",re:/edamame/},
 {k:"funghi",l:"Funghi",re:/fungh|champignon|porcin/},{k:"cipolla",l:"Cipolla",re:/cipoll|porri|scalogn/},{k:"aglio",l:"Aglio",re:/\baglio\b/},
 {k:"peperoni",l:"Peperoni",re:/peperon/,not:/peperoncino/},{k:"melanzane",l:"Melanzane",re:/melanzan/},{k:"zucchine",l:"Zucchine",re:/zucchin/},
 {k:"zucca",l:"Zucca",re:/\bzucca\b/,not:/semi di zucca/},{k:"cavoli",l:"Cavoli e broccoli",re:/cavol|broccol|verza|cappucc|cime di rapa/},
 {k:"spinaci",l:"Spinaci",re:/spinac/},{k:"finocchi",l:"Finocchi",re:/finocch/},{k:"carciofi",l:"Carciofi",re:/carciof/},{k:"asparagi",l:"Asparagi",re:/asparag/},
 {k:"rucola",l:"Rucola",re:/rucola/},{k:"olive",l:"Olive e capperi",re:/olive|capper/},{k:"cocco",l:"Cocco",re:/cocco/},{k:"zenzero",l:"Zenzero",re:/zenzer/},
 {k:"spezie",l:"Curcuma, cumino, curry",re:/curcuma|cumino|curry/},
 {k:"pesce_azzurro",l:"Pesce azzurro",re:/sgombr|sardin|\balic|acciug/,need:"pesce"},{k:"tonno",l:"Tonno",re:/tonno/,need:"pesce"},{k:"merluzzo",l:"Merluzzo",re:/merluzz|nasello/,need:"pesce"},
 {k:"pollo",l:"Pollo e tacchino",re:/pollo|tacchino/,need:"carne"},{k:"carne_rossa",l:"Manzo e maiale",re:/manzo|maiale|vitell/,need:"carne"},
 {k:"uova",l:"Uova",re:/\buov[ao]\b/,need:"uova"},{k:"formaggi",l:"Formaggi",re:/parmigian|\bgrana\b|feta|ricott|mozzarell|pecorin|formagg/,need:"latte"},
 {k:"yogurt",l:"Yogurt e kefir",re:/yogurt|kefir/},{k:"frutta_secca",l:"Frutta secca",re:/\bnoci\b|mandorl|nocciol|arachid|anacard/,not:/noce moscata/}
];
const TOOLS=[
 {k:"forno",l:"Forno",d:"Teglie, frittate al forno, polpette, dolci."},
 {k:"air",l:"Friggitrice ad aria",d:"Fa molte cose del forno, ma in giri più piccoli."},
 {k:"frulla",l:"Frullatore o minipimer",d:"Vellutate, pesti, creme."},
 {k:"trita",l:"Tritatutto",d:"Il soffritto in pochi secondi."},
 {k:"bimby",l:"Robot che cuoce",d:"Bimby o simili: frulla, trita e cuoce, quindi vale anche come un fornello in più."},
 {k:"pressione",l:"Pentola a pressione",d:"Legumi secchi e cereali integrali in metà tempo."},
 {k:"bilancia",l:"Bilancia da cucina",d:"Senza, ti do le misure a cucchiai e tazze. I fermentati però la richiedono: il sale va pesato."}
];
const TOOL_LABEL=Object.fromEntries(TOOLS.map(t=>[t.k,t.l]));
const SKILLS=[{k:"base",l:"Sto imparando",d:"Ricette facili; quelle con qualche tecnica in più solo ogni tanto."},{k:"medio",l:"Me la cavo",d:"Di tutto, le più impegnative un po' meno spesso."},{k:"esperto",l:"Cucino volentieri",d:"Nessun limite."}];
const TIMES=[{k:60,l:"1 ora"},{k:120,l:"2 ore"},{k:180,l:"3 ore"},{k:240,l:"Anche di più"}];
const MEAL_MODES=[{k:"pc",l:"Pranzi e cene",d:"10 pasti, dal lunedì al venerdì."},{k:"p",l:"Solo pranzi",d:"5 schiscette: le cene le fai sul momento."},{k:"c",l:"Solo cene",d:"5 cene pronte da scaldare."}];
const LUNCH_HEAT=[{k:"si",l:"Sì, ho un microonde",d:"Va bene tutto."},{k:"termos",l:"No, ma ho un termos",d:"Zuppe e stufati caldi nel termos, il resto buono freddo."},{k:"no",l:"No",d:"A pranzo solo piatti buoni freddi o a temperatura ambiente."}];
const ACTS=[{k:"sed",l:"Studio o lavoro alla scrivania e mi muovo poco",f:1.2,g:.9},{k:"light",l:"Cammino ogni giorno o mi alleno 1–2 volte a settimana",f:1.375,g:1},{k:"mod",l:"Mi alleno 3–4 volte a settimana",f:1.55,g:1.3},{k:"high",l:"Lavoro fisico o sport quasi ogni giorno",f:1.725,g:1.6}];
const GOALS_W=[{k:"keep",l:"Mantenere il peso"},{k:"lose",l:"Perdere un po' di peso"},{k:"gain",l:"Aumentare (massa muscolare)"}];
const SIZES=[{k:"piccole",l:"Piccole",kcal:1700,pmin:65,pmax:85},{k:"medie",l:"Medie",kcal:2000,pmin:75,pmax:100},{k:"grandi",l:"Grandi",kcal:2500,pmin:95,pmax:125}];
const KCAL_FLOOR=1200;

function blankProfile(){return{v:1,name:"",legacy:false,diet:null,carbs:"normali",allergies:[],spicy:"poco",likes:{},
  nums:{mode:"calc",kcal:2000,pmin:75,pmax:100,size:"medie",body:{sex:"",age:"",weight:"",height:"",act:"light",goal:"keep"}},
  goals:{plants:true,ferm:false,oily:true},tools:{forno:true,air:false,frulla:false,trita:false,bimby:false,pressione:false,bilancia:false},fornelli:2,
  skill:"medio",time:120,meals:"pc",snacks:true,lunchHeat:"si"}}
/* Chi usava Schiscia prima che diventasse personalizzabile: il profilo riproduce esattamente le regole di allora */
function legacyProfile(){return{v:1,name:"",legacy:true,news:true,diet:"pescetariana",carbs:"normali",allergies:[],spicy:"mai",likes:{},
  nums:{mode:"manual",kcal:1800,pmin:80,pmax:100,size:"medie",body:{sex:"",age:"",weight:"",height:"",act:"light",goal:"keep"}},
  goals:{plants:true,ferm:true,oily:true},tools:{forno:true,air:false,frulla:true,trita:false,bimby:false,pressione:false,bilancia:true},fornelli:2,
  skill:"esperto",time:180,meals:"pc",snacks:true,lunchHeat:"si"}}
function fixProfile(p){const b=blankProfile();if(!p)return null;const o={...b,...p};o.nums={...b.nums,...(p.nums||{})};o.nums.body={...b.nums.body,...((p.nums||{}).body||{})};o.goals={...b.goals,...(p.goals||{})};o.tools={...b.tools,...(p.tools||{})};o.likes={...(p.likes||{})};o.allergies=[...(p.allergies||[])];return o}

/* ---------- categorie degli ingredienti ---------- */
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/’/g,"'");
const catCache=new Map();
function ingCats(name){const n=norm(name);if(catCache.has(n))return catCache.get(n);const o=new Set();for(const k in CATS){const c=CATS[k];if(c.re.test(n)&&!(c.not&&c.not.test(n)))o.add(k)}catCache.set(n,o);return o}
function ingNames(x){if(!x)return[];if(x.ing&&Array.isArray(x.ing))return x.ing.map(i=>i.n);if(x.ing&&x.ing.n)return[x.ing.n];if(x.n)return[x.n];return[]}
function catHit(x,cat){return ingNames(x).find(n=>ingCats(n).has(cat))||""}
function itemCats(x){const o=new Set();ingNames(x).forEach(n=>ingCats(n).forEach(c=>o.add(c)));if(x&&x.spicy)o.add("piccante");return o}
function groupHit(g,name){const n=norm(name);return g.re.test(n)&&!(g.not&&g.not.test(n))}
function likeMatches(name,P=S.profile){const out=[];if(!P||!P.likes)return out;const n=norm(name);
  for(const k in P.likes){const lv=P.likes[k];if(k.startsWith("i:")){if(matchNames(k.slice(2),name))out.push({k,lv,l:k.slice(2)})}else{const g=LIKE_GROUPS.find(g=>g.k===k);if(g&&groupHit(g,n))out.push({k,lv,l:g.l.toLowerCase()})}}
  return out}
const dislikedName=name=>likeMatches(name).some(m=>m.lv==="mai");
function hasTool(P){const t=(P&&P.tools)||{};return k=>k==="frulla"?!!(t.frulla||t.bimby):k==="trita"?!!(t.trita||t.bimby):k==="fuochi"?((P?P.fornelli:2)>0||!!t.bimby):!!t[k]}
const pfDiet=P=>DIETS.find(d=>d.k===(P&&P.diet))||DIETS[0];

/* ---------- carboidrati e porzioni ---------- */
function carbOf(r){if(!r)return 0;if(typeof r.carb==="number")return r.carb;if(r.role==="base")return 37;return Math.max(0,Math.round(((+r.kcal||0)-4*(+r.protein||0))*.45/4))}
let PF={fm:1,fb:1};
function pf(r){if(!r)return 1;return r.role==="main"?PF.fm:r.role==="base"?PF.fb:1}
const clampN=(x,a,b)=>Math.min(b,Math.max(a,x));
const r05=x=>Math.round(x*20)/20;
/* Le porzioni sono "a blocchi": piatto principale e base si scalano separatamente.
 Con le porzioni di partenza un pasto vale circa 300 kcal di principale, 193 di base, 100 di contorno
 (23 g, 6,5 g e 3 g di proteine): da lì si risolvono due equazioni, una per le kcal e una per le proteine. */
function portionFactors(t,carbs){
  const mealK=(t.kcal*(1-.217)-224)/2,mealP=((t.pmin+t.pmax)/2)*(1-.278)/2;
  let fm,fb;
  if(carbs==="keto"){fb=0;fm=(mealP-3)/23}
  else{const det=300*6.5-193*23;fm=((mealK-100)*6.5-193*(mealP-3))/det;fb=(300*(mealP-3)-23*(mealK-100))/det;
    const cap=carbs==="low"?.5:2.4;if(fb>cap||fb<.5){fb=clampN(fb,.5,cap);fm=(mealP-3-6.5*fb)/23}
    // il piatto principale non si rimpicciolisce sotto l'85%: se servono più calorie, cresce il cereale
    if(fm<.85){fm=.85;fb=clampN((mealK-100-300*fm)/193,.5,cap)}
    // con pochi carboidrati le calorie che il cereale non porta le dà in parte il piatto principale
    if(carbs==="low")fm=Math.max(fm,(fm+(mealK-100-193*fb)/300)/2)}
  return{fm:r05(clampN(fm,.7,2)),fb:carbs==="keto"?0:r05(clampN(fb,.5,2.4))}}
function calcTargets(b){const w=+b.weight,h=+b.height,a=+b.age;if(!(w>=35&&w<=250&&h>=130&&h<=220&&a>=18&&a<=100)||!b.sex)return null;
  const bmr=10*w+6.25*h-5*a+(b.sex==="m"?5:-161);const act=ACTS.find(x=>x.k===b.act)||ACTS[1];let k=bmr*act.f;
  if(b.goal==="lose")k-=Math.min(500,k*.15);if(b.goal==="gain")k+=k*.1;
  const g=act.g+(b.goal==="lose"?.2:0)+(b.goal==="gain"?.3:0);const pmin=Math.round(w*g/5)*5;
  return{kcal:Math.round(k/50)*50,pmin,pmax:Math.round(pmin*1.25/5)*5}}
function targetsOf(P){const n=(P&&P.nums)||{};
  if(n.mode==="calc"){const c=calcTargets(n.body||{});if(c)return c}
  if(n.mode==="none"||n.mode==="calc"){const s=SIZES.find(x=>x.k===n.size)||SIZES[1];return{kcal:s.kcal,pmin:s.pmin,pmax:s.pmax}}
  const kcal=clampN(+n.kcal||2000,1000,4500),pmin=clampN(+n.pmin||70,30,250),pmax=Math.max(pmin,clampN(+n.pmax||pmin+20,30,300));return{kcal,pmin,pmax}}
/* Esegue fn come se il profilo fosse P, poi rimette tutto com'era */
function withProfile(P,fn){const tmp=S.profile;S.profile=P;applyProfile();try{return fn()}finally{S.profile=tmp;if(tmp)applyProfile()}}
const showNums=()=>!S.profile||!S.profile.nums||S.profile.nums.mode!=="none";
function applyProfile(){const P=S.profile;if(!P)return;const t=targetsOf(P);
  KCAL_TARGET=t.kcal;PROT_MIN=t.pmin;PROT_MAX=t.pmax;MEAL_PROT_MIN=Math.round(t.pmin*.6875);
  CARB_MAX=(CARB_MODES.find(c=>c.k===P.carbs)||CARB_MODES[0]).max;PF=portionFactors(t,P.carbs)}
/* Quote della giornata: se colazione, spuntino o un pasto sono fuori dall'app, gli obiettivi riguardano solo il resto */
const SH_K={col:.17,spu:.07,p:.38,c:.38},SH_P={col:.24,spu:.09,p:.335,c:.335};
function planned(P=S.profile){const m=(P&&P.meals)||"pc",sn=!P||P.snacks!==false;return{col:sn,spu:sn,p:m!=="c",c:m!=="p"}}
function dayT(){const pl=planned();let sk=0,sp=0;for(const k in pl)if(pl[k]){sk+=SH_K[k];sp+=SH_P[k]}
  const nm=(pl.p?1:0)+(pl.c?1:0);return{k:Math.round(KCAL_TARGET*sk),pmin:Math.round(PROT_MIN*sp),pmax:Math.round(PROT_MAX*sp),meal:MEAL_PROT_MIN*nm/2,carb:CARB_MAX?Math.round(CARB_MAX*sk):0,full:sk>.99}}

/* ---------- compatibilità: perché una ricetta non va bene ---------- */
function whyNot(r,P=S.profile){
  if(!P||!r)return[];const out=[];const cats=itemCats(r);const diet=pfDiet(P);
  diet.no.forEach(c=>{if(cats.has(c)&&!out.some(o=>o.k==="diet"))out.push({k:"diet",t:`contiene ${catHit(r,c)||c}: dieta ${diet.l.toLowerCase()}`})});
  (P.allergies||[]).forEach(a=>{if(cats.has(a))out.push({k:"all:"+a,t:`contiene ${catHit(r,a)} (${ALL_LABEL[a]})`})});
  if((r.spicy||cats.has("piccante"))&&P.spicy==="mai")out.push({k:"spicy",t:"è piccante"});
  const seen=new Set();ingNames(r).forEach(n=>likeMatches(n,P).forEach(m=>{if(m.lv==="mai"&&!seen.has(m.k)){seen.add(m.k);out.push({k:"like:"+m.k,t:`contiene ${m.l}, che hai escluso`})}}));
  if(r.never)out.push({k:"never",t:"l'hai tolta tu dalle proposte"});
  const c=carbOf(r),fm=P.carbs!=="normali"?portionFactors(targetsOf(P),P.carbs).fm:1;
  if(P.carbs==="keto"){
    if(r.role==="base")out.push({k:"carb",t:"è un cereale: nella chetogenica il pasto non ha la base"});
    else if(r.role==="main"&&r.sauce)out.push({k:"carb",t:"è un sugo: va su una base di cereali"});
    else if(r.role==="main"&&c*fm>15)out.push({k:"carb",t:`${Math.round(c*fm)} g di carboidrati a porzione (chetogenica)`});
    else if(["side","scorta"].includes(r.role)&&c>10)out.push({k:"carb",t:`${c} g di carboidrati a porzione (chetogenica)`});
    else if(r.role==="dolce"&&c>8)out.push({k:"carb",t:`${c} g di carboidrati a pezzo (chetogenica)`});
  }else if(P.carbs==="low"){
    if(r.role==="main"&&c*fm>=40)out.push({k:"carb",t:`${Math.round(c*fm)} g di carboidrati a porzione: troppi per il low carb`});
  }
  const H=hasTool(P);
  if(r.equip==="forno"&&!H("forno")&&!(H("air")&&r.air))out.push({k:"tool:forno",t:H("air")?"serve il forno: nella friggitrice ad aria non ci sta":"serve il forno"});
  if(r.equip==="fuochi"&&!H("fuochi"))out.push({k:"tool:fuochi",t:"serve un fornello"});
  if(r.role==="fermento"&&!H("bilancia"))out.push({k:"tool:bilancia",t:"serve la bilancia: il sale della salamoia va pesato"});
  if(P.skill==="base"&&(r.diff||1)>=3)out.push({k:"skill",t:"è una ricetta impegnativa"});
  return out}
/* Durante la generazione della settimana le risposte si memorizzano: il profilo non cambia a metà */
let MEMO=null;
function memo(key,fn){if(!MEMO)return fn();if(MEMO.has(key))return MEMO.get(key);const v=fn();MEMO.set(key,v);return v}
const allowed=(r,P=S.profile)=>P===S.profile?memo("a"+r.id,()=>!whyNot(r,P).length):!whyNot(r,P).length;
/* Colazioni, spuntini, aggiunte e frutta: stessi filtri, più i carboidrati e le uova sode (servono i fornelli) */
function itemWhy(x,P=S.profile,kind){if(!P||!x)return[];const out=[];const cats=itemCats(x);const diet=pfDiet(P);
  diet.no.forEach(c=>{if(cats.has(c)&&!out.length)out.push({k:"diet",t:`contiene ${catHit(x,c)}`})});
  (P.allergies||[]).forEach(a=>{if(cats.has(a))out.push({k:"all:"+a,t:`contiene ${catHit(x,a)} (${ALL_LABEL[a]})`})});
  ingNames(x).forEach(n=>likeMatches(n,P).forEach(m=>{if(m.lv==="mai")out.push({k:"like:"+m.k,t:`contiene ${m.l}`})}));
  if((x.eggs||x.prep)&&!hasTool(P)("fuochi"))out.push({k:"tool:fuochi",t:"le uova sode vogliono un fornello"});
  const c=x.carb||0;
  if(P.carbs==="keto"&&c>(kind==="frutta"?8:10))out.push({k:"carb",t:`${c} g di carboidrati`});
  if(P.carbs==="low"&&c>(kind==="frutta"?20:30))out.push({k:"carb",t:`${c} g di carboidrati`});
  return out}
const itemOk=(x,P,kind)=>!P||P===S.profile?memo("i"+(kind||"")+(x.id||x.n),()=>!itemWhy(x,S.profile,kind).length):!itemWhy(x,P,kind).length;
/* Pesi: quanto spesso proporla, senza escluderla */
function likeW(r,P=S.profile){return P===S.profile?memo("w"+r.id,()=>likeW_(r,P)):likeW_(r,P)}
function likeW_(r,P){if(!P)return 1;let w=1;const seen=new Set();ingNames(r).forEach(n=>likeMatches(n,P).forEach(m=>{if(seen.has(m.k))return;seen.add(m.k);if(m.lv==="meno")w*=.35;if(m.lv==="piu")w*=1.8}));
  if(r.less)w*=.3;if(P.skill==="base"&&(r.diff||1)===2)w*=.5;if(P.skill==="medio"&&(r.diff||1)===3)w*=.5;
  if((r.spicy||itemCats(r).has("piccante"))&&P.spicy==="poco")w*=.4;
  return clampN(w,.1,3.5)}
/* A pranzo: senza microonde vanno bene solo i piatti buoni freddi (o caldi nel termos) */
function lunchOk(r,P=S.profile){if(!r||!P||!planned(P).p)return true;if(P.lunchHeat==="no")return!!r.cold;if(P.lunchHeat==="termos")return!!(r.cold||r.soup);return true}

/* ---------- tempi con gli utensili che hai ---------- */
function effTimes(r,P=S.profile){let prep=+r.prepMin||0,cook=+r.cookMin||0,equip=r.equip;const notes=[];let air=false;
  if(P){const H=hasTool(P);(r.tl||[]).forEach(x=>{const have=H(x.t);
      if(have&&x.w){if(x.k==="prep")prep+=x.w;else cook+=x.w;if(x.alt)notes.push(x.alt)}
      if(!have&&x.wo!==undefined){if(x.k==="prep")prep+=x.wo;else cook+=x.wo;if(x.alt)notes.push(x.alt)}});
    if(r.equip==="forno"&&!H("forno")&&H("air")&&r.air){air=true;equip="air";cook=Math.round(cook*.85/5)*5*2;notes.push(`Nella friggitrice ad aria: 20 °C in meno${r.temp?` (${r.temp-20} °C)`:""} e circa il 15% di tempo in meno, ma in due giri.`)}}
  return{prep:Math.max(0,prep),cook:Math.max(0,cook),equip,air,notes}}
function laneCfg(P=S.profile){const H=hasTool(P);const nb=Math.min(4,Math.max(0,P?+P.fornelli:2));
  return{nb,robot:H("bimby"),oven:H("forno")?"forno":H("air")?"air":null}}

/* ---------- quantità: porzioni scalate e misure senza bilancia ---------- */
function niceScale(q,m){if(!q)return q;if(Math.abs(m-Math.round(m))<1e-9)return scaleQ(q,Math.round(m));const p=parseQ(q);if(!p)return q;const u=p.u.toLowerCase();let n=p.n*m;
  if(/^(g|ml)\b/.test(u))n=n>=100?Math.round(n/10)*10:Math.max(5,Math.round(n/5)*5);
  else if(/^(kg|l)\b/.test(u))n=Math.round(n*20)/20;
  else if(/^cucchia/.test(u))n=Math.max(1,Math.round(n*2)/2);
  else n=Math.max(.5,Math.ceil(n*2-.15)/2);
  const s=(n===.5?"½":String(n).replace(".5","½").replace(/^0½/,"½")).replace(/(\d)½/,"$1 ½");
  return `${s} ${p.u}`.trim()}
const HOUSE=[
 {re:/soia granulare/,cup:90,sp:6},{re:/fiocchi d'avena|avena/,cup:90,sp:6},{re:/pangrattato/,cup:110,sp:7},
 {re:/riso|farro|orzo|quinoa|miglio|grano saraceno|bulgur|couscous|lenticchie|cereal/,cup:190,sp:13},
 {re:/pasta/,cup:100,sp:0},{re:/farina|amido|cacao|lievito/,cup:125,sp:9},
 {re:/noci|mandorl|nocciol|semi|arachid/,cup:140,sp:10},{re:/parmigiano|grana/,cup:100,sp:6},
 {re:/zucchero|dolcificante|eritritolo/,cup:200,sp:12},{re:/yogurt|ricotta|crema|burro di arachidi|hummus/,cup:240,sp:15},{re:/sale/,cup:0,sp:15}
];
function frac(x){const q=Math.round(x*4)/4;const w=Math.floor(q),f=q-w;const fs=f===.25?"¼":f===.5?"½":f===.75?"¾":"";return w?(fs?`${w} e ${fs}`:`${w}`):(fs||"un pizzico di")}
function houseMeasure(q,name){if(!S.profile||hasTool(S.profile)("bilancia"))return"";const c=canon(q);if(!c)return"";const n=norm(name);
  if(c.u==="ml"){if(c.n>=120){const b=c.n/200;return`≈ ${frac(b)} ${b>1.13?"bicchieri":"bicchiere"}`}return c.n>=10?`≈ ${Math.round(c.n/15)||1} ${Math.round(c.n/15)>1?"cucchiai":"cucchiaio"}`:""}
  if(c.u!=="g"||!/\bg\b|kg/.test(String(q)))return"";const h=HOUSE.find(h=>h.re.test(n));if(!h)return"";
  if(h.cup&&c.n>=h.cup*.45){const t=c.n/h.cup;return`≈ ${frac(t)} ${t>1.13?"tazze":"tazza"}`}
  if(h.sp){const t=Math.round(c.n/h.sp);return t?`≈ ${t} ${t>1?"cucchiai":"cucchiaio"}`:""}
  if(/pasta/.test(n))return`≈ ${Math.max(1,Math.round(c.n/90))} ${Math.round(c.n/90)>1?"pugni":"pugno"} abbondanti`;return""}

/* ---------- diagnosi: quale vincolo restringe di più ---------- */
function reasonLabel(k,P=S.profile){if(k==="diet")return`la dieta ${pfDiet(P).l.toLowerCase()}`;if(k==="carb")return`i carboidrati (${(CARB_MODES.find(c=>c.k===P.carbs)||{}).l.toLowerCase()})`;
  if(k.startsWith("all:"))return`l'esclusione di ${ALL_LABEL[k.slice(4)]}`;if(k.startsWith("like:")){const g=LIKE_GROUPS.find(g=>g.k===k.slice(5));return`"${g?g.l.toLowerCase():k.slice(7)}" tra i cibi esclusi`}
  if(k==="spicy")return"il niente piccante";if(k.startsWith("tool:"))return`non avere ${k==="tool:fuochi"?"fornelli":"il "+(TOOL_LABEL[k.slice(5)]||k.slice(5)).toLowerCase()}`;if(k==="skill")return"il livello in cucina";if(k==="never")return"le ricette che hai tolto tu";return k}
function diagnose(P=S.profile,month){if(!P)return null;const m=month||(S.weekStart?weekMonth():new Date().getMonth()+1);
  const ins=S.recipes.filter(r=>["main","base","side"].includes(r.role)&&inSeason(r,m));
  const ok=ins.filter(r=>allowed(r,P));const cnt=role=>ok.filter(r=>r.role===role).length;
  const mains=ok.filter(r=>r.role==="main"),need=(planned(P).p?5:0)+(planned(P).c?5:0);
  const fams=new Set(mains.map(r=>srcOf(r)[0]||r.id));const por=mains.reduce((a,r)=>a+r.portions,0);
  const lunchMains=planned(P).p&&P.lunchHeat!=="si"?mains.filter(r=>lunchOk(r,P)).length:99;
  const short=[];if(fams.size<3||por<need)short.push("main");if(P.carbs!=="keto"&&cnt("base")<2)short.push("base");if(cnt("side")<2)short.push("side");if(lunchMains<2)short.push("lunch");
  const blame={};ins.filter(r=>!allowed(r,P)).forEach(r=>{const ks=[...new Set(whyNot(r,P).map(w=>w.k))];if(ks.length===1)blame[ks[0]]=(blame[ks[0]]||0)+1});
  const top=Object.entries(blame).sort((a,b)=>b[1]-a[1]).slice(0,2);
  return{m,mains:mains.length,bases:cnt("base"),sides:cnt("side"),fams:fams.size,lunchMains,short,top,ok:!short.length}}
function diagnoseHTML(d){if(!d||d.ok)return"";const what={main:`piatti principali (ne hai ${d.mains}, con ${d.fams} fonti proteiche diverse: ne servono almeno 3 per variare)`,base:`cereali (${d.bases})`,side:`contorni (${d.sides})`,lunch:"piatti buoni freddi per il pranzo"};
  return`<div class="warnbox small"><h4>Con questo profilo le ricette sono poche</h4><p>A ${MONTHS_LONG[d.m-1]} mancano ${d.short.map(k=>what[k]).join(", ")}.${d.top.length?` A restringere di più è ${d.top.map(([k,n])=>`${reasonLabel(k)} (da solo esclude ${n} ${n===1?"ricetta":"ricette"})`).join(", poi ")}.`:""} L'app fa del suo meglio, ma potresti trovare piatti ripetuti o giornate sbilanciate: puoi ammorbidire un vincolo qui sotto, oppure aggiungere ricette tue dalla sezione Ricette.</p></div>`}

/* ---------- sblocchi: cosa cambia aggiungendo un utensile ---------- */
function okIds(P){return new Set(S.recipes.filter(r=>allowed(r,P)).map(r=>r.id))}
function unlockDiff(a,b){const A=okIds(a),Bs=okIds(b);return{gained:[...Bs].filter(x=>!A.has(x)).map(R).filter(Boolean),lost:[...A].filter(x=>!Bs.has(x)).map(R).filter(Boolean)}}
function fasterWith(P,k){const Q={...P,tools:{...P.tools,[k]:true}};return S.recipes.filter(r=>allowed(r,P)&&allowed(r,Q)).map(r=>({r,d:(effTimes(r,P).prep+effTimes(r,P).cook)-(effTimes(r,Q).prep+effTimes(r,Q).cook)})).filter(x=>x.d>=5)}
function buyAdvice(P=S.profile){if(!P)return[];return TOOLS.filter(t=>!P.tools[t.k]&&!(t.k==="frulla"&&P.tools.bimby)&&!(t.k==="trita"&&P.tools.bimby)).map(t=>{const Q={...P,tools:{...P.tools,[t.k]:true}};const g=unlockDiff(P,Q).gained.filter(r=>r.role!=="fermento"||t.k==="bilancia");const f=fasterWith(P,t.k);return{t,g,f}}).filter(x=>x.g.length||x.f.length).sort((a,b)=>(b.g.length*3+b.f.length)-(a.g.length*3+a.f.length)).slice(0,3)}

/* ---------- impatto sulla settimana in corso ---------- */
function slotIssues(s){const out=[];["m","b","s","k"].forEach(k=>{const r=s[k]&&R(s[k]);if(r){const w=whyNot(r);if(w.length)out.push({name:r.name,t:w[0].t})}});
  (s.x||[]).forEach(id=>{const b=B(id);if(b&&!itemOk(b))out.push({name:b.name,t:itemWhy(b)[0].t})});return out}
const slotFilled=s=>!!(s&&(s.m||s.b||s.s||s.k));
function weekImpact(){if(!S.week||!S.profile)return[];const pl=planned();const out=[];
  S.week.forEach((d,i)=>["p","c"].forEach(m=>{const s=d[m];if(s.lock)return;const is=slotIssues(s);
    if(!pl[m]&&slotFilled(s))out.push({i,m,off:true,is:[]});else if(pl[m]&&!slotFilled(s))out.push({i,m,empty:true,is:[]});else if(pl[m]&&is.length)out.push({i,m,is})}));return out}
/* Colazioni e spuntini non si cucinano la domenica: si aggiornano subito */
function refreshSnacks(){if(!S.week)return 0;let n=0;const pl=planned();
  S.week.forEach(d=>{if(!d.sn)d.sn={col:{id:null,f:null},spu:{id:null,f:null}};["col","spu"].forEach(t=>{const x=d.sn[t];const sn=x.id&&SN(x.id);const fr=x.f&&FRT(x.f);
    if(!pl[t]){if(x.id){x.id=null;x.f=null;n++}return}
    if(!x.id||(sn&&!itemOk(sn))){x.id=null;x.f=null;n++}else if(fr&&!itemOk(fr,undefined,"frutta")){x.f=null;n++}})});
  (S.week||[]).forEach(d=>["p","c"].forEach(m=>{const s=d[m];if(s.lock)return;s.x=(s.x||[]).filter(id=>{const b=B(id);return b&&itemOk(b)})}));
  if(n&&pl.col)fillSnacks(S.week,weekMonth(),mulberry((S.seed||1)*31+n),true);return n}
function applyToWeek(){const pins=pinsOf(S.week,true);S.seed=(S.seed||1)+1;const g=generateWeek(S.weekStart,S.seed,{pins});S.week=g.week;S.have=[];save();return g}

/* ---------- UI: pezzi comuni a questionario e profilo ---------- */
const opt=(group,k,label,desc,on)=>`<button class="opt" type="button" data-g="${group}" data-k="${esc(String(k))}" aria-pressed="${!!on}"><b>${esc(label)}</b>${desc?`<span>${esc(desc)}</span>`:""}</button>`;
const chip=(group,k,label,on,cls="")=>`<button class="chip ${cls}" type="button" data-g="${group}" data-k="${esc(String(k))}" aria-pressed="${!!on}">${esc(label)}</button>`;
const LV_NEXT={undefined:"mai",mai:"meno",meno:"piu",piu:undefined},LV_LABEL={mai:"mai",meno:"meno spesso",piu:"preferito"};
function visibleGroups(P){const no=new Set([...pfDiet(P).no,...(P.allergies||[])]);return LIKE_GROUPS.filter(g=>!g.need||!no.has(g.need))}
function secDiet(P){return`<div class="stack"><div class="optgrid">${DIETS.map(d=>opt("diet",d.k,d.l,d.d,P.diet===d.k)).join("")}</div>
  <h4>Carboidrati</h4><div class="optgrid">${CARB_MODES.map(c=>opt("carbs",c.k,c.l,c.d,P.carbs===c.k)).join("")}</div>
  ${P.carbs==="keto"?`<div class="warnbox small">La chetogenica in gravidanza, in allattamento o se prendi farmaci per il diabete va fatta solo con il medico. Sappi anche che le ricette di Schiscia sono piuttosto magre: con la chetogenica le giornate tendono a restare sotto le calorie, e l'app aggiunge olio a crudo, avocado e frutta secca per avvicinarsi. Se ti serve di più, aggiungi ricette tue.</div>`:""}</div>`}
function secAllergies(P){return`<div class="stack"><div class="row">${ALLERGENS.map(a=>chip("allergy",a.k,a.l,(P.allergies||[]).includes(a.k))).join("")}</div>
  <p class="small muted">Il filtro legge gli ingredienti delle ricette. Tracce e contaminazioni no: le etichette dei prodotti controllale sempre tu.${(P.allergies||[]).includes("glutine")?" L'avena è esclusa perché spesso è contaminata: se compri quella certificata senza glutine, puoi aggiungere ricette tue.":""}${(P.allergies||[]).includes("lattosio")?" Parmigiano e grana stagionati restano: la stagionatura consuma quasi tutto il lattosio.":""}</p></div>`}
function secTastes(P){const free=Object.entries(P.likes||{}).filter(([k])=>k.startsWith("i:"));
  return`<div class="stack"><h4>Piccante</h4><div class="row">${[["mai","Mai"],["poco","Ogni tanto"],["si","Mi piace"]].map(([k,l])=>chip("spicy",k,l,P.spicy===k)).join("")}</div>
  <h4>Cibi da escludere o da preferire</h4><p class="small muted">Tocca una volta: <b class="lv mai">mai</b> · due volte: <b class="lv meno">meno spesso</b> · tre volte: <b class="lv piu">preferito</b> · quattro: come prima.</p>
  <div class="row">${visibleGroups(P).map(g=>{const lv=P.likes[g.k];return`<button class="chip lvchip ${lv||""}" type="button" data-g="like" data-k="${g.k}" aria-pressed="${!!lv}">${esc(g.l)}${lv?` · ${LV_LABEL[lv]}`:""}</button>`}).join("")}</div>
  ${free.length?`<div class="row">${free.map(([k,lv])=>`<button class="chip lvchip ${lv}" type="button" data-g="like" data-k="${esc(k)}" aria-pressed="true">${esc(k.slice(2))} · ${LV_LABEL[lv]}</button><button class="linkbtn" type="button" data-g="likedel" data-k="${esc(k)}" aria-label="Togli ${esc(k.slice(2))}">togli</button>`).join("")}</div>`:""}
  <div class="row addlike"><input type="text" id="likeName" list="likeList" placeholder="Un altro cibo, es. rucola, sedano, cocco" aria-label="Un altro cibo"><datalist id="likeList">${knownNames().map(n=>`<option value="${esc(n)}">`).join("")}</datalist><button class="btn ghost sm" type="button" data-g="likeadd" data-k="mai">Mai</button><button class="btn ghost sm" type="button" data-g="likeadd" data-k="meno">Meno spesso</button></div></div>`}
function numsSummary(P){const t=targetsOf(P);const n=P.nums;
  if(n.mode==="calc"&&!calcTargets(n.body))return`<p class="small muted">Compila i campi per vedere il risultato.${+n.body.age&&+n.body.age<18?" Il calcolo vale per gli adulti: se hai meno di 18 anni scegli «Senza numeri».":""}</p>`;
  const f=portionFactors(t,P.carbs);
  return`<div class="okbox small"><b>${n.mode==="none"?"Porzioni "+(SIZES.find(s=>s.k===n.size)||SIZES[1]).l.toLowerCase():`${t.kcal} kcal e ${t.pmin}–${t.pmax} g di proteine al giorno`}</b>${n.mode==="none"?". I numeri restano nascosti: l'app li usa solo per bilanciare.":""}<br>Piatto principale ×${String(f.fm).replace(".",",")}${P.carbs==="keto"?", niente cereale":`, cereale ×${String(f.fb).replace(".",",")} (${Math.round(55*f.fb)} g a crudo a pasto)`} rispetto alle porzioni di partenza.</div>
  ${t.kcal<KCAL_FLOOR?`<div class="warnbox small">Sotto le ${KCAL_FLOOR} kcal al giorno è meglio farsi seguire da un medico o da un dietista: l'app non è pensata per diete così basse.</div>`:""}`}
function secNums(P){const n=P.nums,b=n.body;
  return`<div class="stack"><div class="row">${[["calc","Calcolalo tu"],["manual","Lo so già"],["none","Senza numeri"]].map(([k,l])=>chip("nmode",k,l,n.mode===k)).join("")}</div>
  ${n.mode==="calc"?`<p class="small muted">Formula di Mifflin-St Jeor per il dispendio, proteine in grammi per chilo di peso in base a quanto ti muovi. I dati restano solo su questo telefono.</p>
   <div class="row">${[["f","Donna"],["m","Uomo"]].map(([k,l])=>chip("sex",k,l,b.sex===k)).join("")}<span class="small muted">sesso, per la formula</span></div>
   <div class="three"><label class="f">Età<input type="number" inputmode="numeric" data-num="age" min="18" max="100" value="${esc(b.age)}"></label><label class="f">Peso (kg)<input type="number" inputmode="decimal" data-num="weight" min="35" max="250" value="${esc(b.weight)}"></label><label class="f">Altezza (cm)<input type="number" inputmode="numeric" data-num="height" min="130" max="220" value="${esc(b.height)}"></label></div>
   <h4>Quanto ti muovi</h4><div class="optgrid one">${ACTS.map(a=>opt("act",a.k,a.l,"",b.act===a.k)).join("")}</div>
   <h4>Obiettivo</h4><div class="row">${GOALS_W.map(g=>chip("wgoal",g.k,g.l,b.goal===g.k)).join("")}</div>`:""}
  ${n.mode==="manual"?`<div class="three"><label class="f">kcal al giorno<input type="number" inputmode="numeric" data-num="kcal" min="1000" max="4500" step="50" value="${esc(n.kcal)}"></label><label class="f">Proteine min (g)<input type="number" inputmode="numeric" data-num="pmin" min="30" max="250" value="${esc(n.pmin)}"></label><label class="f">Proteine max (g)<input type="number" inputmode="numeric" data-num="pmax" min="30" max="300" value="${esc(n.pmax)}"></label></div>`:""}
  ${n.mode==="none"?`<p class="small muted">Niente calorie né grammi in giro per l'app. Dimmi solo come sono di solito le tue porzioni.</p><div class="optgrid">${SIZES.map(s=>opt("size",s.k,s.l,s.k==="piccole"?"Mangio poco, o mi alleno raramente":s.k==="medie"?"Nella media":"Ho molta fame, o faccio sport",n.size===s.k)).join("")}</div>`:""}
  <div id="numsSum">${numsSummary(P)}</div></div>`}
function unlockHTML(){const u=lastUnlock&&Date.now()-lastUnlock.at<10*60e3?lastUnlock:null;if(!u)return"";
  return`<div class="okbox stack"><h4>${u.tools.length?esc(u.tools.join(" e "))+": ":""}${u.gained.length?`sbloccate ${u.gained.length} ${u.gained.length===1?"ricetta":"ricette"}`:"ricette più veloci"}</h4>
     ${u.gained.length?`<div class="row">${u.gained.slice(0,12).map(r=>`<button class="chip sm" type="button" data-open="${r.id}">${esc(r.name)}</button>`).join("")}</div>`:""}
     ${u.fast.length?`<p class="small">Più veloci: ${esc(u.fast.slice(0,6).map(r=>r.name.toLowerCase()).join(", "))}${u.fast.length>6?"…":""}.</p>`:""}</div>`}
function secKitchen(P,withAdvice){const adv=withAdvice?buyAdvice(P):[];
  return`<div class="stack">${withAdvice?unlockHTML():""}<div class="optgrid">${TOOLS.map(t=>opt("tool",t.k,t.l,t.d,P.tools[t.k])).join("")}</div>
  <div class="row stepper"><span><b>Fuochi che usi insieme</b><br><span class="small muted">Con meno fuochi le cose si fanno una dopo l'altra: il pomeriggio si allunga.</span></span><span class="counter"><button type="button" data-g="burn" data-k="-1" aria-label="Uno in meno">−</button><span>${P.fornelli}</span><button type="button" data-g="burn" data-k="1" aria-label="Uno in più">+</button></span></div>
  ${adv.length?`<div class="infobox small"><b>Se pensi di comprare qualcosa:</b><ul>${adv.map(a=>`<li><b>${esc(a.t.l)}</b>: ${a.g.length?`sblocchi ${a.g.length} ${a.g.length===1?"ricetta":"ricette"} adatte a te (${esc(a.g.slice(0,3).map(r=>r.name.toLowerCase()).join(", "))}${a.g.length>3?"…":""})`:""}${a.g.length&&a.f.length?"; ":""}${a.f.length?`${a.f.length} ${a.f.length===1?"diventa":"diventano"} più ${a.f.length===1?"veloce":"veloci"}`:""}</li>`).join("")}</ul></div>`:""}</div>`}
function secSkill(P){return`<div class="stack"><div class="optgrid">${SKILLS.map(s=>opt("skill",s.k,s.l,s.d,P.skill===s.k)).join("")}</div>
  <h4>Quanto tempo vuoi passare in cucina la domenica?</h4><div class="row">${TIMES.map(t=>chip("time",t.k,t.l,+P.time===t.k)).join("")}</div>
  <p class="small muted">Sono tre domande diverse: cosa <i>puoi</i> fare (gli utensili), cosa <i>sai</i> fare e quanto tempo <i>vuoi</i> metterci.</p></div>`}
function secWeek(P){const fish=!pfDiet(P).no.includes("pesce")&&!(P.allergies||[]).includes("pesce");
  return`<div class="stack"><div class="optgrid">${MEAL_MODES.map(m=>opt("meals",m.k,m.l,m.d,P.meals===m.k)).join("")}</div>
  <label class="check"><input type="checkbox" data-g="snacks" ${P.snacks!==false?"checked":""}> Anche colazioni e spuntini, con la loro spesa</label>
  ${P.meals!=="c"?`<h4>A pranzo puoi scaldare il cibo?</h4><div class="optgrid">${LUNCH_HEAT.map(h=>opt("heat",h.k,h.l,h.d,P.lunchHeat===h.k)).join("")}</div>`:""}
  <h4>Obiettivi in più</h4>
  <label class="check"><input type="checkbox" data-g="goal" data-k="plants" ${P.goals.plants?"checked":""}> 30 piante diverse a settimana</label>
  <label class="check"><input type="checkbox" data-g="goal" data-k="ferm" ${P.goals.ferm?"checked":""}> Un fermentato vivo al giorno (yogurt, kefir, crauti)</label>
  ${fish?`<label class="check"><input type="checkbox" data-g="goal" data-k="oily" ${P.goals.oily?"checked":""}> Pesce azzurro almeno una volta a settimana</label>`:""}</div>`}
function profileLine(P){if(!P)return"";const t=targetsOf(P);const d=pfDiet(P);const parts=[d.l];if(P.carbs!=="normali")parts.push((CARB_MODES.find(c=>c.k===P.carbs)||{}).l.toLowerCase());
  if(P.nums.mode!=="none")parts.push(`${t.kcal} kcal`,`${t.pmin}–${t.pmax} g di proteine`);else parts.push(`porzioni ${(SIZES.find(s=>s.k===P.nums.size)||SIZES[1]).l.toLowerCase()}`);
  if((P.allergies||[]).length)parts.push("senza "+P.allergies.map(a=>ALL_LABEL[a].replace(/ \(.*\)/,"")).join(", "));
  return parts.join(" · ")}
/* Applica un'azione su un controllo (data-g, data-k) a un profilo. Ritorna true se va ridisegnato */
function profileAction(P,g,k,el){
  switch(g){
    case"diet":P.diet=k;return true;case"carbs":P.carbs=k;return true;
    case"allergy":{const s=new Set(P.allergies||[]);s.has(k)?s.delete(k):s.add(k);P.allergies=[...s];return true}
    case"spicy":P.spicy=k;return true;
    case"like":{const nx=LV_NEXT[P.likes[k]];if(nx)P.likes[k]=nx;else if(k.startsWith("i:"))P.likes[k]="mai";else delete P.likes[k];return true}
    case"likedel":delete P.likes[k];return true;
    case"likeadd":{const inp=document.getElementById("likeName");const v=inp&&inp.value.trim();if(!v){toast("Scrivi un cibo");return false}
      const g=visibleGroups(P).find(g=>norm(g.l)===norm(v)||groupHit(g,v));if(g)P.likes[g.k]=k;else P.likes["i:"+v.toLowerCase()]=k;return true}
    case"nmode":P.nums.mode=k;return true;case"sex":P.nums.body.sex=k;return true;case"act":P.nums.body.act=k;return true;case"wgoal":P.nums.body.goal=k;return true;case"size":P.nums.size=k;return true;
    case"tool":P.tools[k]=!P.tools[k];return true;case"burn":P.fornelli=clampN((+P.fornelli||0)+(+k),0,4);return true;
    case"skill":P.skill=k;return true;case"time":P.time=+k;return true;case"meals":P.meals=k;return true;case"heat":P.lunchHeat=k;return true;
    case"snacks":P.snacks=el.checked;return true;case"goal":P.goals[k]=el.checked;return true}
  return false}
function bindProfileControls(root,P,onChange){
  root.querySelectorAll("[data-g]").forEach(el=>{const ev=el.type==="checkbox"?"change":"click";el.addEventListener(ev,()=>{if(profileAction(P,el.dataset.g,el.dataset.k,el))onChange(el.dataset.g,el.dataset.k)})});
  root.querySelectorAll("[data-num]").forEach(el=>{const key=el.dataset.num;const write=()=>{const v=el.value;if(["kcal","pmin","pmax"].includes(key))P.nums[key]=v===""?"":+v;else P.nums.body[key]=v};
    el.addEventListener("input",()=>{write();const s=root.querySelector("#numsSum");if(s)s.innerHTML=numsSummary(P)});
    el.addEventListener("change",()=>{write();onChange("num",key,true)})});}

/* ---------- questionario iniziale ---------- */
const ONB_STEPS=[
 {k:"welcome"},
 {k:"diet",t:"Cosa mangi?",s:"La scelta più importante: decide quali ricette entrano nelle tue settimane.",f:P=>secDiet(P),ok:P=>!!P.diet},
 {k:"allergies",t:"Allergie e intolleranze",s:"Le ricette con questi ingredienti non ti verranno mai proposte. Se non ne hai, vai avanti.",f:P=>secAllergies(P)},
 {k:"tastes",t:"I tuoi gusti",s:"Quello che non ti piace sparisce, quello che ami torna più spesso.",f:P=>secTastes(P)},
 {k:"nums",t:"Quanto mangi?",s:"Serve a decidere quanto grandi fare le porzioni.",f:P=>secNums(P),ok:P=>P.nums.mode!=="calc"||!!calcTargets(P.nums.body)},
 {k:"kitchen",t:"Cosa c'è nella tua cucina?",s:"Le ricette che chiedono un utensile che non hai spariscono; quelle che lo usano per fare prima diventano più lente, ma restano.",f:P=>secKitchen(P,false)},
 {k:"skill",t:"Tu e la cucina",s:"",f:P=>secSkill(P)},
 {k:"week",t:"La tua settimana",s:"",f:P=>secWeek(P)},
 {k:"summary"}
];
let onb=null;
function startOnboarding(fromProfile){onb={i:0,P:fixProfile(fromProfile&&S.profile?clone(S.profile):blankProfile()),redo:!!fromProfile};if(onb.redo){onb.P.legacy=false;onb.i=1}document.body.classList.add("onb-open");document.getElementById("onb").hidden=false;renderOnb()}
function endOnboarding(){document.body.classList.remove("onb-open");document.getElementById("onb").hidden=true;onb=null}
function renderOnb(){const el=document.getElementById("onb");const st=ONB_STEPS[onb.i],P=onb.P;const total=ONB_STEPS.length-1;
  const prog=`<div class="onb-prog" aria-hidden="true"><i style="width:${Math.round(onb.i/total*100)}%"></i></div>`;
  let body="";
  if(st.k==="welcome")body=`<div class="onb-hero"><img src="icon-192.png" alt="" width="72" height="72"><h1>Schiscia</h1><p class="lead">Il menu della settimana, la spesa e il piano per cucinare tutto in un pomeriggio.</p></div>
    <div class="panel stack"><p>Prima qualche domanda, due minuti: servono a scegliere le ricette giuste per te, con le porzioni giuste e gli utensili che hai. Puoi cambiare tutto quando vuoi dal profilo, in alto a destra.</p>
    <label class="f">Come ti chiami? (facoltativo)<input type="text" id="onbName" value="${esc(P.name)}" autocomplete="given-name"></label></div>
    <p class="small muted">Hai già usato Schiscia su un altro telefono? <label class="linkbtn" for="onbImport">Importa un backup</label><input type="file" id="onbImport" accept="application/json,.json" hidden></p>`;
  else if(st.k==="summary"){const{d,n}=withProfile(P,()=>({d:diagnose(P,new Date().getMonth()+1),n:S.recipes.filter(r=>["main","base","side"].includes(r.role)&&allowed(r,P)).length}));
    body=`<h2>Ecco il tuo profilo</h2><div class="panel stack"><p><b>${esc(profileLine(P))}</b></p>
      <p class="small muted">Ricette adatte a te: <b>${n}</b> tra principali, cereali e contorni. ${P.meals==="pc"?"Dieci pasti":"Cinque pasti"} da preparare la domenica${P.snacks!==false?", più colazioni e spuntini":""}, in circa ${(TIMES.find(t=>t.k===+P.time)||TIMES[1]).l.toLowerCase()}.</p></div>
      ${diagnoseHTML(d)}
      <p class="small muted">Tutto si cambia dal profilo, in alto a destra: le ricette e le porzioni si aggiornano subito.</p>`}
  else body=`<h2>${esc(st.t)}</h2>${st.s?`<p class="muted">${esc(st.s)}</p>`:""}<div id="onbSec">${st.f(P)}</div>`;
  const canNext=!st.ok||st.ok(P);
  el.innerHTML=`<div class="onb-in">${prog}${body}<div class="onb-nav">${onb.i>0?`<button class="btn ghost" type="button" id="onbBack">Indietro</button>`:onb.redo?`<button class="btn ghost" type="button" id="onbCancel">Annulla</button>`:"<span></span>"}<button class="btn" type="button" id="onbNext" ${canNext?"":"disabled"}>${st.k==="welcome"?"Inizia":st.k==="summary"?(onb.redo?"Salva il profilo":"Crea la mia prima settimana"):"Avanti"}</button></div></div>`;
  const sec=el.querySelector("#onbSec");if(sec)bindProfileControls(sec,P,(g,k,noRedraw)=>{if(noRedraw){const b=el.querySelector("#onbNext");if(b)b.disabled=!(!st.ok||st.ok(P));return}const y=window.scrollY;renderOnb();window.scrollTo(0,y)});
  const nm=el.querySelector("#onbName");nm&&nm.addEventListener("input",()=>P.name=nm.value.trim());
  const imp=el.querySelector("#onbImport");imp&&imp.addEventListener("change",e=>importBackupFile(e.target.files[0],()=>{endOnboarding();applyProfile();autoWeek();show("settimana")}));
  const bk=el.querySelector("#onbBack");bk&&bk.addEventListener("click",()=>{onb.i--;renderOnb();window.scrollTo(0,0)});
  const cc=el.querySelector("#onbCancel");cc&&cc.addEventListener("click",()=>{endOnboarding();show("profilo")});
  el.querySelector("#onbNext").addEventListener("click",()=>{if(st.k!=="summary"){onb.i++;renderOnb();window.scrollTo(0,0);return}finishOnboarding()});
}
function finishOnboarding(){const redo=onb.redo,old=S.profile?clone(S.profile):null;S.profile=onb.P;S.profile.legacy=false;endOnboarding();applyProfile();
  if(!redo||!S.week){S.week=null;S.weekStart=null;autoWeek();save();show("settimana");toast(S.profile.name?`Ecco la tua prima settimana, ${S.profile.name}`:"Ecco la tua prima settimana");return}
  save();afterProfileChange(old);show("profilo")}

/* ---------- vista profilo ---------- */
let lastUnlock=null;
function afterProfileChange(old){applyProfile();const snacks=refreshSnacks();
  if(old){const u=unlockDiff(old,S.profile);const gained=u.gained.filter(r=>r.role!=="fermento"||hasTool(S.profile)("bilancia"));
    const toolAdded=TOOLS.filter(t=>S.profile.tools[t.k]&&!old.tools[t.k]).map(t=>t.l);
    const fast=toolAdded.length?TOOLS.filter(t=>S.profile.tools[t.k]&&!old.tools[t.k]).flatMap(t=>fasterWith(old,t.k)).map(x=>x.r):[];
    if(gained.length||fast.length)lastUnlock={gained,fast:[...new Set(fast)],tools:toolAdded,at:Date.now()};
    if(toolAdded.length&&(gained.length||fast.length)){toast(`${toolAdded.join(" e ")}: ${gained.length?`sblocchi ${gained.length} ${gained.length===1?"ricetta":"ricette"}`:`${new Set(fast).size} ricette più veloci`}`);toastT=Date.now()}}
  const imp=weekImpact().length;if(imp>impactSeen){toast(`${imp} ${imp===1?"pasto della settimana non va":"pasti della settimana non vanno"} più bene: in cima al profilo puoi rifarli`);toastT=Date.now()}impactSeen=imp;
  save();return snacks}
let impactSeen=0;
function renderProfile(){const el=document.getElementById("v-profilo");const P=S.profile;if(!P){el.innerHTML="";return}
  const imp=weekImpact();const d=diagnose();const ok=S.recipes.filter(r=>allowed(r));const cnt=role=>ok.filter(r=>r.role===role).length;
  const sect=(id,title,html,open)=>`<details class="psec" id="ps-${id}" ${open?"open":""}><summary><h3>${title}</h3></summary><div class="psec-b">${html}</div></details>`;
  el.innerHTML=`<div class="panel stack phead"><div class="row" style="justify-content:space-between;align-items:start"><div><div class="eyebrow">${P.name?esc(P.name):"Il tuo profilo"}</div><p class="big">${esc(profileLine(P))}</p></div></div>
     <p class="small muted">Adatte a te: ${cnt("main")} principali, ${cnt("base")} cereali, ${cnt("side")} contorni, ${cnt("scorta")} sughi, ${cnt("dolce")} dolci, ${cnt("fermento")} fermentati. Ogni modifica vale subito: ricette, porzioni, spesa e piano si aggiornano.</p></div>
   ${imp.length?`<div class="warnbox stack" id="impactBox"><h4>La settimana in corso</h4><p class="small">${impactText(imp)}</p>
     <div class="row"><button class="btn sm" type="button" id="applyWeek">Rifai ${imp.length===1?"quel pasto":`quei ${imp.length} pasti`}</button><button class="btn ghost sm" type="button" id="seeWeek">Guarda la settimana</button></div>
     <p class="small muted">Restano com'erano i pasti col lucchetto (quelli che hai già cucinato) e quelli che vanno ancora bene. Se preferisci, lascia tutto: il nuovo profilo vale comunque dalla prossima settimana.</p></div>`:""}
   ${diagnoseHTML(d)}
   ${sect("diet","Cosa mangi",secDiet(P),false)}
   ${sect("allergies","Allergie e intolleranze",secAllergies(P),false)}
   ${sect("tastes","Gusti",secTastes(P),false)}
   ${sect("nums","Quanto mangi",secNums(P),false)}
   ${sect("kitchen","Utensili",secKitchen(P,true),false)}
   ${sect("skill","Abilità e tempo",secSkill(P),false)}
   ${sect("week","La settimana",secWeek(P),false)}
   ${sect("name","Nome",`<label class="f">Come ti chiami?<input type="text" id="pName" value="${esc(P.name)}" autocomplete="given-name"></label>`,false)}
   <div class="panel stack"><h3>Condividi Schiscia</h3><p class="small muted">Manda il link a chi vuoi: aprendolo farà il suo questionario e avrà la sua Schiscia, con le sue ricette e i suoi dati solo sul suo telefono. Il tuo profilo non lo vede nessuno.</p>
     <div class="row"><button class="btn sm" type="button" id="shareApp">Condividi il link</button><button class="btn ghost sm" type="button" id="redoQuiz">Rifai il questionario</button></div>
     <textarea id="shareFallback" hidden aria-label="Link da copiare"></textarea></div>`;
  const open=new Set(JSON.parse(sessionStorage.getItem("schiscia-psec")||"[]"));el.querySelectorAll("details.psec").forEach(dt=>{if(open.has(dt.id))dt.open=true;dt.addEventListener("toggle",()=>{const o=new Set(JSON.parse(sessionStorage.getItem("schiscia-psec")||"[]"));dt.open?o.add(dt.id):o.delete(dt.id);try{sessionStorage.setItem("schiscia-psec",JSON.stringify([...o]))}catch(e){}})});
  el.querySelectorAll(".psec-b").forEach(sec=>{let old=null;bindProfileControls(sec,P,(g,k,fromNum)=>{const y=window.scrollY;afterProfileChange(old);old=null;renderProfile();window.scrollTo(0,y);toastOnce()});
    sec.addEventListener("click",()=>{old=old||clone(P)},true);sec.addEventListener("change",()=>{old=old||clone(P)},true);sec.addEventListener("focusin",()=>{old=old||clone(P)},true)});
  const nm=el.querySelector("#pName");nm&&nm.addEventListener("change",()=>{P.name=nm.value.trim();save();renderProfile()});
  const aw=el.querySelector("#applyWeek");aw&&aw.addEventListener("click",()=>{const n=imp.length;const g=applyToWeek();lastUnlock=null;toast(g.note||`Settimana aggiornata: ${n} ${n===1?"pasto rifatto":"pasti rifatti"}`);show("settimana")});
  const sw=el.querySelector("#seeWeek");sw&&sw.addEventListener("click",()=>show("settimana"));
  el.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{backTo="profilo";view="ricette";document.getElementById("v-profilo").hidden=true;document.getElementById("v-ricette").hidden=false;showDetail(b.dataset.open)}));
  el.querySelector("#redoQuiz").addEventListener("click",()=>startOnboarding(true));
  el.querySelector("#shareApp").addEventListener("click",shareApp)}
let toastT=0;function toastOnce(){if(Date.now()-toastT>2500){toastT=Date.now();toast("Profilo aggiornato")}}
function impactText(imp){
  const bad=imp.filter(x=>x.is.length),off=imp.filter(x=>x.off),emp=imp.filter(x=>x.empty);const parts=[];
  const uniq=[...new Map(bad.map(x=>[x.is[0].name,x.is[0]])).values()];
  if(bad.length)parts.push(`${bad.length===1?"Un pasto non va":`${bad.length} pasti non vanno`} più bene col profilo. ${uniq.slice(0,3).map(x=>`${x.name}: ${x.t}`).join("; ")}${uniq.length>3?"…":""}.`);
  if(off.length)parts.push(`${off.length} ${off.length===1?"pasto non è più":"pasti non sono più"} tra quelli che prepari.`);
  if(emp.length)parts.push(`${emp.length} ${emp.length===1?"pasto è vuoto":"pasti sono vuoti"}.`);
  return parts.join(" ")}
async function shareApp(){const url=location.origin+location.pathname.replace(/index\.html$/,"");const text="Schiscia: menu della settimana, spesa e piano per il meal prep. Apri il link, rispondi a due minuti di domande e si adatta a te.";
  try{if(navigator.share){await navigator.share({title:"Schiscia",text,url});return}}catch(e){if(e&&e.name==="AbortError")return}
  const fb=document.getElementById("shareFallback");const done=()=>toast("Link copiato");try{await navigator.clipboard.writeText(url);done()}catch(e){fb.hidden=false;fb.value=url;fb.focus();fb.select();toast("Seleziona e copia il link")}}
function importBackupFile(f,then){if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d.recipes)throw 0;if(!("profile" in d)||!d.profile)d.profile=legacyProfile();S={...defaults(),...d};S.profile=fixProfile(S.profile);if((S.libVersion||0)<LIB_VERSION)mergeLib(S);save();toast("Backup importato");then&&then()}catch(err){toast("Questo file non è un backup di Schiscia")}};rd.readAsText(f)}
/* Una volta sola, a chi usava già l'app: il profilo esiste ed è fatto come l'app di prima */
function newsCard(){const P=S.profile;if(!P||!P.legacy||!P.news)return"";
  return`<div class="infobox stack" id="newsCard"><h4>Novità: Schiscia ora ha un profilo</h4><p class="small">Dieta, porzioni, gusti, utensili e tempo: l'app si adatta a chi la usa, e la puoi condividere con chi vuoi. Il tuo profilo l'ho fatto uguale a come funzionava finora (pescetariana, ${KCAL_TARGET} kcal, ${PROT_MIN}–${PROT_MAX} g di proteine, niente piccante). Dai un'occhiata agli utensili: forno, due fuochi, frullatore e bilancia sì, pentola a pressione e tritatutto no.</p>
    <div class="row"><button class="btn sm" type="button" id="newsOpen">Apri il profilo</button><button class="btn ghost sm" type="button" id="newsOk">Va bene così</button></div></div>`}
function bindNews(root){const o=root.querySelector("#newsOpen"),k=root.querySelector("#newsOk");if(!o)return;const close=()=>{S.profile.news=false;save()};o.addEventListener("click",()=>{close();show("profilo")});k.addEventListener("click",()=>{close();root.querySelector("#newsCard").remove()})}
document.getElementById("profileBtn").addEventListener("click",()=>show("profilo"));
