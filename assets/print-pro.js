// تصميم الطباعة الاحترافي لأوراق العمل والاختبارات (A4) — بهوية «منصة السهم العلمي» أو بترويسة المعلّم الخاصة
// • ترتيب ذكي للبدائل: ٤ في سطر إن اتسعت، أو ٢×٢، أو تحت بعضها للطويلة والقيود
// • ورقة العمل لا تتجاوز صفحتين (تصغير تلقائي متدرّج)، والاختبار تزيد صفحاته حسب عدد الأسئلة
// • ألوان تبقى واضحة عند الطباعة بالأبيض والأسود
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const AR = ["أ", "ب", "ج", "د"];
  const PLATFORM = "منصة السهم العلمي", PLATFORM2 = "للاختبارات الذكية وتقويم الأداء";
  const OL = "#2f3c18", OL2 = "#4d6229", GD = "#a8771f", GD2 = "#f1e4c4", INK = "#141a0c";
  const logo = (s, bg, fg, dot) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="${bg}"/>
    <circle cx="20" cy="28" r="11" fill="none" stroke="${fg}" stroke-width="2.4" opacity=".55"/><circle cx="20" cy="28" r="5.5" fill="none" stroke="${fg}" stroke-width="2.4" opacity=".85"/>
    <circle cx="20" cy="28" r="2.6" fill="${dot}"/><path d="M20 28 36.5 11.5" stroke="${fg}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <path d="M28.5 10.5h9v9" stroke="${fg}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  const DIFF = { "سهل": 1, "متوسط": 2, "صعب": 3 };

  function css(o) {
    const brand = !o.wl;
    const foot = brand ? `@bottom-center{content:"© ${PLATFORM} ${PLATFORM2} — جميع الحقوق محفوظة";font-family:"IBM Plex Sans Arabic",sans-serif;font-size:7.5pt;color:#555}` : "";
    return `@page{size:A4;margin:8mm 9mm 12mm;${foot}@bottom-left{content:counter(page) " / " counter(pages);font-family:"IBM Plex Sans Arabic",sans-serif;font-size:8pt;color:#555}}
    *{box-sizing:border-box}:root{--s:1}
    html,body{margin:0;background:#e6e8de}body{font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;color:${INK};font-size:calc(12.2px*var(--s));-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .tb{position:sticky;top:0;z-index:9;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 16px;background:${OL};color:#fff;font-size:14px}
    .tb button{background:${GD};color:#fff;border:0;border-radius:10px;padding:9px 16px;font:700 14px "IBM Plex Sans Arabic",sans-serif;cursor:pointer}
    .tb .lk{background:#fff3d6;color:#5a3d00;border-radius:8px;padding:6px 10px;font-weight:700}
    .sheet{width:210mm;min-height:297mm;margin:14px auto;background:#fff;padding:8mm 9mm 14mm;position:relative;box-shadow:0 10px 40px -18px rgba(0,0,0,.35);overflow:hidden}
    @media print{html,body{background:#fff}.tb{display:none}.sheet{width:auto;min-height:0;margin:0;padding:0;box-shadow:none;overflow:visible}.sheet+.sheet{break-before:page}}
    .wm{position:absolute;left:0;right:0;top:85mm;display:grid;place-items:center;pointer-events:none;opacity:.055;z-index:0}.wm svg{width:105mm;height:105mm}
    @media print{.wm{position:fixed;top:70mm}}
    .lockwm{position:fixed;inset:0;pointer-events:none;z-index:50;display:grid;place-items:center}
    .lockwm span{font:800 64px "IBM Plex Sans Arabic",sans-serif;color:rgba(168,119,31,.22);transform:rotate(-28deg);white-space:nowrap}
    ${o.locked ? "@media print{body *{display:none!important}body:after{content:'هذه نسخة معاينة — اطلب الطباعة من المنصة';display:block;font:700 22px sans-serif;text-align:center;margin-top:40mm}}" : ""}
    .in{position:relative;z-index:1}
    /* ترويسة المنصة */
    .band{display:flex;align-items:center;gap:10px;padding:calc(9px*var(--s)) 14px;border-radius:14px;color:#fff;background:linear-gradient(115deg,${OL} 0%,${OL2} 70%,#64773a 100%);border:1.5px solid ${OL}}
    .band .bn b{display:block;font-size:14px}.band .bn span{font-size:10px;opacity:.9}
    .band .sp{flex:1}.band .tag{background:#fff;color:${OL};border:2px solid ${GD};font-weight:800;font-size:12px;padding:3px 12px;border-radius:999px;white-space:nowrap}
    .band .meta{text-align:left;font-size:10px;line-height:1.55}
    .title{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:calc(9px*var(--s)) 2px 6px}
    .title h1{font-family:Amiri,serif;font-size:calc(24px*var(--s));line-height:1.15;margin:0;color:${OL}}.title h2{margin:2px 0 0;font-size:11.5px;font-weight:600;color:#3d452c}
    .title .sc{font-size:10.5px;color:#444;text-align:left;line-height:1.55}
    .rule{height:3px;border-radius:3px;background:linear-gradient(90deg,${GD},${GD2} 70%,transparent);margin:0 0 8px}
    .info{display:grid;grid-template-columns:2.3fr 1.2fr 1fr 1fr;gap:6px;margin-bottom:8px}
    .info div{border:1.3px solid #9aa386;border-radius:9px;padding:4px 8px calc(12px*var(--s));font-size:10px;color:#333}
    .info b{color:${OL}}.info .mk{border:2px solid ${GD}}
    .note{background:#faf6ea;border:1.3px dashed ${GD};border-radius:9px;padding:5px 10px;font-size:10.5px;line-height:1.7;margin-bottom:8px;color:#3b331c}
    /* ترويسة المعلّم الخاصة (بلا اسم المنصة) */
    .wl{border:2.5px double ${OL};border-radius:10px;padding:8px 12px;display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:10px;align-items:center}
    .wl .r{font-size:11.5px;line-height:1.75;font-weight:600}.wl .c{text-align:center}.wl .c h1{font-family:Amiri,serif;font-size:26px;margin:0;color:${OL}}
    .wl .c .sb{display:inline-block;margin-top:4px;border:1.5px solid ${GD};border-radius:999px;padding:1px 12px;font-size:11.5px;font-weight:700}
    .wl .l{font-size:11px;line-height:1.85}.wl .l b{display:inline-block;min-width:78px;color:${OL}}
    .wl-st{display:flex;gap:10px;margin:8px 0;font-size:11.5px}.wl-st span{flex:1;border-bottom:1.3px dotted #444;padding-bottom:3px}.wl-st span.s{flex:.6}
    .end{margin-top:10px;display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:${OL};border-top:1.5px solid ${OL};padding-top:6px}
    /* الأسئلة */
    .q{break-inside:avoid;display:grid;grid-template-columns:auto 1fr;gap:calc(2px*var(--s)) 9px;padding:calc(6px*var(--s)) 9px calc(6px*var(--s));margin:0 0 calc(5px*var(--s));border-radius:10px;border:1.2px solid #c9cfba;position:relative}
    .q .n{width:calc(24px*var(--s));height:calc(24px*var(--s));border-radius:8px;display:grid;place-items:center;background:${OL};color:#fff;font:700 calc(12.5px*var(--s)) Arial,"IBM Plex Sans Arabic",sans-serif;grid-row:span 2;border-bottom:3px solid ${GD};direction:ltr}
    .q .s{white-space:pre-wrap;line-height:1.75;font-weight:600}
    .q .oc{position:absolute;top:4px;left:7px;font-size:9px;color:#555;border:1px solid #bbb;border-radius:999px;padding:0 6px;background:#fff}
    .o{display:grid;gap:calc(2px*var(--s)) 12px}.o.o4{grid-template-columns:repeat(4,1fr)}.o.o2{grid-template-columns:1fr 1fr}.o.o1{grid-template-columns:1fr}
    .o>div{display:flex;gap:6px;align-items:flex-start;min-width:0}
    .o span{white-space:pre-wrap;line-height:1.6;min-width:0}
    .o i{flex:none;font-style:normal;width:calc(18px*var(--s));height:calc(18px*var(--s));border-radius:50%;border:1.5px solid ${OL};color:${OL};display:grid;place-items:center;font-size:calc(10px*var(--s));font-weight:800;margin-top:2px}
    .foot{position:absolute;left:9mm;right:9mm;bottom:5mm;display:flex;align-items:center;gap:8px;font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:4px}
    .foot .sp{flex:1}@media print{.foot{display:none}}
    .fitinfo{font-size:11px;opacity:.9}
    /* المفتاح */
    .kgrid{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin:6px 0 10px}
    .kgrid div{border:1.3px solid #9aa386;border-radius:9px;text-align:center;padding:3px 0 4px;font:10px Arial,sans-serif;color:#333}
    .kgrid b{display:block;margin:2px auto 0;width:21px;height:21px;border-radius:50%;background:${OL};color:#fff;line-height:21px;font:700 12px "IBM Plex Sans Arabic",sans-serif}
    table{width:100%;border-collapse:separate;border-spacing:0;font-size:10.5px;border:1.2px solid #9aa386;border-radius:10px;overflow:hidden;margin-bottom:10px}
    th{background:${OL};color:#fff;font-weight:600;padding:5px 7px;text-align:right}td{padding:4px 7px;border-top:1px solid #d5d9c8;vertical-align:top;line-height:1.65}
    td.c{text-align:center;white-space:nowrap}td.num{font-family:Arial,sans-serif;direction:ltr}.dots{letter-spacing:2px;color:${GD}}
    h3.sec{font-family:Amiri,serif;font-size:17px;color:${OL};margin:6px 0 4px;display:flex;align-items:center;gap:8px}h3.sec:before{content:"";width:5px;height:16px;border-radius:3px;background:${GD}}`;
  }

  // يرتّب البدائل ويصغّر الورقة حتى تتسع (يُشغَّل داخل نافذة الطباعة)
  function fitScript(maxPages) {
    return `<script>(function(){
      const PAGE=275*96/25.4, MAX=${maxPages || 0};
      function layout(){document.querySelectorAll('.o').forEach(function(o){
        const kids=[].slice.call(o.children), lines=kids.map(function(k){return (k.dataset.l|0)||1;});
        const fits=function(){return kids.every(function(k,i){const sp=k.querySelector('span'),lh=parseFloat(getComputedStyle(sp).lineHeight)||16;return sp.scrollWidth<=sp.clientWidth+1&&sp.offsetHeight<=lines[i]*lh+2;});};
        const tryC=function(c){o.classList.remove('o4','o2','o1');o.classList.add(c);return fits();};
        if(!tryC('o4')&&!tryC('o2'))tryC('o1');});}
      function pages(){const s=document.querySelector('.sheet.stu .in');return s?s.scrollHeight/PAGE:0;}
      function fit(){const r=document.documentElement;let s=1;r.style.setProperty('--s',s);layout();
        if(MAX){while(pages()>MAX*0.94&&s>0.7){s=Math.round((s-0.04)*100)/100;r.style.setProperty('--s',s);layout();}}
        const n=Math.ceil(pages()*1.03);const el=document.getElementById('fitInfo');if(el)el.textContent='صفحات الطالب: '+Math.max(1,n)+(MAX&&n>MAX?' (كثيرة الأسئلة — قلّل العدد لتبقى صفحتين)':'');}
      window.__fit=fit;
      var printed=0;function go(){fit();window.__fitDone=true;if(window.__autoPrint&&!printed){printed=1;setTimeout(function(){window.focus();window.print();},350);}}function ready(){(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(go);}if(window.__gfOK)ready();else{window.__gfl=ready;setTimeout(function(){if(!window.__fitDone)go();},2500);}
    })();<\/script>`;
  }

  // q: [{s, opts, c, e, d, oc:"د٢/ن٣", ot:"نص النتاج", lesson}]
  // o.wl: {directorate, school, teacher, exam, date, duration, marks, grade, section, term} → ترويسة المعلّم الخاصة بلا اسم المنصة
  function printPro(o) {
    const w = window.open("", "_blank");
    if (!w) { (window.U && U.toast) ? U.toast("اسمح للمتصفح بفتح نافذة جديدة للطباعة", true) : alert("اسمح بالنوافذ المنبثقة"); return null; }
    const test = o.kind === "test", qs = o.questions, n = qs.length, site = o.site || location.host || "", wl = o.wl;
    const kindName = test ? "اختبار" : "ورقة عمل";
    const lines = (t) => String(t).split("\n").length;
    const band = (tag) => `<div class="band">${logo(38, "#ffffff", OL, GD)}<div class="bn"><b>${PLATFORM}</b><span>${PLATFORM2}</span></div><div class="sp"></div>
      <div class="meta">${esc(o.subject || "")}<br>${esc(o.grade || "")}</div><span class="tag">${tag}</span></div>`;
    const wlHead = (k) => `<div class="wl"><div class="r">المملكة الأردنية الهاشمية<br>وزارة التربية والتعليم<br>${wl.directorate ? "مديرية التربية والتعليم " + esc(wl.directorate) + "<br>" : ""}${esc(wl.school || "")}</div>
      <div class="c"><h1>${esc(wl.exam || o.title)}${k ? "" : ""}</h1><span class="sb">${k ? "نموذج الإجابة" : "مبحث " + esc(o.subject || "")}</span></div>
      <div class="l"><b>الصف:</b> ${esc(wl.grade || o.grade || "")}<br><b>التاريخ:</b> ${esc(wl.date || "")}<br><b>مدة الاختبار:</b> ${esc(wl.duration ? wl.duration + " دقيقة" : "")}<br><b>العلامة الكلية:</b> ${esc(wl.marks || n)}${wl.term ? "<br><b>الفصل:</b> " + esc(wl.term) : ""}</div></div>
      ${k ? "" : `<div class="wl-st"><span>اسم الطالب:</span><span class="s">الشعبة: ${esc(wl.section || "")}</span><span class="s">العلامة: &nbsp;&nbsp;&nbsp;/ ${esc(wl.marks || n)}</span></div>`}`;
    const foot = wl ? "" : `<div class="foot">${logo(15, OL, "#fff", GD)}<span>© ${PLATFORM} ${PLATFORM2} — جميع الحقوق محفوظة</span><span class="sp"></span><span dir="ltr">${esc(site)}</span></div>`;
    const wm = wl ? "" : `<div class="wm">${logo(400, "none", OL, GD)}</div>`;
    const title = (sub) => `<div class="title"><div><h1>${esc(o.title)}</h1><h2>${esc(sub || o.subtitle || "")}</h2></div>
      <div class="sc">${o.school ? esc(o.school) + "<br>" : ""}${o.teacher ? "المعلّم/ة: " + esc(o.teacher) : ""}</div></div><div class="rule"></div>`;
    const info = `<div class="info"><div><b>اسم الطالب:</b></div><div><b>الصف/الشعبة:</b></div><div><b>التاريخ:</b></div>
      <div class="${test ? "mk" : ""}"><b>${test ? "العلامة:" : "عدد الأسئلة:"}</b> ${test ? "&nbsp;&nbsp;&nbsp; / " + (o.marks || n) : n}</div></div>`;
    const note = (test || o.instructions) ? `<div class="note"><b>تعليمات:</b> ${esc(o.instructions || ("أجب عن جميع الأسئلة الآتية وعددها (" + n + ")، بوضع دائرة حول رمز الإجابة الصحيحة." + ((wl ? wl.duration : o.duration) ? " مدة الاختبار: " + (wl ? wl.duration : o.duration) + " دقيقة." : "")))}</div>` : "";
    const qh = qs.map((x, i) => `<div class="q"><span class="n">${i + 1}</span><div class="s">${esc(x.s)}</div>${o.showOutcome ? `<span class="oc">${esc(x.oc || "")}</span>` : ""}
      <div class="o o4">${x.opts.map((t, j) => `<div data-l="${lines(t)}"><i>${AR[j]}</i><span>${esc(t)}</span></div>`).join("")}</div></div>`).join("");
    const byOc = {}; qs.forEach((x, i) => { const k = (x.oc || "—") + "|" + (x.ot || ""); (byOc[k] = byOc[k] || []).push(i + 1); });
    const spec = Object.entries(byOc).map(([k, v]) => { const [oc, ot] = k.split("|"); return `<tr><td class="c"><b>${esc(oc)}</b></td><td>${esc(ot)}</td><td class="c num">${v.join(", ")}</td><td class="c num">${v.length}</td></tr>`; }).join("");
    const keyGrid = `<div class="kgrid">${qs.map((x, i) => `<div>${i + 1}<b>${AR[x.c]}</b></div>`).join("")}</div>`;
    const keyTbl = `<table><thead><tr><th style="width:32px">#</th><th style="width:44px">الإجابة</th><th style="width:66px">النتاج</th><th style="width:58px">الصعوبة</th>${o.withExplain ? "<th>الشرح</th>" : "<th>الدرس</th>"}</tr></thead><tbody>` +
      qs.map((x, i) => `<tr><td class="c num">${i + 1}</td><td class="c"><b>${AR[x.c]}</b></td><td class="c">${esc(x.oc || "")}</td><td class="c"><span class="dots">${"●".repeat(DIFF[x.d] || 1)}${"○".repeat(3 - (DIFF[x.d] || 1))}</span></td>${o.withExplain ? `<td>${esc(x.e || "")}</td>` : `<td>${esc(x.lesson || "")}</td>`}</tr>`).join("") + "</tbody></table>";
    const head1 = wl ? wlHead(false) : band(kindName) + title() + info;
    const head2 = wl ? wlHead(true) : band("مفتاح الإجابة — للمعلّم") + title("مفتاح الإجابة وجدول المواصفات");
    const endLine = wl ? `<div class="end"><span>انتهت الأسئلة — مع تمنياتي لكم بالتوفيق</span><span>معلّم/ة المبحث: ${esc(wl.teacher || "")}</span></div>` : "";
    const maxPages = test ? 0 : 2;
    const lockBar = o.locked ? `<span class="lk">${esc(o.locked)}</span>` : `<button onclick="window.print()">طباعة / حفظ PDF</button>`;
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${esc(wl ? (wl.exam || o.title) : o.title + " — " + PLATFORM)}</title><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Amiri:wght@700&display=swap" rel="stylesheet" media="print" onload="this.media='all';window.__gfOK=1;window.__gfl&&window.__gfl()"><style>${css(o)}</style></head><body>
      <div class="tb"><span>${esc(kindName)} — ${n} سؤالًا · A4 <span class="fitinfo" id="fitInfo"></span></span>${lockBar}</div>
      ${o.locked ? '<div class="lockwm"><span>نسخة معاينة</span></div>' : ""}
      <section class="sheet stu">${wm}<div class="in">${head1}${note}<div class="qs">${qh}</div>${endLine}</div>${foot}</section>
      <section class="sheet">${wm}<div class="in">${head2}
        <h3 class="sec">الإجابات</h3>${keyGrid}<h3 class="sec">تفصيل الأسئلة</h3>${keyTbl}
        <h3 class="sec">ربط الأسئلة بالنتاجات</h3><table><thead><tr><th style="width:66px">النتاج</th><th>نص النتاج</th><th style="width:110px">أرقام الأسئلة</th><th style="width:44px">العدد</th></tr></thead><tbody>${spec}</tbody></table>
      </div>${foot}</section>${fitScript(maxPages)}<script>window.__autoPrint=${o.autoPrint !== false && !o.locked};<\/script></body></html>`;
    w.document.write(html); w.document.close();
    return w;
  }
  window.PrintPro = { printPro, logo };
})();
