/* Filter- und Sortierfenster an der Suchleiste – gemeinsam für Übersicht und Baustelle (tools/build.py setzt es ein).
   FDEF[name]={std, sort, gruppen, liste}; gewählte Werte in META.f. */
const FDEF={};
IC.filt=IC.filt||"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z";
/* Filter/Sortieren-Fenster an der Suchleiste (gleich für alle Listen) */
const fW=(n,k)=>{ const v=(META.f||{})[n+"."+k]; return v==null?FDEF[n].std[k]:v; };
/* FDEF[n].ohne: Schlüssel, die woanders umgeschaltet werden (z. B. Umschalter über der Liste) – zählen nicht als Filter */
const fAktiv=n=>Object.keys(FDEF[n].std).some(k=>!(FDEF[n].ohne||[]).includes(k)&&fW(n,k)!==FDEF[n].std[k]);
const fKnopf=n=>({act:"fPop",n,aktiv:fAktiv(n)});
function fNeu(n){ const r=$("#res"); if(r) r.innerHTML=FDEF[n].liste(); const f=$(".such-f"); if(f) f.classList.toggle("an",fAktiv(n)); }
function fSet(n,k,v){ META.f=Object.assign({},META.f||{},{[n+"."+k]:v}); metaSave(); fNeu(n); }
function fWeg(n,alles){ const D=FDEF[n], f=Object.assign({},META.f||{}); Object.keys(D.std).forEach(k=>{ if((alles||k!=="sort")&&!(D.ohne||[]).includes(k)) delete f[n+"."+k]; }); META.f=f; metaSave(); fNeu(n); }
function fInfo(n,anz,ein,mehr){ const D=FDEF[n], t=D.gruppen.filter(g=>fW(n,g.k)!==D.std[g.k]).map(g=>(g.opts.find(o=>o[0]===fW(n,g.k))||[,""])[1]);
  return t.length?`<p class="meta f-info">${anz} ${anz===1?ein:mehr} · ${esc(t.join(" · "))} <button class="btn-text inl" data-act="fWeg" data-n="${n}">Filter aufheben</button></p>`:""; }
const abcB=x=>{ const c=String(x||"").trim().normalize("NFD").replace(/[̀-ͯ]/g,"").charAt(0).toUpperCase(); return /[A-Z]/.test(c)?c:"#"; };
function abcListe(L,name,item){ const gr=[]; L.forEach(x=>{ const b=abcB(name(x)); if(!gr.length||gr[gr.length-1][0]!==b) gr.push([b,[]]); gr[gr.length-1][1].push(x); });
  return gr.map(([b,G])=>`<div class="abc-gr"><div class="abc-b" aria-hidden="true">${b}</div><div class="abc-l">${listOf(G.map(item))}</div></div>`).join(""); }
function filterPop(btn,n){ $("#fpop")?.remove(); $("#fpopBg")?.remove(); const D=FDEF[n];
  const bg=document.createElement("div"); bg.id="fpopBg"; document.body.appendChild(bg);
  const m=document.createElement("div"); m.id="fpop"; m.className="fpop";
  const male=()=>{ m.innerHTML=`<div class="fp-t">Sortieren</div><div class="fp-sort">${D.sort.map(([v,t])=>`<button type="button" class="fp-i${fW(n,"sort")===v?" an":""}" data-fk="sort" data-fv="${esc(v)}">${esc(t)}</button>`).join("")}</div>`
    +D.gruppen.map(g=>`<div class="fp-t">${esc(g.t)}</div><div class="fp-chips">${g.opts.map(([v,t])=>`<button type="button" class="fp-c${fW(n,g.k)===v?" an":""}" data-fk="${g.k}" data-fv="${esc(v)}">${esc(t)}</button>`).join("")}</div>`).join("")
    +(fAktiv(n)?`<div class="fp-f"><button type="button" class="btn-text" data-freset="1">Zurücksetzen</button></div>`:""); };
  male(); document.body.appendChild(m);
  const r=btn.getBoundingClientRect(), w=Math.min(340,innerWidth-16); m.style.width=w+"px"; m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px"; m.style.top=(r.bottom+8)+"px"; m.style.maxHeight=(innerHeight-r.bottom-24)+"px";
  m.addEventListener("click",e=>{ const a=e.target.closest("[data-fk]"); if(a){ fSet(n,a.dataset.fk,a.dataset.fv); male(); return; } if(e.target.closest("[data-freset]")){ fWeg(n,true); male(); } });
  const zu=()=>{ m.remove(); bg.remove(); removeEventListener("resize",zu); }; bg.addEventListener("click",zu); addEventListener("resize",zu); }
