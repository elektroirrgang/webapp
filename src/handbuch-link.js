/* Verweis aufs Betriebshandbuch – in allen Apps; öffnet die Übersicht direkt beim Artikel (#hb=<id>) */
const hbLink=(id,titel)=>`<a class="hb-link" href="../uebersicht/#hb=${encodeURIComponent(id)}">${icon("book")}<span>Betriebshandbuch<small>${esc(titel)}</small></span></a>`;
