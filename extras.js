/* ============ GUIDA FRIGO ============ */
const THINK=[
  {q:"Perché il merluzzo cotto dura 2 giorni e il dahl 4?",hint:"Dove vive un merluzzo, e a che temperatura sono abituati i suoi batteri?",
   a:["I batteri tipici del pesce (<i>Shewanella</i>, <i>Pseudomonas</i>) sono psicrotrofi: vengono da acque fredde e crescono anche a 4 °C. Trasformano l'ossido di trimetilammina nell'odore di pesce vecchio.","<A>Per un batterio del manzo il frigo è un inverno siberiano. Per un batterio del merluzzo è casa: rallenta, ma continua a lavorare.","Per questo il pesce si mangia a inizio settimana e le preparazioni di pesce per dopo passano dal freezer."]},
  {q:"Perché non posso mettere la pentola calda in frigo così com'è?",hint:"Da dove esce il calore, e quanta strada deve fare quello del centro?",
   a:["Il calore esce dalla superficie, e una pentola piena ne ha poca rispetto al volume. Il centro resta per ore tra 5 e 60 °C, e intanto scalda il resto del frigo.","<A>È l'uscita da uno stadio: con una sola porta la folla ci mette ore. I contenitori bassi sono dieci porte aperte.","Le spore sopravvissute alla cottura germinano proprio durante un raffreddamento lento."]},
  {q:"Perché il riso cotto è più rischioso del farro, e perché riscaldarlo bene non basta?",hint:"Differenza tra uccidere un batterio e distruggere ciò che ha già prodotto.",
   a:["Le spore di <i>Bacillus cereus</i> resistono alla bollitura; se il riso resta tiepido germinano e producono cereulide, una tossina termostabile. Riscaldare uccide i batteri, la tossina resta.","<A>Come il sale sciolto nell'acqua: puoi farla bollire quanto vuoi, il sale non se ne va. La prevenzione sta nel raffreddamento.","Il farro non è a rischio zero, ma è molto meno documentato. Regole uguali per tutti i cereali."]},
  {q:"Il freezer uccide i batteri?",hint:"Cosa succede a un film quando premi pausa?",
   a:["No, li mette in pausa: a −18 °C non si moltiplicano, allo scongelamento ripartono.","<A>È il tasto pausa, non lo stop. Si congela il cibo appena raffreddato, non quello che è già stato tre giorni in frigo.","I mesi del freezer riguardano soprattutto la qualità, non la sicurezza."]},
  {q:"Perché si scongela in frigo e non sul piano della cucina?",hint:"Quale parte di un blocco congelato si scongela per prima?",
   a:["La superficie si scongela ore prima del centro: sul bancone passa ore a 20 °C mentre il cuore è ancora ghiacciato.","In frigo la superficie non supera i 4 °C. Per questo l'app ti segna le sere di trasloco."]},
  {q:"Perché la frittata non va in freezer ma il dahl sì?",hint:"Cosa fa l'acqua quando diventa ghiaccio dentro una rete di proteine?",
   a:["I cristalli di ghiaccio lacerano la rete di proteine dell'uovo cotto e allo scongelamento l'acqua esce (sineresi): gommosa e acquosa.","Il dahl è già una crema: se la struttura cambia un po', non te ne accorgi."]}
];
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function renderGuide(){
  document.getElementById("think").innerHTML=THINK.map(t=>`<details class="q"><summary>${t.q}</summary><p class="hint">Spunto: ${t.hint}</p><div class="ans">${t.a.map(x=>x.startsWith("<A>")?`<p class="analogy">${x.slice(3)}</p>`:`<p>${x}</p>`).join("")}</div></details>`).join("");
  const s=document.getElementById("coolChart");
  const ink=cssv("--ink"),ink3=cssv("--ink-3"),line=cssv("--line"),dang=cssv("--danger"),ds=cssv("--danger-soft"),fr=cssv("--fridge"),acc=cssv("--accent");
  const X0=48,X1=700,Y0=250,Y1=20,T=8,x=h=>X0+(h/T)*(X1-X0),y=t=>Y0-(t/100)*(Y0-Y1);
  const curve=k=>{let p="";for(let h=0;h<=T;h+=.1){const t=4+91*Math.exp(-k*h);p+=(h?"L":"M")+x(h).toFixed(1)+","+y(t).toFixed(1)}return p};
  const kB=.42,kS=2.3,cs=Math.log(91)/kS;
  let g=`<rect x="${X0}" y="${y(60)}" width="${X1-X0}" height="${y(5)-y(60)}" fill="${ds}"/><text x="${X1-6}" y="${y(60)+16}" text-anchor="end" font-size="12" fill="${dang}" font-family="Lato,sans-serif">zona di pericolo 5–60 °C</text>`;
  [0,20,40,60,80,100].forEach(t=>g+=`<line x1="${X0}" x2="${X1}" y1="${y(t)}" y2="${y(t)}" stroke="${line}"/><text x="${X0-8}" y="${y(t)+4}" text-anchor="end" font-size="11" fill="${ink3}" font-family="Lato,sans-serif">${t}°</text>`);
  for(let h=0;h<=T;h++)g+=`<text x="${x(h)}" y="${Y0+18}" text-anchor="middle" font-size="11" fill="${ink3}" font-family="Lato,sans-serif">${h}h</text>`;
  g+=`<path d="${curve(kB)}" fill="none" stroke="${dang}" stroke-width="3"/><path d="${curve(kS)}" fill="none" stroke="${fr}" stroke-width="3"/>`;
  g+=`<circle cx="${x(cs)}" cy="${y(5)}" r="5" fill="${fr}"/><text x="${x(cs)+10}" y="${y(5)-10}" font-size="13" fill="${fr}" font-weight="700" font-family="Lato,sans-serif">contenitori bassi: sotto i 5° in ~2 h</text>`;
  g+=`<text x="${x(3.2)}" y="${y(4+91*Math.exp(-kB*3.2))-10}" font-size="13" fill="${dang}" font-weight="700" font-family="Lato,sans-serif">pentola piena: tiepida dopo 6 h</text>`;
  g+=`<line x1="${x(2)}" x2="${x(2)}" y1="${Y1}" y2="${Y0}" stroke="${acc}" stroke-dasharray="4 4"/><text x="${x(2)+6}" y="${Y1+12}" font-size="11" fill="${acc}" font-family="Lato,sans-serif">limite 2 h</text><line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" stroke="${ink}" stroke-width="1.5"/>`;
  s.innerHTML=g;
}

