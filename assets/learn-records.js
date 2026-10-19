// القسم العام: السجلات الرسمية الفارغة بأسماء طلاب المعلّم (طباعة مدفوعة رمزيًّا عبر CliQ) + الطلبات والتفعيل
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const OL = "#2f3c18", GD = "#a8771f";
  const REC = [
    ["sum", "السجل التجميعي", "التقويم الأول + الوحدات + التقويم الثاني + النهائي + المجموع والتقدير", "p"],
    ["det", "السجل التفصيلي", "كل نتاج عمود (صفحة لكل وحدة)", "l"],
    ["checklist", "قائمة الشطب", "إتقان نتاجات كل وحدة", "l"],
    ["evidence", "سجل القياس بالأدوات", "النتاج والأداة والتاريخ والمستوى — دليل المشرف", "l"],
    ["verbal", "سجل التقدير اللفظي والعددي", "وفق المادة (18) من أسس النجاح", "p"],
    ["marks", "كشف العلامات المختصر", "الأول والثاني والنهائي والمجموع", "p"],
    ["attendance", "كشف الحضور والغياب", "أيام الدوام لشهر تختاره", "l"],
    ["daily", "ورقة الرصد اليومي للحصة", "المشاركة والسلوك — ٢٠ عمودًا", "p"]
  ];
  const DAILY = ["إجابة صحيحة", "سؤال أو استفسار جيد", "مشاركة على اللوح", "حلّ الواجب أمام الصف", "ساعد زميلًا أو قاد مجموعة", "تطبيق محاسبي صحيح", "تفاعل ومتابعة طوال الحصة",
    "حديث جانبي", "لم يُحضر الكتاب", "لم يُحضر الدفتر أو الآلة الحاسبة", "لم يُنجز الواجب", "نوم في الحصة", "مشاغبة وإزعاج", "تأخّر عن الحصة", "استخدام الجوال", "خروج متكرر من الصف",
    "عدم احترام المعلم أو زميل", "غياب عن الحصة", "التزام ملحوظ أو تحسّن", "ساعد في تنظيم الصف"];
  const MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

  // ---------- بصمة الأسماء (لربط الدفع بشعبة واحدة دون حفظ الأسماء عندنا) ----------
  const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
  const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); };
  const hashes = (names) => names.map((n) => fnv(norm(n)));
  const parseNames = (t) => String(t || "").split(/\r?\n/).map((l) => l.split("\t").filter((c) => c.trim() && !/^\d+$/.test(c.trim())).join(" ").trim()).filter((l) => l.length >= 3).slice(0, 80);

  // ---------- الطلبات ----------
  const O = { list: [], at: 0 };
  async function loadOrders(vid, force) { if (force || Date.now() - O.at > 8000) { try { O.list = await U.rpcFetch("public_orders", { p_vid: vid }); O.at = Date.now(); } catch (e) {} } return O.list; }
  function recUnlocked(code, names) {
    const hs = hashes(names);
    return O.list.some((o) => o.kind === "records" && o.status === "active" && o.records.includes(code) && names.length <= o.n + 5 &&
      hs.filter((h) => o.hashes.includes(h)).length >= Math.ceil(names.length * 0.8));
  }
  const wlUnlocked = () => O.list.some((o) => o.kind === "wl" && o.status === "active");

  // نافذة الدفع: CliQ + رقم الطلب + واتساب + رمز التفعيل
  function buySheet(cfg) {   // cfg: {vid, me, kind, records, section, names, amount, label, onActive}
    const C = window.APP_CONFIG || {}, ph = String(C.CONTACT_PHONE || "").replace(/\D/g, ""), intl = ph.startsWith("0") ? "962" + ph.slice(1) : ph, alias = C.CLIQ || "sahm1990";
    const b = U.openSheet(`<h3>${ic("printer", "sm")} ${esc(cfg.label)}</h3>
      <div class="pay-hero"><div><span class="tiny">المبلغ</span><b class="num">${cfg.amount === 0.5 ? "½" : cfg.amount}</b><span>دينار</span></div>
        <div class="grow"><p>${cfg.kind === "wl" ? "اطبع اختبارك بترويستك الخاصة (اسمك ومدرستك والتاريخ)، دون اسم المنصة." : "اطبع السجلات بأسماء طلابك لشعبة «" + esc(cfg.section) + "» مرات غير محدودة حتى نهاية الفصل."}</p></div></div>
      <ol class="pay-steps"><li>حوّل المبلغ عبر <b>CliQ</b> إلى الاسم المستعار: <span class="alias" dir="ltr">${esc(alias)}</span> <button class="btn ghost sm" id="pyCp">نسخ</button></li>
        <li><label class="field" style="margin:4px 0 0"><span>اسم المحوِّل كما يظهر في التحويل</span><input class="input" id="pyN" maxlength="80" value="${esc((cfg.me && cfg.me.name) || "")}"></label></li>
        <li>اضغط «أرسلت المبلغ»، وسنفعّل لك الطباعة فور التأكد من وصول التحويل.</li></ol>
      <div class="row" style="margin-top:10px"><button class="btn primary grow" id="pyGo">${ic("check", "sm")}أرسلت المبلغ</button></div>
      <div id="pySt"></div>
      <details style="margin-top:12px"><summary class="tiny" style="cursor:pointer">لديك رمز تفعيل من المنصة؟</summary><div class="row" style="margin-top:8px"><input class="input mono" id="pyC" inputmode="numeric" maxlength="6" dir="ltr" placeholder="000000"><button class="btn outline" id="pyR">تفعيل</button></div></details>`);
    b.querySelector("#pyCp").onclick = () => { try { navigator.clipboard.writeText(alias); } catch (e) {} U.toast("نُسخ الاسم المستعار"); };
    let poll = null;
    const waitFor = (no, id) => {
      const msg = encodeURIComponent(`مرحبًا، طلب طباعة رقم ${no} على منصة السهم العلمي.\nحوّلت ${cfg.amount} دينار عبر CliQ باسم: ${b.querySelector("#pyN").value.trim()}\nالاسم: ${(cfg.me && cfg.me.name) || ""} — ${(cfg.me && cfg.me.school) || ""}`);
      b.querySelector("#pySt").innerHTML = `<div class="pay-wait"><b>طلبك رقم ${no} — بانتظار تأكيد التحويل</b><span class="tiny">تُفتح الطباعة هنا تلقائيًّا بعد التأكيد. لتسريعه أرسل صورة التحويل:</span>
        ${intl ? `<a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/${intl}?text=${msg}">${ic("chat", "sm")}أرسل صورة التحويل على واتساب</a>` : ""}</div>`;
      clearInterval(poll); poll = setInterval(async () => { if (!document.getElementById("pySt")) { clearInterval(poll); return; }
        await loadOrders(cfg.vid, true); const o = O.list.find((x) => x.id === id); if (o && o.status === "active") { clearInterval(poll); U.closeSheet(); U.toast("تم التفعيل — يمكنك الطباعة الآن"); cfg.onActive && cfg.onActive(); } }, 12000);
    };
    b.querySelector("#pyGo").onclick = async () => {
      const btn = b.querySelector("#pyGo"); U.spin(btn, true, "جارٍ الإرسال…");
      try { const r = await U.rpcFetch("public_order_create", { p_vid: cfg.vid, p_kind: cfg.kind, p_records: cfg.records || null, p_section: cfg.section || "", p_hashes: cfg.names ? hashes(cfg.names) : [], p_payer: b.querySelector("#pyN").value.trim() });
        if (!r.ok) throw new Error(r.error); btn.classList.add("hide"); await loadOrders(cfg.vid, true); waitFor(r.no, r.id); }
      catch (e) { U.spin(btn, false); U.toast(e.message, true); }
    };
    b.querySelector("#pyR").onclick = async () => {
      try { const r = await U.rpcFetch("public_order_redeem", { p_vid: cfg.vid, p_code: b.querySelector("#pyC").value.trim() }); if (!r.ok) throw new Error(r.error);
        await loadOrders(cfg.vid, true); U.closeSheet(); U.toast("تم التفعيل — يمكنك الطباعة الآن"); cfg.onActive && cfg.onActive(); }
      catch (e) { U.toast(e.message, true); }
    };
  }

  // ---------- بناء السجلات ----------
  function schoolDays(ym) { const [y, m] = ym.split("-").map(Number), out = []; const d = new Date(y, m - 1, 1);
    while (d.getMonth() === m - 1) { const w = d.getDay(); if (w !== 5 && w !== 6) out.push(d.getDate()); d.setDate(d.getDate() + 1); } return out; }
  function recordsHtml(kinds, ctx) {
    const idx = ctx.idx, names = ctx.names, rows = (cells) => names.map((n, i) => `<tr><td class="c">${i + 1}</td><td class="nm">${esc(n)}</td>${cells(i)}</tr>`).join("");
    const empty = (k, cls) => Array.from({ length: k }, () => `<td class="${cls || ""}"></td>`).join("");
    const head = (title, sub) => `<div class="rh"><div class="rs">${ctx.directorate ? "مديرية التربية والتعليم " + esc(ctx.directorate) + "<br>" : ""}${esc(ctx.school || "")}<br>المعلّم/ة: ${esc(ctx.teacher || "")}</div>
      <div class="rt"><h1>${esc(title)}</h1><span>${esc(sub || "")}</span></div><div class="rs l">المبحث: ${esc(idx.subject)}<br>الصف: ${esc(ctx.grade || "الثاني عشر")} — الشعبة: ${esc(ctx.section || "")}<br>${esc(ctx.term || "")}</div></div>`;
    const sign = `<div class="sg"><span>معلّم المبحث: ${esc(ctx.teacher || "")} ................</span><span>مدير المدرسة: ....................</span><span>المشرف التربوي: ....................</span></div>`;
    const vth = (t) => `<th class="vt"><div>${esc(t)}</div></th>`;
    const pages = [];
    kinds.forEach((k) => {
      if (k === "sum") pages.push(["p", head("السجل التجميعي", "سجل العلامات الجانبي") + `<table><thead><tr><th class="c">م</th><th>اسم الطالب</th><th>التقويم الأول<small>30</small></th>${idx.units.map((u) => `<th>الوحدة ${u.seq}</th>`).join("")}<th>التقويم الثاني<small>30</small></th><th>النهائي<small>40</small></th><th>المجموع<small>100</small></th><th>التقدير</th></tr></thead><tbody>${rows(() => empty(idx.units.length + 5))}</tbody></table>
        <p class="nt">التقويم الثاني = متوسط مستويات إتقان النتاجات المقيسة ÷ 4 × 30. التقدير وفق المادة (18) من أسس النجاح والرسوب.</p>` + sign]);
      if (k === "det" || k === "checklist") idx.units.forEach((u) => {
        const outs = idx.lessons.filter((l) => l.u === u.seq).flatMap((l) => l.outcomes.map((t, i) => ({ l: l.l, o: i + 1, t })));
        pages.push(["l", head(k === "det" ? "السجل التفصيلي — النتاجات" : "قائمة الشطب", "الوحدة " + u.seq + ": " + u.title) +
          `<table class="vtab"><thead><tr><th class="c">م</th><th>اسم الطالب</th>${outs.map((x) => vth("د" + x.l + "/ن" + x.o + ": " + x.t)).join("")}<th>${k === "det" ? "مجموع الوحدة" : "المتقن"}</th></tr></thead><tbody>${rows(() => empty(outs.length + 1, "sq"))}</tbody></table>
          <p class="nt">${k === "det" ? "اكتب في كل خلية مستوى الطالب (1–4) أو نصيب النتاج من علامة التقويم الثاني." : "المستويات: 1 مبتدئ · 2 نامٍ · 3 متمكّن · 4 متميّز. «المتقن» = عدد النتاجات بمستوى متمكّن فأعلى."}</p>` + sign]); });
      if (k === "evidence") pages.push(["l", head("سجل قياس النتاجات بأدوات التقويم", "دليل المشرف — المادة (4)-ب من أسس النجاح") + `<table><thead><tr><th class="c" rowspan="2">م</th><th rowspan="2">اسم الطالب</th>${[1, 2, 3].map((i) => `<th colspan="4">القياس ${i}</th>`).join("")}</tr><tr>${[1, 2, 3].map(() => "<th>النتاج</th><th>الأداة</th><th>التاريخ</th><th>المستوى</th>").join("")}</tr></thead><tbody>${rows(() => empty(12))}</tbody></table>` + sign]);
      if (k === "verbal") pages.push(["p", head("سجل التقدير اللفظي والعددي", "وفق المادة (18) من أسس النجاح والرسوب") + `<table><thead><tr><th class="c">م</th><th>اسم الطالب</th><th>علامة النتاجات<small>30</small></th><th>النسبة %</th><th>التقدير</th><th style="width:42%">التقدير اللفظي</th></tr></thead><tbody>${rows(() => empty(4))}</tbody></table>
        <p class="nt">ممتاز 90–100% · جيد جدًا 80–89.9% · جيد 70–79.9% · متوسط 60–69.9% · مقبول 50–59.9% · راسب أقل من 50%.</p>` + sign]);
      if (k === "marks") pages.push(["p", head("كشف العلامات المختصر", "") + `<table><thead><tr><th class="c">م</th><th>اسم الطالب</th><th>التقويم الأول<small>30</small></th><th>التقويم الثاني<small>30</small></th><th>النهائي<small>40</small></th><th>المجموع<small>100</small></th><th style="width:22%">ملاحظات</th></tr></thead><tbody>${rows(() => empty(5))}</tbody></table>` + sign]);
      if (k === "attendance") { const ym = ctx.month, days = schoolDays(ym), [y, m] = ym.split("-").map(Number);
        pages.push(["l", head("كشف الحضور والغياب", MONTHS[m - 1] + " " + y) + `<table class="vtab"><thead><tr><th class="c">م</th><th>اسم الطالب</th>${days.map((d) => `<th class="dy">${d}</th>`).join("")}<th>ح</th><th>غ</th><th>ت</th><th>ع</th></tr></thead><tbody>${rows(() => empty(days.length + 4, "sq"))}</tbody></table>
          <p class="nt">الرموز: ✓ حاضر · غ غائب · ت متأخر · ع غائب بعذر. أيام الدوام من الأحد إلى الخميس.</p>` + sign]); }
      if (k === "daily") pages.push(["p", head("ورقة الرصد اليومي للحصة", "التاريخ: ........  الحصة: ........") + `<table class="vtab"><thead><tr><th class="c">م</th><th>اسم الطالب</th>${DAILY.map(vth).join("")}</tr></thead><tbody>${rows(() => empty(DAILY.length, "sq"))}</tbody></table>
        <p class="nt">الأعمدة السبعة الأولى سلوكيات إيجابية، ثم سلوكيات تحتاج متابعة، وآخر عمودين للتحسّن والتنظيم. سجل تربوي لا يدخل في العلامة الرسمية.</p>`]);
    });
    return pages;
  }
  // كل سجل في صفحته: يصغّر محتوى الصفحة (zoom) حتى يتسع طولها، بحدّ أدنى مقروء ثم يُكمل في صفحة تالية
  function fitPages(w) {
    const mm = 96 / 25.4, d = w.document;
    d.querySelectorAll(".pg").forEach((pg) => {
      const pi = pg.querySelector(".pi"); if (!pi) return; const land = pg.classList.contains("l"), avail = (land ? 194 : 279) * mm * 0.97, pad = 2 * (land ? 7 : 8) * mm;
      let z = 1; pi.style.zoom = 1;
      for (let i = 0; i < 6; i++) { const h = pg.getBoundingClientRect().height - pad; if (h <= avail + 1) break; z = Math.max(0.62, Math.floor(z * (avail / h) * 100) / 100); pi.style.zoom = z; if (z === 0.62) break; }
    });
  }
  function printRecords(kinds, ctx, locked) {
    const w = window.open("", "_blank"); if (!w) { U.toast("اسمح للمتصفح بفتح نافذة جديدة للطباعة", true); return; }
    const pages = recordsHtml(kinds, ctx);
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>السجلات — ${esc(ctx.section || "")}</title>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Amiri:wght@700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"><style>
      @page{size:A4;margin:8mm;@bottom-center{content:"أُعدّ عبر منصة السهم العلمي للاختبارات الذكية وتقويم الأداء";font:7pt "IBM Plex Sans Arabic",sans-serif;color:#777}}
      @page land{size:A4 landscape;margin:7mm}
      *{box-sizing:border-box}body{margin:0;background:#e6e8de;font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;color:#141a0c;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .tb{position:sticky;top:0;z-index:9;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:${OL};color:#fff}
      .tb button{background:${GD};color:#fff;border:0;border-radius:10px;padding:9px 16px;font-weight:700;cursor:pointer}.tb .lk{background:#fff3d6;color:#5a3d00;border-radius:8px;padding:6px 10px;font-weight:700}
      .pg{background:#fff;margin:14px auto;padding:8mm;box-shadow:0 10px 30px -18px rgba(0,0,0,.4);width:210mm}.pg.l{width:297mm;padding:7mm}
      @media print{body{background:#fff}.tb{display:none}.pg,.pg.l{margin:0;padding:0;box-shadow:none;width:auto;break-after:page}.pg.l{page:land}.pg:last-child{break-after:auto}}
      ${locked ? "@media print{body *{display:none!important}body:after{content:'نسخة معاينة — اطلب الطباعة من المنصة';display:block;font:700 22px sans-serif;text-align:center;margin-top:40mm}}" : ""}
      .lockwm{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:50}.lockwm span{font:800 70px sans-serif;color:rgba(168,119,31,.22);transform:rotate(-26deg)}
      .rh{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;border-bottom:2.5px solid ${OL};padding-bottom:6px;margin-bottom:8px}
      .rs{font-size:11.5px;font-weight:600;line-height:1.7}.rs.l{text-align:left}.rt{text-align:center}.rt h1{font-family:Amiri,serif;font-size:23px;margin:0;color:${OL}}.rt span{font-size:12px;color:#7a5410;font-weight:700}
      table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #6e7660;padding:3px 5px;text-align:center}
      th{background:${OL};color:#fff;font-weight:600;line-height:1.3}th small{display:block;font-weight:400;opacity:.9}
      td.nm{text-align:right;white-space:nowrap;min-width:150px;font-weight:600}td.c{width:26px}tbody tr:nth-child(even) td{background:#f4f5ee}tbody td{height:21px}
      thead{display:table-header-group}tr{break-inside:avoid}
      .vtab th.vt{padding:4px 1px;vertical-align:bottom;width:24px}.vtab th.vt div{writing-mode:vertical-rl;transform:rotate(180deg);font-size:9.5px;font-weight:500;max-height:200px;white-space:normal;line-height:1.25;margin:0 auto}
      .vtab th.dy{width:22px;font-size:10px}td.sq{width:22px}
      .nt{font-size:10.5px;color:#333;margin:6px 0 0}.sg{display:flex;justify-content:space-around;margin-top:16px;font-family:Amiri,serif;font-weight:700;font-size:13.5px}
      </style></head><body><div class="tb"><span>${pages.length} صفحات · ${ctx.names.length} طالبًا</span>${locked ? `<span class="lk">${esc(locked)}</span>` : '<button onclick="window.print()">طباعة / حفظ PDF</button>'}</div>
      ${locked ? '<div class="lockwm"><span>نسخة معاينة</span></div>' : ""}${pages.map(([o, h]) => `<section class="pg ${o === "l" ? "l" : ""}"><div class="pi">${h}</div></section>`).join("")}</body></html>`);
    w.document.close();
    const fit = () => fitPages(w); fit();
    if (!locked) { let done = 0; const go = () => { if (done++) return; const f = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve(); f.then(() => { fit(); setTimeout(() => { w.focus(); w.print(); }, 450); }); };
      const lk = w.document.querySelector('link[href*="fonts.googleapis"]'); if (lk && lk.media !== "all") { lk.addEventListener("load", go); lk.addEventListener("error", go); setTimeout(go, 2500); } else go(); }
    return w;
  }

  window.LearnRecords = { REC, parseNames, hashes, loadOrders, recUnlocked, wlUnlocked, buySheet, printRecords, O };
})();
