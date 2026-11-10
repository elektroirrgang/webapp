/* ===== Schnell messen (Netzwerk, Max 10.11.2026) =====
   Statt Formular je Link: oben unter „Messen“ eine Karte für den nächsten offenen Link – große Knöpfe Bestanden / Fehler,
   Länge optional, Übertragung einmal wählen (merkt sich das Gerät). Bestanden = Belegung i. O. (gerade, Schirm wie Auftrag)
   und Übertragung bis zur gewählten Stufe i. O.; danach springt die Karte zum nächsten offenen Link. Fehler/Nicht gemessen öffnen das ausführliche Fenster. */
const ECQ={id:null};
const ecqSpeed=()=>{ try{ return localStorage.getItem("ec-q-speed")||"v1g"; }catch(e){ return "v1g"; } };
/* Reihenfolge der Karte: nach Dosennummer (0.1, 1.1, 1.2 …), sonst wie die Liste */
function ecqReihe(L){ const n=p=>typeof npNr==="function"?npNr(p.d):null; return L.map((p,i)=>({p,i})).sort((a,b)=>{ const x=n(a.p), y=n(b.p); return (x==null)-(y==null)||(x||0)-(y||0)||a.p.i-b.p.i||a.i-b.i; }).map(o=>o.p); }
function ecqOffen(pr,L){ return L.filter(p=>["open","wip"].includes(ecNetStand(pr,p))); }
function ecqKarte(pr,g,L0){ if(pr.status==="fertig") return ""; const L=ecqReihe(L0), O=ecqOffen(pr,L); if(!O.length) return "";
  let p=ECQ.id&&L.find(x=>x.id===ECQ.id); if(!p||!O.includes(p)) p=O[0]; ECQ.id=p.id;
  const w=ecW(pr,p.id), sp=ecqSpeed(), fertig=L.length-O.length, ort=typeof ecPortOrt==="function"?ecPortOrt(g,p):ecRaumName(g,p.raumId);
  const x=ecPpTeile(p.ppk), patch=x?`Patchfeld ${x.pf}, Port ${x.port}`:"noch kein Patchport";
  return `<section class="card ecq" id="ecq">
    <div class="ecq-kopf"><span class="ecq-nr">${esc(p.nr||p.pp||"–")}</span><span class="ecq-t"><b>${esc(ort)}</b><small>${esc([patch,ecSchrName(g,p.d.sId)].filter(Boolean).join(" · "))}</small></span><span class="ecq-z">${fertig+1} / ${L.length}</span></div>
    <div class="ecq-zeile"><label for="ecqLen">Länge</label><span class="ec-ein"><input id="ecqLen" inputmode="decimal" placeholder="optional" value="${esc(w.len||"")}" autocomplete="off"><span>m</span></span></div>
    <div class="ecq-zeile"><span class="lbl">Übertragung</span><div class="chips">${EC_NV.map(([k,t])=>`<button type="button" class="chip" data-act="ecqSp" data-v="${k}" aria-pressed="${sp===k}">${t.replace(" Mbit/s"," Mbit").replace(" Gbit/s"," Gbit")}</button>`).join("")}</div></div>
    <div class="ecq-btns"><button type="button" class="ecq-ok" data-act="ecq" data-v="ok">Bestanden</button><button type="button" class="ecq-bad" data-act="ecq" data-v="nok">Fehler …</button></div>
    <div class="ecq-mehr"><button type="button" data-act="ecq" data-v="ng">Nicht gemessen …</button><button type="button" data-act="ecq" data-v="skip">Überspringen</button></div></section>`; }
function ecqSpeichern(pr,p){ const w={...ecW(pr,p.id)}, sp=ecqSpeed(), i=EC_NV.findIndex(x=>x[0]===sp), len=((document.getElementById("ecqLen")||{}).value||"").trim();
  delete w.ng; delete w.wmF; w.wm="ok"; w.wmap="12345678"; w.wmS=ecWmSchirmStd(pr);
  EC_NV.forEach(([k],j)=>{ if(j<=i) w[k]="ok"; else delete w[k]; }); if(len) w.len=len.replace(".",",");
  pr.werte=pr.werte||{}; pr.werte[p.id]=w; if(pr.status==="offen") pr.status="laeuft"; saveRec("echecks",pr); }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest('[data-act="ecq"],[data-act="ecqSp"]'); if(!b) return; e.stopImmediatePropagation(); e.preventDefault();
  const pr=ecPr(); if(!pr||pr.status==="fertig") return; const g=ecGeb(pr.ortId), L=ecqReihe(ecNetListe(pr,g)), p=L.find(x=>x.id===ECQ.id); if(!p) return;
  if(b.dataset.act==="ecqSp"){ try{ localStorage.setItem("ec-q-speed",b.dataset.v); }catch(x){} b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return; }
  const v=b.dataset.v, weiter=()=>{ const O=ecqOffen(pr,L), i=L.indexOf(p), n=L.slice(i+1).find(x=>O.includes(x))||O.find(x=>x!==p); ECQ.id=n?n.id:null; render();
    const k=document.getElementById("ecq"); if(k&&k.getBoundingClientRect().top<0) k.scrollIntoView({block:"start",behavior:"smooth"}); };
  if(v==="ok"){ ecqSpeichern(pr,p); if(typeof navHaptik==="function") navHaptik(); toast(`${p.nr||p.pp} bestanden`,"Rückgängig",()=>{ delete pr.werte[p.id]; saveRec("echecks",pr); ECQ.id=p.id; render(); }); weiter(); return; }
  if(v==="skip"){ weiter(); return; }
  ecNetMessDlg(p.id); if(v==="ng") setTimeout(()=>{ const n=document.querySelector('#dlg [data-act="ecNg"]'); if(n&&n.getAttribute("aria-pressed")!=="true") n.click(); },60); },true);
