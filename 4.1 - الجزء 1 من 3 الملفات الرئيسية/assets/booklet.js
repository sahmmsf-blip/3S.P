// «ملزمة الدرس»: عرض بصري لتلخيص الدرس (بطاقات، مخططات، خرائط ذهنية، مقارنات، جداول) على الشاشة وفي الطباعة A4
// البيانات من pub/g<الصف>/B<الرمز>.json — تبقى مقروءة عند الطباعة بالأبيض والأسود (حدود وأيقونات لا ألوان فقط)
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = window.ICON_PATHS || {};
  const svg = (n, s) => `<svg class="bk-i" width="${s || 20}" height="${s || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.spark || ""}</svg>`;
  const HUES = ["#3d5a1e", "#a8771f", "#1f6f6b", "#7a3b69", "#9a4a1c", "#2b5797"];
  const NOTE = { tip: ["spark", "فكرة"], remember: ["flag", "تذكّر"], warn: ["alert", "انتبه"], advice: ["chat", "نصيحة"], info: ["book", "معلومة"] };
  const ICONS = ["target", "layers", "bolt", "chart", "users", "key", "book", "award", "shield", "trend", "home", "flag"];

  const CSS = `
  .bk{--bk-ink:#151b0d;--bk-mut:#4b5240;--bk-line:#c9cfba;--bk-soft:#f6f4ec;color:var(--bk-ink);line-height:1.95}
  .bk *{box-sizing:border-box}
  .bk-i{flex:none;vertical-align:middle}
  .bk-hero{position:relative;overflow:hidden;border-radius:20px;padding:20px 22px;color:#fff;background:linear-gradient(120deg,#2f3c18,#4d6229 60%,#6d7f3c);margin-bottom:14px}
  .bk-hero:after{content:"";position:absolute;inset:auto -40px -60px auto;width:220px;height:220px;border-radius:50%;background:rgba(241,212,138,.18)}
  .bk-hero .k{display:inline-flex;gap:6px;align-items:center;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:2px 12px;font-size:12.5px}
  .bk-hero h2{font-size:clamp(22px,3.4vw,30px);margin:8px 0 6px;line-height:1.4}
  .bk-hero p{margin:0;opacity:.95;font-size:15px;max-width:720px}
  .bk-top{display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:14px}
  .bk-box{border:1.5px solid var(--bk-line);border-radius:16px;padding:12px 14px;background:#fff}
  .bk-box h4{display:flex;gap:8px;align-items:center;margin:0 0 6px;font-size:15px;color:#2f3c18}
  .bk-box ol{margin:0;padding-inline-start:20px}.bk-box li{margin:2px 0}
  .bk-pills{display:flex;flex-wrap:wrap;gap:6px}.bk-pills span{border:1.5px solid #a8771f;color:#5a3d00;background:#fbf5e6;border-radius:999px;padding:1px 12px;font-size:13px;font-weight:600}
  .bk-blk{position:relative;margin:0 0 14px;border-radius:18px;border:1.5px solid var(--bk-line);background:#fff;padding:14px 16px 14px;break-inside:avoid}
  .bk-blk>h3{display:flex;gap:10px;align-items:center;margin:0 0 10px;font-size:17px;line-height:1.5}
  .bk-blk>h3 .bk-ico{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:#fff;background:var(--h);flex:none}
  .bk-blk{border-inline-start:6px solid var(--h)}
  .bk-en{font:600 12px Arial,sans-serif;color:var(--h);border:1px solid var(--h);border-radius:999px;padding:0 8px;direction:ltr}
  .bk-txt{white-space:pre-wrap;font-size:15px}
  .bk-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
  .bk-list li{display:flex;gap:10px;align-items:flex-start;font-size:15px}
  .bk-list li:before{content:"";flex:none;width:10px;height:10px;margin-top:9px;border-radius:3px;background:var(--h);transform:rotate(45deg)}
  .bk-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
  .bk-card{border-radius:14px;border:1.5px solid var(--bk-line);padding:10px 12px;background:linear-gradient(180deg,color-mix(in srgb,var(--c) 10%,#fff),#fff 70%);border-top:4px solid var(--c)}
  .bk-card b{display:flex;gap:8px;align-items:center;color:var(--c);font-size:15px;margin-bottom:4px}
  .bk-card .bk-n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font:700 12px Arial,sans-serif;flex:none}
  .bk-card p{margin:0;font-size:14px;color:var(--bk-mut);white-space:pre-wrap}
  .bk-steps{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;counter-reset:st}
  .bk-step{flex:1 1 160px;position:relative;border-radius:14px;padding:10px 12px 10px;background:var(--bk-soft);border:1.5px solid var(--h);font-size:14px;counter-increment:st}
  .bk-step:before{content:counter(st);position:absolute;top:-11px;inset-inline-start:10px;width:24px;height:24px;border-radius:50%;background:var(--h);color:#fff;font:700 12px/24px Arial,sans-serif;text-align:center}
  .bk-step:not(:last-child):after{content:"";position:absolute;inset-inline-end:-9px;top:50%;width:10px;height:10px;border-top:2.5px solid var(--h);border-inline-end:2.5px solid var(--h);transform:translateY(-50%) rotate(-135deg)}
  html[dir=ltr] .bk-step:not(:last-child):after{transform:translateY(-50%) rotate(45deg)}
  .bk-step span{display:block;padding-top:6px;white-space:pre-wrap}
  .bk-cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}
  .bk-side{border-radius:14px;padding:10px 12px;border:1.5px solid var(--c);background:color-mix(in srgb,var(--c) 7%,#fff)}
  .bk-side h5{margin:0 0 6px;font-size:15.5px;color:var(--c);text-align:center;border-bottom:1.5px dashed var(--c);padding-bottom:4px}
  .bk-side ul{margin:0;padding-inline-start:18px;font-size:14px}.bk-side li{margin:3px 0}
  .bk-vs{align-self:center;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#2f3c18;color:#f1d48a;font:800 14px Arial,sans-serif}
  .bk-mind{display:grid;grid-template-columns:1fr auto 1fr;gap:8px 18px;align-items:center}
  .bk-mind .col{display:grid;gap:8px}
  .bk-mind .ctr{width:140px;min-height:140px;border-radius:50%;display:grid;place-items:center;text-align:center;padding:12px;background:radial-gradient(circle at 30% 30%,#6d7f3c,#2f3c18);color:#fff;font-weight:800;font-size:16px;box-shadow:0 0 0 6px #f1e4c4}
  .bk-mind .br{position:relative;border-radius:999px;padding:6px 14px;border:1.8px solid var(--c);background:#fff;font-size:14px;font-weight:600;text-align:center}
  .bk-mind .col.r .br:after,.bk-mind .col.l .br:after{content:"";position:absolute;top:50%;width:18px;border-top:1.8px dashed var(--c)}
  .bk-mind .col.r .br:after{inset-inline-end:-19px}.bk-mind .col.l .br:after{inset-inline-start:-19px}
  .bk-tbl{width:100%;border-collapse:separate;border-spacing:0;border:1.5px solid var(--h);border-radius:12px;overflow:hidden;font-size:14px}
  .bk-tbl th{background:var(--h);color:#fff;padding:7px 9px;text-align:right;font-weight:700}
  .bk-tbl td{padding:6px 9px;border-top:1px solid var(--bk-line);vertical-align:top;white-space:pre-wrap}
  .bk-tbl tr:nth-child(even) td{background:var(--bk-soft)}
  .bk-ex{background:repeating-linear-gradient(135deg,#fff,#fff 12px,#fbf7ec 12px,#fbf7ec 24px)}
  .bk-fx{text-align:center;font:700 17px "IBM Plex Sans Arabic",sans-serif;border:2px dashed var(--h);border-radius:12px;padding:10px;margin-bottom:8px;background:#fff}
  .bk-note{display:flex;gap:10px;align-items:flex-start;border-radius:14px;padding:10px 14px;margin:0 0 14px;border:1.8px dashed var(--h);background:color-mix(in srgb,var(--h) 7%,#fff);break-inside:avoid}
  .bk-note b{color:var(--h);white-space:nowrap}.bk-note .bk-txt{font-size:14.5px}
  .bk-qa{display:grid;gap:8px}.bk-qa details,.bk-qa .it{border:1.3px solid var(--bk-line);border-radius:12px;padding:8px 12px;background:var(--bk-soft)}
  .bk-qa summary{cursor:pointer;font-weight:700}.bk-qa .a{margin-top:6px;color:#2f3c18;white-space:pre-wrap}
  .bk-sum{border-radius:18px;padding:14px 16px;background:linear-gradient(120deg,#fbf5e6,#fff);border:2px solid #a8771f;margin-bottom:14px;break-inside:avoid}
  .bk-sum h3{margin:0 0 8px;color:#7a5410;display:flex;gap:8px;align-items:center}
  .bk-sum ol{margin:0;padding-inline-start:22px}.bk-sum li{margin:3px 0}
  .bk-terms{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
  .bk-term{border:1.3px solid var(--bk-line);border-radius:12px;padding:8px 12px;background:#fff}
  .bk-term b{color:#2f3c18}.bk-term .bk-en{--h:#7a5410;margin-inline-start:6px}.bk-term p{margin:3px 0 0;font-size:13.5px;color:var(--bk-mut)}
  @media (max-width:760px){.bk-top{grid-template-columns:1fr}.bk-cmp{grid-template-columns:1fr}.bk-vs{justify-self:center}.bk-mind{grid-template-columns:1fr}.bk-mind .ctr{justify-self:center;order:-1}.bk-mind .br:after{display:none}.bk-step:after{display:none}}
  `;
  (function inject() { if (document.getElementById("bk-css")) return; const st = document.createElement("style"); st.id = "bk-css"; st.textContent = CSS; document.head.appendChild(st); })();

  const head = (b, i, icon) => `<h3><span class="bk-ico">${svg(icon || ICONS[i % ICONS.length], 18)}</span><span>${esc(b.title || "")}</span>${b.en ? ` <span class="bk-en">${esc(b.en)}</span>` : ""}</h3>`;
  function block(b, i, printMode) {
    const h = HUES[i % HUES.length], st = `style="--h:${h}"`;
    switch (b.type) {
      case "concept": return `<section class="bk-blk" ${st}>${head(b, i, "spark")}<div class="bk-txt">${esc(b.text)}</div></section>`;
      case "list": return `<section class="bk-blk" ${st}>${head(b, i, "list")}<ul class="bk-list">${b.items.map((x) => `<li><span>${esc(x)}</span></li>`).join("")}</ul></section>`;
      case "cards": return `<section class="bk-blk" ${st}>${head(b, i, "grid")}<div class="bk-cards">${b.items.map((c, k) => `<div class="bk-card" style="--c:${HUES[(i + k + 1) % HUES.length]}"><b><span class="bk-n">${k + 1}</span>${esc(c.h)}</b><p>${esc(c.t)}</p></div>`).join("")}</div></section>`;
      case "steps": return `<section class="bk-blk" ${st}>${head(b, i, "trend")}<div class="bk-steps">${b.items.map((x) => `<div class="bk-step"><span>${esc(x)}</span></div>`).join("")}</div></section>`;
      case "compare": return `<section class="bk-blk" ${st}>${head(b, i, "layers")}<div class="bk-cmp"><div class="bk-side" style="--c:${HUES[0]}"><h5>${esc(b.a.h)}</h5><ul>${b.a.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="bk-vs">VS</div><div class="bk-side" style="--c:${HUES[1]}"><h5>${esc(b.b.h)}</h5><ul>${b.b.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></section>`;
      case "mind": { const it = b.items, half = Math.ceil(it.length / 2), br = (x, k) => `<div class="br" style="--c:${HUES[k % HUES.length]}">${esc(x)}</div>`;
        return `<section class="bk-blk" ${st}>${head(b, i, "target")}<div class="bk-mind"><div class="col r">${it.slice(0, half).map(br).join("")}</div><div class="ctr">${esc(b.center)}</div><div class="col l">${it.slice(half).map((x, k) => br(x, k + half)).join("")}</div></div></section>`; }
      case "table": return `<section class="bk-blk" ${st}>${head(b, i, "grid")}<div style="overflow:auto"><table class="bk-tbl"><thead><tr>${b.head.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
      case "example": return `<section class="bk-blk bk-ex" ${st}>${head(b, i, "chart")}<div class="bk-txt">${esc(b.text)}</div></section>`;
      case "formula": return `<section class="bk-blk" ${st}>${head(b, i, "bolt")}<div class="bk-fx">${esc(b.text)}</div>${b.example ? `<div class="bk-txt">${esc(b.example)}</div>` : ""}</section>`;
      case "note": { const [n, t] = NOTE[b.kind] || NOTE.info; return `<div class="bk-note" style="--h:${b.kind === "warn" ? "#9a4a1c" : b.kind === "advice" ? "#1f6f6b" : b.kind === "remember" ? "#7a3b69" : "#a8771f"}">${svg(n, 22)}<div><b>${t}:</b> <span class="bk-txt">${esc(b.text)}</span></div></div>`; }
      case "qa": return `<section class="bk-blk" ${st}>${head(b, i, "help")}<div class="bk-qa">${b.items.map((x) => printMode ? `<div class="it"><b>${esc(x.q)}</b><div class="a">${esc(x.a)}</div></div>` : `<details><summary>${esc(x.q)}</summary><div class="a">${esc(x.a)}</div></details>`).join("")}</div></section>`;
      default: return "";
    }
  }

  // d: {title, outcomes, concepts, terms, booklet}, meta: {grade, unit, lesson, unitTitle, pages}
  function render(d, meta, printMode) {
    const b = d.booklet || {};
    return `<article class="bk">
      <div class="bk-hero"><span class="k">${svg("book", 15)} ${esc(meta.gradeName || "")} · الوحدة ${meta.unit}${meta.unitTitle ? ": " + esc(meta.unitTitle) : ""} · الدرس ${meta.lesson}</span>
        <h2>${esc(d.title)}</h2>${b.hook ? `<p>${esc(b.hook)}</p>` : ""}</div>
      <div class="bk-top"><div class="bk-box"><h4>${svg("target", 18)} نتاجات التعلّم</h4><ol>${(d.outcomes || []).map((o) => `<li>${esc(o)}</li>`).join("")}</ol></div>
        <div class="bk-box"><h4>${svg("key", 18)} المفاهيم والمصطلحات الرئيسة</h4><div class="bk-pills">${(d.concepts || []).map((c) => `<span>${esc(c)}</span>`).join("")}</div></div></div>
      ${(b.blocks || []).map((x, i) => block(x, i, printMode)).join("")}
      ${b.summary && b.summary.length ? `<div class="bk-sum"><h3>${svg("award", 22)} أهم ما تعلّمته</h3><ol>${b.summary.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>` : ""}
      ${d.terms && d.terms.length ? `<section class="bk-blk" style="--h:#2f3c18"><h3><span class="bk-ico">${svg("book", 18)}</span><span>مسرد مصطلحات الدرس</span></h3><div class="bk-terms">${d.terms.map((t) => `<div class="bk-term"><b>${esc(t.t)}</b>${t.en ? `<span class="bk-en">${esc(t.en)}</span>` : ""}<p>${esc(t.d)}</p></div>`).join("")}</div></section>` : ""}
      ${b.check && b.check.length ? `<section class="bk-blk" style="--h:#7a3b69"><h3><span class="bk-ico">${svg("check", 18)}</span><span>أختبر نفسي</span></h3><div class="bk-qa">${b.check.map((x, k) => printMode ? `<div class="it"><b>${k + 1}. ${esc(x.q)}</b><div class="a" style="border-top:1px dotted #999;margin-top:18px;min-height:20px"></div></div>` : `<details><summary>${k + 1}. ${esc(x.q)}</summary><div class="a">${esc(x.a)}</div></details>`).join("")}</div></section>` : ""}
    </article>`;
  }

  // طباعة ملزمة كاملة (غلاف + فهرس + الدروس + إجابات «أختبر نفسي») — locked: معاينة بعلامة مائية دون طباعة
  function print(items, ctx, locked) {
    const w = window.open("", "_blank"); if (!w) { window.U && U.toast("اسمح للمتصفح بفتح نافذة جديدة للطباعة", true); return null; }
    const PLATFORM = "منصة السهم العلمي", logo = window.PrintPro ? PrintPro.logo : () => "";
    const cover = `<section class="pg cover"><div class="cv">${logo(90, "#ffffff", "#2f3c18", "#a8771f")}<div class="pl">${PLATFORM}<span>للاختبارات الذكية وتقويم الأداء</span></div>
      <h1>ملزمة ${esc(ctx.subject || "الثقافة المالية")}</h1><h2>${esc(ctx.gradeName)} — ${esc(ctx.term || "الفصل الدراسي الأول")}</h2>
      <div class="cvl">تلخيص كامل للدروس بالمخططات والخرائط الذهنية والأمثلة · النتاجات والمفاهيم · مسرد المصطلحات · أختبر نفسي</div>
      ${ctx.owner ? `<div class="ow">هذه النسخة لـ: <b>${esc(ctx.owner)}</b></div>` : ""}</div></section>`;
    const toc = `<section class="pg"><h2 class="th">${svg("list", 22)} فهرس الملزمة</h2><table class="toc">${items.map((x, i) => `<tr><td>${i + 1}</td><td>الوحدة ${x.meta.unit} · الدرس ${x.meta.lesson}</td><td><b>${esc(x.d.title)}</b></td></tr>`).join("")}</table></section>`;
    const lessons = items.map((x) => `<section class="pg">${render(x.d, x.meta, true)}</section>`).join("");
    const answers = `<section class="pg"><h2 class="th">${svg("check", 22)} إجابات «أختبر نفسي»</h2>${items.map((x) => `<div class="ans"><b>${esc(x.d.title)}</b><ol>${((x.d.booklet || {}).check || []).map((c) => `<li>${esc(c.a)}</li>`).join("")}</ol></div>`).join("")}</section>`;
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ملزمة ${esc(ctx.gradeName)} — ${PLATFORM}</title>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&family=Amiri:wght@700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
      <style>@page{size:A4;margin:10mm 10mm 13mm;@bottom-center{content:"© ${PLATFORM} للاختبارات الذكية وتقويم الأداء — يُمنع النسخ لغير الاستخدام الشخصي";font:7.5pt "IBM Plex Sans Arabic",sans-serif;color:#666}@bottom-left{content:counter(page);font:8pt Arial,sans-serif;color:#666}}
      body{margin:0;background:#e6e8de;font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:14px}
      .tb{position:sticky;top:0;z-index:9;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#2f3c18;color:#fff}
      .tb button{background:#a8771f;color:#fff;border:0;border-radius:10px;padding:9px 16px;font-weight:700;cursor:pointer}.tb .lk{background:#fff3d6;color:#5a3d00;border-radius:8px;padding:6px 10px;font-weight:700}
      .pg{background:#fff;width:210mm;min-height:297mm;margin:14px auto;padding:10mm;box-shadow:0 10px 30px -18px rgba(0,0,0,.4)}
      .cover{display:grid;place-items:center;text-align:center;background:linear-gradient(160deg,#2f3c18,#4d6229 55%,#6d7f3c);color:#fff}
      .cv h1{font:700 44px Amiri,serif;margin:26px 0 6px}.cv h2{font-size:22px;margin:0 0 18px;color:#f1d48a}.cv .pl{font-size:20px;font-weight:800;margin-top:10px}.cv .pl span{display:block;font-size:13px;opacity:.85;font-weight:500}
      .cvl{max-width:140mm;margin:0 auto;line-height:2;opacity:.95}.ow{margin-top:26px;border:1.5px solid #f1d48a;border-radius:999px;padding:6px 18px;display:inline-block}
      .th{display:flex;gap:10px;align-items:center;color:#2f3c18;font-size:22px}.toc{width:100%;border-collapse:collapse;font-size:15px}.toc td{padding:8px;border-bottom:1px dotted #999}.toc td:first-child{width:30px;font:700 14px Arial}
      .ans{margin-bottom:10px}.ans ol{margin:4px 0;padding-inline-start:22px;line-height:1.9}
      ${CSS}
      @media print{body{background:#fff}.tb{display:none}.pg{width:auto;min-height:0;margin:0;padding:0;box-shadow:none;break-after:page}.pg:last-child{break-after:auto}.cover{min-height:270mm;border-radius:0}
        .bk{zoom:.84}.bk-blk{break-inside:auto}.bk-blk>h3{break-after:avoid}.bk-card,.bk-step,.bk-side,.bk-note,.bk-sum,.bk-term,.bk-qa .it,.bk-tbl tr,.bk-mind,.bk-top,.bk-hero{break-inside:avoid}}
      .lockwm{position:fixed;inset:0;pointer-events:none;z-index:50;display:grid;place-items:center}.lockwm span{font:800 64px sans-serif;color:rgba(168,119,31,.22);transform:rotate(-28deg)}
      ${locked ? "@media print{body *{display:none!important}body:after{content:'نسخة معاينة — اطلب طباعة الملزمة من المنصة';display:block;font:700 22px sans-serif;text-align:center;margin-top:40mm}}" : ""}</style></head><body>
      <div class="tb"><span>ملزمة ${esc(ctx.gradeName)} — ${items.length} ${items.length > 10 ? "درسًا" : "دروس"}</span>${locked ? `<span class="lk">${esc(locked)}</span>` : '<button onclick="window.print()">طباعة / حفظ PDF</button>'}</div>
      ${locked ? '<div class="lockwm"><span>نسخة معاينة</span></div>' : ""}${cover}${toc}${lessons}${answers}</body></html>`);
    w.document.close();
    if (!locked) { let done = 0; const go = () => { if (done++) return; setTimeout(() => { w.focus(); w.print(); }, 600); };
      const lk = w.document.querySelector('link[href*="fonts.googleapis"]'); if (lk && lk.media !== "all") { lk.addEventListener("load", go); lk.addEventListener("error", go); setTimeout(go, 2500); } else go(); }
    return w;
  }
  window.Booklet = { render, print, CSS };
})();