/* ============ ILLUSTRATIONS ============ */
function rng(seed){let s=Math.abs(seed)%2147483647||1;return()=>(s=s*16807%2147483647)/2147483647}
function shade(hex,a){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,v));return "#"+((1<<24)+(f((n>>16)+a)<<16)+(f((n>>8&255)+a)<<8)+f((n&255)+a)).toString(16).slice(1)}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function blob(c,x,y,r,R,j){c.beginPath();for(let i=0;i<=9;i++){const a=i/9*6.283,q=r*(1-j/2+R()*j);i?c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):c.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath()}
function drawCanvases(){document.querySelectorAll("canvas[data-draw]").forEach(cv=>{const r=R(cv.dataset.draw);if(r&&r.draw)drawDish(cv,r.draw,r.id)})}
function drawDish(cv,spec,key){
  const dpr=Math.min(2,window.devicePixelRatio||1),W=cv.clientWidth||300,H=W*.75;cv.width=W*dpr;cv.height=H*dpr;
  const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);const Rn=rng([...key].reduce((a,ch)=>a*31+ch.charCodeAt(0),7));
  c.fillStyle=cssv("--table")||"#D9E0D6";c.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,Rad=Math.min(W,H)*.44;let area,pan=null;
  c.save();c.shadowColor="rgba(0,0,0,.22)";c.shadowBlur=14;c.shadowOffsetY=5;
  if(spec.vessel==="plate"){c.fillStyle="#F6F5EF";c.beginPath();c.arc(cx,cy,Rad,0,7);c.fill();c.restore();c.strokeStyle="#E1E0D6";c.lineWidth=2;c.beginPath();c.arc(cx,cy,Rad*.74,0,7);c.stroke();
    const fr=Rad*.66;area=()=>{const a=Rn()*6.283,d=Math.sqrt(Rn())*fr;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d]};if(spec.pastaBed){c.fillStyle=spec.pastaBed;blob(c,cx,cy,Rad*.6,Rn,.12);c.fill()}}
  else if(spec.vessel==="bowl"){c.fillStyle=spec.bowl;c.beginPath();c.arc(cx,cy,Rad,0,7);c.fill();c.restore();c.fillStyle=shade(spec.bowl,-18);c.beginPath();c.arc(cx,cy,Rad*.86,0,7);c.fill();
    const fr=Rad*.8;c.fillStyle=spec.base;c.beginPath();c.arc(cx,cy+2,fr,0,7);c.fill();c.globalAlpha=.35;c.fillStyle=spec.base2;for(let i=0;i<40;i++){const a=Rn()*6.283,d=Math.sqrt(Rn())*fr*.85;c.beginPath();c.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,Rad*(.04+Rn()*.08),0,7);c.fill()}c.globalAlpha=1;
    area=()=>{const a=Rn()*6.283,d=Math.sqrt(Rn())*fr*.86;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d]}}
  else if(spec.vessel==="tray"){const w=W*.86,h=H*.8,x0=cx-w/2,y0=cy-h/2;c.fillStyle="#2E3236";rr(c,x0,y0,w,h,14);c.fill();c.restore();c.fillStyle="#EFE9DC";rr(c,x0+10,y0+10,w-20,h-20,6);c.fill();
    area=()=>[x0+24+Rn()*(w-48),y0+24+Rn()*(h-48)]}
  else{c.fillStyle="#2A2A2A";rr(c,cx+Rad*.85,cy-Rad*.09,Rad*.75,Rad*.18,6);c.fill();c.beginPath();c.arc(cx-Rad*.12,cy,Rad*.95,0,7);c.fill();c.restore();
    const px=cx-Rad*.12,fr=Rad*.82;c.fillStyle=spec.base;c.beginPath();c.arc(px,cy,fr,0,7);c.fill();c.globalAlpha=.3;for(let i=0;i<50;i++){c.fillStyle=Rn()>.5?spec.base2:"#C98F2C";const a=Rn()*6.283,d=Math.sqrt(Rn())*fr*.9;c.beginPath();c.arc(px+Math.cos(a)*d,cy+Math.sin(a)*d,Rad*(.02+Rn()*.06),0,7);c.fill()}c.globalAlpha=1;
    area=()=>{const a=Rn()*6.283,d=Math.sqrt(Rn())*fr*.85;return[px+Math.cos(a)*d,cy+Math.sin(a)*d]};pan=[px,cy,fr]}
  c.shadowColor="rgba(0,0,0,.25)";c.shadowBlur=3;c.shadowOffsetY=1.5;
  spec.pieces.forEach(p=>{for(let i=0;i<p.n;i++){let[x,y]=area();const s=Rad*p.s*(.8+Rn()*.4),rot=Rn()*6.283;if(p.t==="fillet"){x=cx+(i?Rad*.05:-Rad*.28);y=cy+(i?Rad*.2:-Rad*.12)}if(p.t==="wedge"){x=cx+Rad*.42;y=cy+Rad*.35}piece(c,p,x,y,s,rot,Rn)}});
  c.shadowColor="transparent";
  if(spec.slices&&pan){const[px,py,fr]=pan;c.strokeStyle="rgba(120,80,20,.55)";c.lineWidth=2;for(let i=0;i<spec.slices;i++){const a=i/spec.slices*6.283+.3;c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*fr,py+Math.sin(a)*fr);c.stroke()}}
}
function piece(c,p,x,y,s,rot,R){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=p.c;
  switch(p.t){
    case"grain":c.beginPath();c.ellipse(0,0,s,s*.55,0,0,7);c.fill();break;
    case"cube":rr(c,-s/2,-s/2,s,s,s*.18);c.fill();c.globalAlpha=.5;c.fillStyle=shade(p.c,-40);rr(c,-s/2,s*.15,s,s*.35,s*.15);c.fill();c.globalAlpha=1;break;
    case"floret":for(let i=0;i<6;i++){const a=i/6*6.283;c.beginPath();c.arc(Math.cos(a)*s*.28,Math.sin(a)*s*.28,s*.3,0,7);c.fill()}break;
    case"round":c.beginPath();c.arc(0,0,s/2,0,7);c.fill();c.fillStyle=p.inner;c.beginPath();c.arc(0,0,s*.36,0,7);c.fill();break;
    case"ring":c.strokeStyle=p.c;c.lineWidth=s*.22;c.lineCap="round";c.beginPath();c.arc(0,0,s*.5,0,3.6);c.stroke();break;
    case"needle":c.beginPath();c.ellipse(0,0,s*.7,s*.12,0,0,7);c.fill();break;
    case"leaf":c.beginPath();c.ellipse(0,0,s*.6,s*.32,0,0,7);c.fill();break;
    case"leafy":blob(c,0,0,s*.55,R,.5);c.fill();break;
    case"dot":c.beginPath();c.arc(0,0,s,0,7);c.fill();break;
    case"ball":c.beginPath();c.arc(0,0,s*.5,0,7);c.fill();c.globalAlpha=.5;c.fillStyle=shade(p.c,-45);c.beginPath();c.arc(s*.12,s*.12,s*.36,0,7);c.fill();c.globalAlpha=1;break;
    case"fillet":c.rotate(-rot-.25);c.beginPath();c.ellipse(0,0,s*.62,s*.26,0,0,7);c.fill();c.fillStyle=p.crumb;c.globalAlpha=.85;for(let i=0;i<70;i++){const a=R()*6.283,d=Math.sqrt(R());c.beginPath();c.arc(Math.cos(a)*d*s*.55,Math.sin(a)*d*s*.2,1+R()*1.8,0,7);c.fill()}c.globalAlpha=1;break;
    case"wedge":c.rotate(-rot+.6);c.beginPath();c.moveTo(0,0);c.arc(0,0,s,-.9,.9);c.closePath();c.fill();c.fillStyle="#FBF1B8";c.beginPath();c.moveTo(0,0);c.arc(0,0,s*.82,-.8,.8);c.closePath();c.fill();break;
    case"penne":rr(c,-s*.5,-s*.16,s,s*.32,s*.12);c.fill();c.globalAlpha=.55;c.fillStyle="#B53A24";rr(c,-s*.3,-s*.16,s*.5,s*.32,s*.1);c.fill();c.globalAlpha=1;break;
    case"flake":blob(c,0,0,s*.5,R,.6);c.fill();break;
    case"olive":c.beginPath();c.arc(0,0,s,0,7);c.fill();c.fillStyle="#6B2A22";c.beginPath();c.arc(0,0,s*.4,0,7);c.fill();break;
    case"swirl":c.rotate(-rot);c.strokeStyle=p.c;c.lineWidth=4;c.lineCap="round";c.beginPath();c.moveTo(-s*.5,0);c.bezierCurveTo(-s*.1,-s*.5,s*.2,s*.4,s*.5,-s*.05);c.stroke();break;
  }c.restore()}
let rsz;window.addEventListener("resize",()=>{clearTimeout(rsz);rsz=setTimeout(()=>{drawCanvases();if(view==="guida")renderGuide()},150)});


/* ============ AVVIO ============ */
autoWeek();
show("settimana");
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
