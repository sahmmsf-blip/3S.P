// القسم العام «تعلّم مجانًا»: لكل طلاب المملكة ومعلميها — تسجيل خفيف، تشخيص ذكي، تدريب بشرح، فيديوهات، أوراق عمل للطباعة.
// البنك العام ملفات ثابتة (pub/*.json) منفصلة تمامًا عن بنك المعلّم، والتقدّم يُحفظ على جهاز الزائر فقط.
(function () {
  const { $, esc, L, toast, openSheet, closeSheet, rpcFetch, initSkin, skinPicker, spin, firstName } = U;
  const PLATFORM = "منصة السهم العلمي للاختبارات الذكية وتقويم الأداء";
  initSkin("learn", "olive");
  $("lnYr").textContent = new Date().getFullYear();
  $("lnSkin").onclick = skinPicker;

  // ---------- تخزين محلي آمن ----------
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const rid = () => { const a = new Uint8Array(18); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256)); return "v" + Array.from(a, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join(""); };
  let VID = ls.get("sahm_pub_vid", null); if (!VID) { VID = rid(); ls.set("sahm_pub_vid", VID); }
  let ME = ls.get("sahm_pub_me", null);
  const P = ls.get("sahm_pub_prog", { q: {}, days: [], diag: {} });
  const save = () => ls.set("sahm_pub_prog", P);
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const ping = (kind, n) => rpcFetch("public_ping", { p_vid: VID, p_kind: kind, p_n: n || 1 }).catch(() => {});

  // ---------- البيانات ----------
  const D = { idx: null, bank: {}, res: null };
  const lessonOf = (code) => D.idx.lessons.find((l) => l.code === code);
  async function loadIdx() { if (!D.idx) D.idx = await (await fetch("pub/index.json?v=1", { cache: "no-cache" })).json(); return D.idx; }
  async function bank(code) { if (!D.bank[code]) D.bank[code] = await (await fetch("pub/" + code + ".json?v=1")).json(); return D.bank[code]; }
  async function res() { if (!D.res) { try { D.res = await rpcFetch("public_lessons", {}); } catch (e) { D.res = []; } } return D.res; }
  const resOf = (l) => (D.res || []).find((r) => r.u === l.u && r.l === l.l) || {};
  const ytId = (u) => { const m = String(u || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/); return m ? m[1] : null; };

  // ---------- التقدّم المحلي ----------
  const qs = (id) => P.q[id] || (P.q[id] = { n: 0, ok: 0, w: 0, fix: 0, last: 0 });
  function record(id, good) {
    const s = qs(id); s.n++; if (good) { s.ok++; if (s.w) s.fix++; } else { s.w = Date.now(); s.fix = 0; } s.last = Date.now();
    const d = today(); if (!P.days.includes(d)) P.days.push(d); P.days = P.days.slice(-120); save();
  }
  const isMistake = (id) => { const s = P.q[id]; return s && s.w && s.fix < 2; };
  function streak() { const set = new Set(P.days); let n = 0, d = new Date(); if (!set.has(today())) d.setDate(d.getDate() - 1);
    for (;;) { const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (!set.has(k)) break; n++; d.setDate(d.getDate() - 1); } return n; }
  function lessonStat(code) { let n = 0, ok = 0, mk = 0; Object.keys(P.q).forEach((id) => { if (id.startsWith(code + "-")) { n += P.q[id].n; ok += P.q[id].ok; if (isMistake(id)) mk++; } }); return { n, ok, acc: n ? Math.round((ok / n) * 100) : null, mk }; }
  const mistakesAll = () => Object.keys(P.q).filter(isMistake);

  // ---------- مساعدات العرض ----------
  const crumb = (t, s) => `<div class="crumb"><button class="iconbtn" data-go="" aria-label="الرئيسية">${ic("right")}</button><div><h2>${t}</h2>${s ? `<div class="tiny">${s}</div>` : ""}</div></div>`;
  const nf = (v) => (v == null ? "—" : String(v));
  function wire() {
    document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { location.hash = b.dataset.go ? "#/" + b.dataset.go : ""; }));
    document.querySelectorAll("[data-pr]").forEach((b) => (b.onclick = () => practice(b.dataset.pr)));
    document.querySelectorAll("[data-dg]").forEach((b) => (b.onclick = () => diagnostic(+b.dataset.dg)));
    document.querySelectorAll("[data-ws]").forEach((b) => (b.onclick = () => sheetDialog(b.dataset.ws)));
  }

  // ===================== التسجيل =====================
  function regScreen() {
    $("lnWho").classList.add("hide");
    $("ln").innerHTML = `<section class="ln-hero"><div><span class="pill gold">مجاني لكل طلاب المملكة ومعلّميها</span>
        <h1>تعلّم الثقافة المالية<br>للصف الثاني عشر — بذكاء</h1>
        <p>اختبار تشخيصي يحدّد نقاط ضعفك بالدرس والنتاج، وتدريب على كل درس بشرح فوري لكل إجابة، وفيديوهات شرح، وأوراق عمل جاهزة للطباعة مع مفاتيحها.</p>
        <div class="ln-feats"><div>${ic("target")}<b>تشخيص ذكي</b><span>يخبرك من أين تبدأ</span></div><div>${ic("spark")}<b>٤٢٠ سؤالًا بشرح</b><span>على كل دروس الفصل الأول</span></div>
          <div>${ic("video")}<b>فيديو لكل درس</b><span>مع الملخص وصفحات الكتاب</span></div><div>${ic("printer")}<b>أوراق عمل A4</b><span>مع مفتاح الإجابة</span></div></div></div>
      <form class="card pad ln-reg" id="rg" novalidate><h3>ابدأ مجانًا</h3><p class="tiny">مرة واحدة فقط على هذا الجهاز.</p>
        <div class="seg" id="rgRole" style="margin:10px 0 12px"><button type="button" data-r="student" aria-pressed="${!ME || ME.role !== "teacher"}">${ic("user", "sm")}أنا طالب</button><button type="button" data-r="teacher" aria-pressed="${!!ME && ME.role === "teacher"}">${ic("key", "sm")}أنا معلّم</button></div>
        <label class="field"><span>الاسم</span><input class="input" id="rgN" maxlength="60" autocomplete="name" value="${esc((ME && ME.name) || "")}" required></label>
        <label class="field"><span>رقم الهاتف</span><input class="input" id="rgP" inputmode="tel" dir="ltr" maxlength="16" placeholder="07XXXXXXXX" autocomplete="tel" value="${esc((ME && ME.phone) || "")}" required></label>
        <label class="field"><span>اسم المدرسة</span><input class="input" id="rgS" maxlength="80" value="${esc((ME && ME.school) || "")}" required></label>
        <label class="check" style="margin-top:10px;align-items:flex-start"><input type="checkbox" id="rgC" ${ME ? "checked" : ""}> <span class="tiny">أوافق على حفظ بياناتي لدى «منصة السهم العلمي» واستخدامها للتواصل معي بخصوص خدماتها التعليمية، ولا تُعطى لأي جهة أخرى.</span></label>
        <div id="rgE" class="err hide" role="alert"></div>
        <button class="btn primary block lg" id="rgGo" type="submit">ابدأ الآن ${ic("left", "sm")}</button>
        <p class="tiny" style="text-align:center;margin-top:8px">طالب في منصة السهم؟ <a href="index.html">ادخل إلى صفحتك</a></p></form></section>`;
    let role = ME && ME.role === "teacher" ? "teacher" : "student";
    document.querySelectorAll("#rgRole button").forEach((b) => (b.onclick = () => { role = b.dataset.r; document.querySelectorAll("#rgRole button").forEach((z) => z.setAttribute("aria-pressed", z === b)); }));
    $("rg").onsubmit = async (e) => {
      e.preventDefault(); const err = (m) => { $("rgE").textContent = m; $("rgE").classList.remove("hide"); };
      $("rgE").classList.add("hide");
      const name = $("rgN").value.trim(), phone = $("rgP").value.trim(), school = $("rgS").value.trim();
      if (name.length < 3) return err("اكتب اسمك."); if (school.length < 2) return err("اكتب اسم مدرستك."); if (!$("rgC").checked) return err("يلزم الموافقة للمتابعة.");
      const b = $("rgGo"); spin(b, true, "لحظة…");
      try { const r = await rpcFetch("public_register", { p_vid: VID, p_name: name, p_phone: phone, p_school: school, p_role: role, p_consent: true });
        if (!r.ok) throw new Error(r.error); ME = { name, phone, school, role }; ls.set("sahm_pub_me", ME); ls.set("sahm_pub_open", today()); location.hash = ""; route(); }
      catch (x) { spin(b, false); err(x.message); }
    };
  }

  // ===================== الرئيسية =====================
  async function home() {
    await loadIdx(); res().then(() => {});
    const t = ME.role === "teacher", stk = streak(), mk = mistakesAll().length, idx = D.idx;
    let h = `<section class="greet"><div style="position:relative;z-index:1"><h1>أهلًا ${t ? "أستاذ/ة " : ""}${esc(firstName(ME.name))}</h1>
      <div class="sub">${esc(idx.subject)} · ${esc(idx.grade)}</div></div>
      ${t ? "" : `<div class="kpis sm"><div class="kpi"><b class="num">${stk}</b><span>${stk === 1 ? "يوم" : "أيام"} متتالية</span></div><div class="kpi"><b class="num">${Object.values(P.q).reduce((a, s) => a + s.n, 0)}</b><span>سؤالًا حللته</span></div>
        <div class="kpi"><b class="num">${mk}</b><span>في دفتر أخطائي</span></div><div class="kpi"><b class="num">${Object.keys(P.diag).length}/${idx.units.length}</b><span>تشخيص الوحدات</span></div></div>`}</section>`;
    if (t) {
      h += `<div class="ln-cta"><div>${ic("printer", "lg")}</div><div class="grow"><h3>أوراق عمل واختبارات تشخيصية جاهزة لصفّك</h3><p class="tiny">اختر درسًا أو أكثر، واسحب الأسئلة عشوائيًّا أو اخترها سؤالًا سؤالًا، فتُطبع بتصميم احترافي على A4 مع مفتاح الإجابة وجدول ربط الأسئلة بالنتاجات.</p></div>
        <button class="btn primary" data-go="build">${ic("file", "sm")}صمّم ورقة عمل أو اختبارًا</button></div>`;
      h += idx.units.map((u) => `<div class="lbl" style="margin:20px 0 8px">الوحدة ${u.seq}: ${esc(u.title)}</div><div class="ln-grid">` +
        idx.lessons.filter((l) => l.u === u.seq).map((l) => `<div class="card pad ln-l"><b>الدرس ${l.l}: ${esc(l.title)}</b><span class="tiny">${l.n} سؤالًا · صفحات الكتاب ${l.pages[0]}–${l.pages[1]}</span>
          <div class="row wrap" style="margin-top:10px;gap:6px"><button class="btn primary sm" data-ws="${l.code}">${ic("printer", "sm")}ورقة عمل</button><button class="btn ghost sm" data-go="lesson/${l.code}">صفحة الدرس</button></div></div>`).join("") +
        `<div class="card pad ln-l ln-dg"><b>اختبار تشخيصي للوحدة ${u.seq}</b><span class="tiny">أسئلة من كل درس لمعرفة مستوى صفّك قبل التدريس أو بعده</span>
          <div class="row wrap" style="margin-top:10px;gap:6px"><button class="btn outline sm" data-ws="U${u.seq}">${ic("printer", "sm")}اطبعه</button><button class="btn ghost sm" data-dg="${u.seq}">جرّبه إلكترونيًّا</button></div></div></div>`).join("");
      h += `<div class="ln-cta rec"><div>${ic("award", "lg")}</div><div class="grow"><h3>سجلاتك الرسمية بأسماء طلابك وترويسة مدرستك</h3><p class="tiny">السجل التجميعي والتفصيلي وقائمة الشطب وكشف الحضور وورقة الرصد اليومي… جاهزة على A4. عاين مجانًا — دينار للسجل أو ديناران لكل السجلات طوال الفصل.</p></div>
        <button class="btn gold" data-go="records">${ic("printer", "sm")}سجلاتي</button></div>`;
      h += `<div class="ln-cta alt"><div>${ic("chart", "lg")}</div><div class="grow"><h3>هل تريد منصة كاملة لطلابك؟</h3><p class="tiny">اختبارات إلكترونية محمية، تعليم متمايز، رصد تلقائي للنتاجات، سجلات رسمية جاهزة للطباعة، ترتيب وبطاقات شرف، وتقارير لكل طالب.</p></div>
        <a class="btn gold" target="_blank" rel="noopener" href="${esc((window.APP_CONFIG || {}).WHATSAPP || "#")}">تواصل معنا</a></div>`;
    } else {
      h += `<div class="ln-cta"><div>${ic("target", "lg")}</div><div class="grow"><h3>${Object.keys(P.diag).length ? "تابع خطتك" : "ابدأ من هنا: اختبار تشخيصي لكل وحدة"}</h3><p class="tiny">١٢ سؤالًا تكشف لك الدروس والنتاجات التي تحتاج إلى مراجعة، ثم نرشدك إلى الفيديو والتدريب المناسبين.</p>
        <div class="row wrap" style="margin-top:10px;gap:6px">${idx.units.map((u) => { const r = P.diag[u.seq]; return `<button class="btn ${r ? "outline" : "primary"} sm" data-dg="${u.seq}">الوحدة ${u.seq}${r ? " · " + r.pct + "٪" : ""}</button>`; }).join("")}</div></div></div>
        <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn primary" data-pr="smart">${ic("spark", "sm")}تدريب ذكي (١٠ أسئلة)</button>${mk ? `<button class="btn outline" data-pr="mistakes">دفتر أخطائي (${mk})</button>` : ""}</div>`;
      h += idx.units.map((u) => `<div class="lbl" style="margin:20px 0 8px">الوحدة ${u.seq}: ${esc(u.title)}</div><div class="ln-grid">` +
        idx.lessons.filter((l) => l.u === u.seq).map((l) => { const s = lessonStat(l.code), dr = P.diag[u.seq] && P.diag[u.seq].per[l.code], weak = dr && dr[0] / dr[1] < 0.67;
          return `<div class="card pad ln-l ${weak ? "weak" : ""}"><b>الدرس ${l.l}: ${esc(l.title)}</b><span class="tiny">${s.n ? `حللت ${s.n} سؤالًا بدقّة ${s.acc}٪` : "لم تتدرّب بعد"}${weak ? " · يحتاج مراجعة" : ""}</span>
            ${s.n ? `<div class="bar" style="margin-top:8px"><i style="width:${s.acc}%"></i></div>` : ""}
            <div class="row wrap" style="margin-top:10px;gap:6px"><button class="btn primary sm" data-pr="${l.code}">تدرّب</button><button class="btn ghost sm" data-go="lesson/${l.code}">${ic("video", "sm")}الشرح</button><button class="btn ghost sm" data-ws="${l.code}">${ic("printer", "sm")}ورقة عمل</button></div></div>`; }).join("") + "</div>").join("");
    }
    $("ln").innerHTML = h; wire();
  }

  // ===================== صفحة الدرس =====================
  async function lessonPage(code) {
    await loadIdx(); const l = lessonOf(code); if (!l) { location.hash = ""; return; }
    $("ln").innerHTML = crumb("الدرس " + l.l + ": " + esc(l.title), "الوحدة " + l.u + " · صفحات الكتاب " + l.pages[0] + "–" + l.pages[1]) + '<div class="card pad tiny">جارٍ التحميل…</div>';
    await res(); const r = resOf(l), yt = ytId(r.video), s = lessonStat(code);
    let h = crumb("الدرس " + l.l + ": " + esc(l.title), "الوحدة " + l.u + " · صفحات الكتاب " + l.pages[0] + "–" + l.pages[1]);
    if (yt) { h += `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="فيديو الدرس" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`; ping("video"); }
    else if (r.video) h += `<a class="btn primary" target="_blank" rel="noopener" href="${esc(r.video)}" onclick="">${ic("video", "sm")}شاهد فيديو الشرح</a>`;
    if (r.summary) h += `<div class="card pad" style="margin-top:14px"><h3 style="font-size:16px;margin-bottom:8px">${ic("book", "sm")} ملخص الدرس</h3><div class="sum">${esc(r.summary)}</div></div>`;
    if (!r.video && !r.summary) h += `<div class="note">فيديو هذا الدرس قريبًا. راجع الكتاب (الصفحات ${l.pages[0]}–${l.pages[1]}) ثم تدرّب على الأسئلة.</div>`;
    h += `<div class="card pad" style="margin-top:14px"><h3 style="font-size:16px;margin-bottom:8px">${ic("target", "sm")} نتاجات الدرس</h3><ol class="ln-outs">${l.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ol></div>
      <div class="row wrap" style="margin-top:14px;gap:8px"><button class="btn primary" data-pr="${code}">${ic("spark", "sm")}تدرّب على الدرس</button><button class="btn outline" data-ws="${code}">${ic("printer", "sm")}ورقة عمل للطباعة</button></div>
      ${s.n ? `<p class="tiny" style="margin-top:8px">حللت ${s.n} سؤالًا من هذا الدرس بدقّة ${s.acc}٪${s.mk ? "، وفي دفتر أخطائك " + s.mk : ""}.</p>` : ""}`;
    $("ln").innerHTML = h; wire();
  }

  // ===================== التدريب (بتصحيح وشرح فوري) =====================
  const DORD = { "سهل": 1, "متوسط": 2, "صعب": 3 };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  async function pool(what) {
    await loadIdx();
    if (what === "mistakes") { const ids = mistakesAll(), codes = [...new Set(ids.map((i) => i.split("-")[0]))]; const all = (await Promise.all(codes.map(bank))).flat(); return all.filter((q) => ids.includes(q.id)); }
    if (what === "smart") {   // الدروس الأضعف أولًا (من التشخيص والتدريب)
      const sc = D.idx.lessons.map((l) => { const s = lessonStat(l.code), dr = Object.values(P.diag).map((d) => d.per[l.code]).find(Boolean);
        const acc = dr ? dr[0] / dr[1] : s.n ? s.acc / 100 : 0.5; return { l, w: (1.2 - acc) * (0.5 + Math.random()) }; }).sort((a, b) => b.w - a.w).slice(0, 3);
      return (await Promise.all(sc.map((x) => bank(x.l.code)))).flat();
    }
    return bank(what);
  }
  const R = { qs: [], i: 0, ok: 0, done: 0, what: "" };
  async function practice(what) {
    let all; try { all = await pool(what); } catch (e) { toast("تعذّر تحميل الأسئلة — تحقّق من الإنترنت", true); return; }
    if (!all.length) { toast(what === "mistakes" ? "دفتر أخطائك فارغ — أحسنت!" : "لا أسئلة"); return; }
    const score = (q) => { const s = P.q[q.id]; return (isMistake(q.id) ? 3 : !s ? 2 : s.ok / s.n < 0.6 ? 1.5 : s.last > Date.now() - 2 * 864e5 ? 0.2 : 0.8) * (0.4 + Math.random()); };
    const pick = all.map((q) => ({ q, s: score(q) })).sort((a, b) => b.s - a.s).slice(0, 10).map((x) => x.q).sort((a, b) => DORD[a.d] - DORD[b.d]);
    Object.assign(R, { qs: pick, i: 0, ok: 0, done: 0, what }); location.hash = "#/practice"; drawQ();
  }
  function drawQ() {
    const q = R.qs[R.i], n = R.qs.length, l = lessonOf(q.id.split("-")[0]);
    const opts = shuffle(q.opts.map((t, k) => ({ t, k })));
    $("ln").innerHTML = `<div class="crumb"><button class="iconbtn" id="pX" aria-label="إنهاء">${ic("x")}</button><div><h2>${R.what === "mistakes" ? "دفتر أخطائي" : "تدريب"} · ${R.i + 1} من ${n}</h2>
        <div class="tiny">الدرس ${l.l}: ${esc(l.title)} · ${esc(q.d)} · صحيح ${R.ok} من ${R.done}</div></div></div>
      <div class="bar" style="margin-bottom:14px"><i style="width:${(R.i / n) * 100}%"></i></div>
      <div class="card pad pq"><div class="stem">${esc(q.s)}</div><div class="opts">${opts.map((o, j) => `<button class="opt" data-k="${o.k}"><span class="L">${L[j]}</span><span class="grow">${esc(o.t)}</span></button>`).join("")}</div><div id="pFb"></div></div>`;
    $("pX").onclick = endPractice;
    document.querySelectorAll(".pq .opt").forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
  }
  function answer(k) {
    const q = R.qs[R.i], good = k === q.c; R.done++; if (good) R.ok++; record(q.id, good);
    document.querySelectorAll(".pq .opt").forEach((b) => { b.disabled = true; b.classList.add("rvo"); const kk = +b.dataset.k; if (kk === q.c) b.classList.add("is-ok"); if (kk === k && !good) b.classList.add("is-bad"); });
    const last = R.i === R.qs.length - 1;
    $("pFb").innerHTML = `<div class="pfb ${good ? "ok" : "bad"}"><b>${good ? "إجابة صحيحة، أحسنت!" : "إجابة خاطئة — الصحيحة بالأخضر"}</b><p class="ln-e">${esc(q.e)}</p>
      <button class="btn primary" id="pN">${last ? "النتيجة" : "التالي"}${ic("left", "sm")}</button></div>`;
    $("pN").onclick = () => { if (last) endPractice(); else { R.i++; drawQ(); window.scrollTo(0, 0); } }; $("pN").focus();
  }
  function endPractice() {
    if (R.done) ping("practice", R.done);
    const n = R.done, p = n ? Math.round((R.ok / n) * 100) : 0, mk = mistakesAll().length;
    $("ln").innerHTML = crumb("نتيجة التدريب") + (n ? `<div class="card pad" style="text-align:center"><div class="score-ring" style="--p:${p}"><div><div><b class="num">${R.ok}/${n}</b><span class="tiny">${p}٪</span></div></div></div>
      <p class="muted">${p >= 85 ? "ممتاز! أنت تتقن هذه الأسئلة." : p >= 60 ? "جيد — راجع أخطاءك لترتفع أكثر." : "لا بأس — شاهد شرح الدرس ثم أعد المحاولة."}</p>
      <div class="row wrap" style="justify-content:center;margin-top:10px;gap:8px"><button class="btn primary" data-pr="${R.what}">تدريب جديد</button>${mk ? `<button class="btn outline" data-pr="mistakes">دفتر أخطائي (${mk})</button>` : ""}<button class="btn ghost" data-go="">الرئيسية</button></div></div>` : "") ;
    if (!n) { location.hash = ""; return; }
    wire();
  }

  // ===================== الاختبار التشخيصي =====================
  async function diagSet(u, per) {
    await loadIdx(); const ls2 = D.idx.lessons.filter((l) => l.u === u), k = per || (ls2.length >= 6 ? 2 : 3), out = [];
    for (const l of ls2) { const b = await bank(l.code), by = (d) => shuffle(b.filter((q) => q.d === d));
      const want = k === 2 ? ["سهل", "متوسط"] : ["سهل", "متوسط", "صعب"]; while (want.length < k) want.push("متوسط");
      want.forEach((d) => { const q = by(d).find((x) => !out.includes(x)) || shuffle(b.slice()).find((x) => !out.includes(x)); if (q) out.push(q); }); }
    return out;
  }
  const G = { u: 0, qs: [], ans: {}, i: 0 };
  async function diagnostic(u) {
    let qs2; try { qs2 = await diagSet(u); } catch (e) { toast("تعذّر تحميل الأسئلة", true); return; }
    Object.assign(G, { u, qs: qs2, ans: {}, i: 0 }); location.hash = "#/diag"; drawD();
  }
  function drawD() {
    const q = G.qs[G.i], n = G.qs.length, u = D.idx.units.find((x) => x.seq === G.u);
    if (!q.sh) q.sh = shuffle(q.opts.map((t, k) => ({ t, k })));
    $("ln").innerHTML = `<div class="crumb"><button class="iconbtn" data-go="" aria-label="إلغاء">${ic("x")}</button><div><h2>تشخيص الوحدة ${G.u} · ${G.i + 1} من ${n}</h2><div class="tiny">${esc(u.title)} — أجب بما تعرفه، والنتيجة في النهاية</div></div></div>
      <div class="bar" style="margin-bottom:14px"><i style="width:${(G.i / n) * 100}%"></i></div>
      <div class="card pad pq"><div class="stem">${esc(q.s)}</div><div class="opts">${q.sh.map((o, j) => `<button class="opt" data-k="${o.k}" aria-checked="${G.ans[q.id] === o.k}"><span class="L">${L[j]}</span><span class="grow">${esc(o.t)}</span></button>`).join("")}</div>
      <div class="row sp" style="margin-top:14px"><button class="btn ghost" id="dP" ${G.i ? "" : "disabled"}>السابق</button><button class="btn ghost" id="dS">لا أعرف</button><button class="btn primary" id="dN">${G.i === n - 1 ? "النتيجة" : "التالي"}</button></div></div>`;
    wire();
    document.querySelectorAll(".pq .opt").forEach((b) => (b.onclick = () => { G.ans[q.id] = +b.dataset.k; document.querySelectorAll(".pq .opt").forEach((z) => z.setAttribute("aria-checked", z === b)); }));
    const next = () => { if (G.i === n - 1) diagResult(); else { G.i++; drawD(); window.scrollTo(0, 0); } };
    $("dN").onclick = next; $("dS").onclick = () => { delete G.ans[q.id]; next(); }; $("dP").onclick = () => { G.i--; drawD(); };
  }
  async function diagResult() {
    const per = {}; let ok = 0;
    G.qs.forEach((q) => { const c = q.id.split("-")[0], good = G.ans[q.id] === q.c; per[c] = per[c] || [0, 0]; per[c][1]++; if (good) { per[c][0]++; ok++; } if (G.ans[q.id] != null) record(q.id, good); });
    const pct = Math.round((ok / G.qs.length) * 100); P.diag[G.u] = { at: Date.now(), pct, per }; save(); ping("diag");
    await res();
    const rows = Object.entries(per).map(([c, [a, n]]) => ({ l: lessonOf(c), a, n, r: a / n })).sort((x, y) => x.r - y.r);
    const lvl = (r) => (r >= 0.67 ? ["متمكّن", "open"] : r >= 0.34 ? ["يحتاج مراجعة", "warn"] : ["ابدأ به أولًا", "bad"]);
    let h = crumb("نتيجة تشخيص الوحدة " + G.u) + `<div class="card pad" style="text-align:center"><div class="score-ring" style="--p:${pct}"><div><div><b class="num">${ok}/${G.qs.length}</b><span class="tiny">${pct}٪</span></div></div></div>
      <p class="muted">${pct >= 80 ? "مستواك ممتاز في هذه الوحدة. حافظ عليه بالتدريب." : "هذه خطتك: ابدأ بالدروس الأضعف بالترتيب أدناه."}</p></div>
      <div class="lbl" style="margin:18px 0 8px">خطتك بالترتيب</div>` + rows.map((x, i) => { const [t, c] = lvl(x.r), rr = resOf(x.l);
        return `<div class="card pad ln-plan" style="margin-bottom:10px"><div class="row sp wrap"><b>${i + 1}. الدرس ${x.l.l}: ${esc(x.l.title)}</b><span class="pill ${c}">${t} · ${x.a}/${x.n}</span></div>
          ${x.r < 0.67 ? `<div class="tiny" style="margin-top:6px">${rr.video ? "شاهد فيديو الشرح، ثم " : "راجع الكتاب (الصفحات " + x.l.pages[0] + "–" + x.l.pages[1] + ")، ثم "}تدرّب على ١٠ أسئلة من الدرس حتى تصل دقّتك إلى ٨٠٪ فأكثر.</div>` : ""}
          <div class="row wrap" style="margin-top:8px;gap:6px">${x.r < 0.67 ? `<button class="btn ghost sm" data-go="lesson/${x.l.code}">${ic("video", "sm")}الشرح</button>` : ""}<button class="btn ${x.r < 0.67 ? "primary" : "outline"} sm" data-pr="${x.l.code}">تدرّب</button></div></div>`; }).join("") +
      `<details class="card pad" style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">مراجعة الإجابات مع الشرح</summary>` + G.qs.map((q, i) => { const a = G.ans[q.id], good = a === q.c;
        return `<div class="ln-rv ${good ? "ok" : "bad"}"><div class="tiny">${i + 1}. ${good ? "صحيحة" : a == null ? "لم تُجب" : "خاطئة"}</div><b>${esc(q.s)}</b>
          <div class="tiny" style="margin-top:4px">${a != null && !good ? "إجابتك: " + esc(q.opts[a]) + " · " : ""}الصحيحة: <b>${esc(q.opts[q.c])}</b></div><p class="ln-e">${esc(q.e)}</p></div>`; }).join("") + "</details>";
    $("ln").innerHTML = h; wire();
  }

  // ===================== مصمّم ورقة العمل / الاختبار =====================
  const BD = { kind: "worksheet", lessons: [], mode: "random", n: 15, mix: "bal", picked: [], drawn: [], title: "", teacher: "", school: "", duration: "", showOutcome: false, explain: true, fo: "", fd: "", q: "", wl: { on: false, exam: "الاختبار الأول" } };
  const MIX = { bal: [0.3, 0.43, 0.27], easy: [0.5, 0.35, 0.15], hard: [0.15, 0.4, 0.45] };
  const ocOf = (q) => { const l = lessonOf(q.id.split("-")[0]); return { oc: "د" + l.l + "/ن" + q.o, ot: l.outcomes[q.o - 1] || "", lesson: "الدرس " + l.l + ": " + l.title, l }; };
  function sheetDialog(what) { location.hash = "#/build/" + what; }
  async function builder(arg) {
    await loadIdx();
    if (arg) { // تهيئة من زر درس أو وحدة
      if (arg.startsWith("U")) { const u = +arg.slice(1); BD.lessons = D.idx.lessons.filter((l) => l.u === u).map((l) => l.code); BD.kind = "test"; BD.n = 12; }
      else if (lessonOf(arg)) { BD.lessons = [arg]; BD.kind = "worksheet"; }
      BD.picked = []; BD.drawn = []; BD.title = ""; history.replaceState(null, "", "#/build");
    }
    if (!BD.lessons.length) BD.lessons = [D.idx.lessons[0].code];
    if (!BD.school && ME) BD.school = ME.school || "";
    if (!BD.teacher && ME && ME.role === "teacher") BD.teacher = ME.name || "";
    await Promise.all(BD.lessons.map(bank));
    const pool = BD.lessons.flatMap((c) => D.bank[c]), avail = pool.length;
    const ls2 = BD.lessons.map(lessonOf);
    const defTitle = (BD.kind === "test" ? "اختبار" : "ورقة عمل") + " — " + (ls2.length === 1 ? "الدرس " + ls2[0].l : ls2.length + " دروس");
    let h = crumb("مصمّم ورقة العمل والاختبار", "اختر الدروس، ثم اسحب الأسئلة عشوائيًّا أو اخترها سؤالًا سؤالًا — كل سؤال مربوط بنتاجه");
    h += `<div class="bd"><aside class="card pad bd-side">
      <div class="lbl">النوع</div><div class="seg" id="bK"><button data-v="worksheet" aria-pressed="${BD.kind === "worksheet"}">${ic("file", "sm")}ورقة عمل</button><button data-v="test" aria-pressed="${BD.kind === "test"}">${ic("award", "sm")}اختبار</button></div>
      <div class="lbl" style="margin-top:14px">الدروس <span class="tiny">(درس أو أكثر)</span></div>
      <div class="bd-ls">${D.idx.units.map((u) => `<div class="bd-u"><b>الوحدة ${u.seq}</b>${D.idx.lessons.filter((l) => l.u === u.seq).map((l) => `<label class="chip lchip ${BD.lessons.includes(l.code) ? "on" : ""}"><input type="checkbox" class="bL" value="${l.code}" ${BD.lessons.includes(l.code) ? "checked" : ""}>الدرس ${l.l}</label>`).join("")}</div>`).join("")}</div>
      <div class="lbl" style="margin-top:14px">طريقة اختيار الأسئلة</div><div class="seg" id="bM"><button data-v="random" aria-pressed="${BD.mode === "random"}">${ic("spark", "sm")}عشوائي من النظام</button><button data-v="manual" aria-pressed="${BD.mode === "manual"}">${ic("list", "sm")}أختارها بنفسي</button></div>
      ${BD.mode === "random" ? `<div class="fields two" style="margin-top:10px"><label class="field"><span>عدد الأسئلة</span><select class="input" id="bN">${[5, 10, 12, 15, 20, 25, 30, 40, 50].filter((x) => x <= avail).map((x) => `<option ${x === BD.n ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field"><span>مستوى الصعوبة</span><select class="input" id="bX"><option value="bal" ${BD.mix === "bal" ? "selected" : ""}>متوازن</option><option value="easy" ${BD.mix === "easy" ? "selected" : ""}>أسهل</option><option value="hard" ${BD.mix === "hard" ? "selected" : ""}>أصعب</option></select></label></div>
        <button class="btn primary block" id="bDraw" style="margin-top:10px">${ic("spark", "sm")}اسحب ${BD.drawn.length ? "من جديد" : "الأسئلة"}</button>` : `<p class="tiny" style="margin-top:8px">علّم الأسئلة من القائمة. ترتيبها في الورقة = ترتيب اختيارك.</p>`}
      <div class="lbl" style="margin-top:16px">بيانات الورقة</div>
      <label class="field"><span>العنوان</span><input class="input" id="bT" value="${esc(BD.title)}" placeholder="${esc(defTitle)}"></label>
      <div class="fields two"><label class="field"><span>المدرسة</span><input class="input" id="bS" value="${esc(BD.school)}"></label><label class="field"><span>المعلّم/ة (اختياري)</span><input class="input" id="bTe" value="${esc(BD.teacher)}"></label></div>
      ${BD.kind === "test" ? `<label class="field"><span>المدة (دقيقة، اختياري)</span><input class="input" id="bDu" inputmode="numeric" value="${esc(BD.duration)}"></label>` : ""}
      ${BD.kind === "test" ? `<div class="wlbox"><label class="check"><input type="checkbox" id="bWL" ${BD.wl.on ? "checked" : ""}> <span><b>ترويستي الخاصة — بدون اسم المنصة</b><span class="tiny" style="display:block">للاختبار الأول والنهائي: اسمك ومدرستك والتاريخ الذي تريده · ½ دينار</span></span></label>
        ${BD.wl.on ? `<div class="fields two" style="margin-top:8px"><label class="field"><span>اسم الاختبار</span><select class="input" id="wE">${["الاختبار الأول", "الاختبار النهائي", "اختبار قصير", "امتحان تجريبي"].map((x) => `<option ${x === BD.wl.exam ? "selected" : ""}>${x}</option>`).join("")}</select></label>
          <label class="field"><span>التاريخ</span><input class="input" id="wT" value="${esc(BD.wl.date || "")}" placeholder="مثال: الأحد 2026/11/2"></label></div>
          <label class="field"><span>المديرية</span><input class="input" id="wD" value="${esc(BD.wl.directorate || "")}" placeholder="لواء وادي السير"></label>
          <div class="fields two"><label class="field"><span>الصف</span><input class="input" id="wG" value="${esc(BD.wl.grade || "الثاني عشر الأكاديمي")}"></label><label class="field"><span>الشعبة</span><input class="input" id="wS" value="${esc(BD.wl.section || "")}"></label></div>
          <div class="fields two"><label class="field"><span>العلامة الكلية</span><input class="input" id="wM" inputmode="numeric" value="${esc(BD.wl.marks || "")}" placeholder="عدد الأسئلة"></label><label class="field"><span>الفصل</span><input class="input" id="wF" value="${esc(BD.wl.term || "الأول 2026/2027")}"></label></div>
          <p class="tiny">المدرسة واسم المعلّم من الخانات أعلاه، والمدة من خانة المدة.</p>` : ""}</div>` : ""}
      <label class="check" style="margin-top:8px"><input type="checkbox" id="bO" ${BD.showOutcome ? "checked" : ""}> إظهار رمز النتاج بجانب كل سؤال في ورقة الطالب</label>
      <label class="check"><input type="checkbox" id="bE" ${BD.explain ? "checked" : ""}> شرح الإجابات في صفحة المفتاح</label>
    </aside><section class="bd-main"><div class="bd-bar"><b id="bCount"></b><span class="grow"></span><button class="btn ghost sm" id="bClr">مسح</button><button class="btn primary" id="bPrint">${ic("printer", "sm")}معاينة وطباعة</button></div><div id="bList"></div></section></div>`;
    $("ln").innerHTML = h; wire();
    const rerender = () => builder();
    document.querySelectorAll("#bK button").forEach((b) => (b.onclick = () => { BD.kind = b.dataset.v; rerender(); }));
    document.querySelectorAll("#bM button").forEach((b) => (b.onclick = () => { BD.mode = b.dataset.v; rerender(); }));
    document.querySelectorAll(".bL").forEach((c) => (c.onchange = () => { BD.lessons = [...document.querySelectorAll(".bL:checked")].map((x) => x.value); if (!BD.lessons.length) { c.checked = true; BD.lessons = [c.value]; toast("اختر درسًا واحدًا على الأقل"); }
      BD.drawn = BD.drawn.filter((id) => BD.lessons.includes(id.split("-")[0])); BD.picked = BD.picked.filter((id) => BD.lessons.includes(id.split("-")[0])); rerender(); }));
    const keepWl = () => { if (!$("wE")) return; Object.assign(BD.wl, { exam: $("wE").value, date: $("wT").value.trim(), directorate: $("wD").value.trim(), grade: $("wG").value.trim(), section: $("wS").value.trim(), marks: $("wM").value.replace(/\D/g, ""), term: $("wF").value.trim() }); };
    if ($("bWL")) $("bWL").onchange = (e) => { keep(); BD.wl.on = e.target.checked; if (BD.wl.on && ME && ME.role === "teacher") { BD.teacher = BD.teacher || ME.name || ""; BD.school = BD.school || ME.school || ""; } rerender(); };
    ["wE", "wT", "wD", "wG", "wS", "wM", "wF"].forEach((id) => { if ($(id)) $(id).onchange = keepWl; });
    const keep = () => { BD.title = $("bT").value.trim(); BD.school = $("bS").value.trim(); BD.teacher = $("bTe").value.trim(); BD.showOutcome = $("bO").checked; BD.explain = $("bE").checked; if ($("bDu")) BD.duration = $("bDu").value.replace(/\D/g, ""); };
    ["bT", "bS", "bTe", "bO", "bE", "bDu"].forEach((id) => { if ($(id)) $(id).onchange = keep; });
    if ($("bN")) $("bN").onchange = (e) => { BD.n = +e.target.value; };
    if ($("bX")) $("bX").onchange = (e) => { BD.mix = e.target.value; };
    if ($("bDraw")) $("bDraw").onclick = () => { draw(pool); listDraw(pool); };
    $("bClr").onclick = () => { if (BD.mode === "random") BD.drawn = []; else BD.picked = []; listDraw(pool); };
    $("bPrint").onclick = () => { keep(); const ids = BD.mode === "random" ? BD.drawn : BD.picked; if (!ids.length) return toast(BD.mode === "random" ? "اضغط «اسحب الأسئلة» أولًا" : "اختر سؤالًا واحدًا على الأقل", true);
      const by = {}; pool.forEach((q) => (by[q.id] = q));
      const qs2 = ids.map((id) => { const q = by[id], m = ocOf(q); return { s: q.s, opts: q.opts, c: q.c, e: q.e, d: q.d, oc: m.oc, ot: m.ot, lesson: m.lesson }; });
      const lsN = [...new Set(ids.map((id) => id.split("-")[0]))].map(lessonOf);
      const base = { kind: BD.kind, title: BD.title || defTitle, subtitle: lsN.map((l) => "الدرس " + l.l + ": " + l.title).join(" · "), subject: D.idx.subject, grade: D.idx.grade,
        school: BD.school, teacher: BD.teacher, duration: BD.duration, showOutcome: BD.showOutcome, withExplain: BD.explain, questions: qs2 };
      if (BD.kind === "test" && BD.wl.on) { keepWl(); if (!BD.teacher || !BD.school) return toast("اكتب اسم المدرسة واسمك للترويسة الخاصة", true);
        const wl = Object.assign({}, BD.wl, { school: BD.school, teacher: BD.teacher, duration: BD.duration, marks: BD.wl.marks || qs2.length });
        const LR = window.LearnRecords;
        LR.loadOrders(VID, true).then(() => {
          if (LR.wlUnlocked()) { PrintPro.printPro(Object.assign({}, base, { wl })); ping("sheet"); return; }
          PrintPro.printPro(Object.assign({}, base, { wl, locked: "معاينة — اطلب الترويسة الخاصة (½ دينار) لطباعة النسخة النظيفة" }));
          LR.buySheet({ vid: VID, me: ME, kind: "wl", section: wl.exam, amount: 0.5, label: "اختبار بترويستك الخاصة", onActive: () => { PrintPro.printPro(Object.assign({}, base, { wl })); ping("sheet"); } });
        });
        return;
      }
      PrintPro.printPro(base); ping("sheet"); };
    listDraw(pool);
  }
  function draw(pool) {
    const n = Math.min(BD.n, pool.length), mx = MIX[BD.mix], want = { "سهل": Math.round(n * mx[0]), "صعب": Math.round(n * mx[2]) }; want["متوسط"] = n - want["سهل"] - want["صعب"];
    const out = [], byL = {}; BD.lessons.forEach((c) => (byL[c] = shuffle(D.bank[c].slice())));
    // توزيع متساوٍ تقريبًا على الدروس مع احترام نسب الصعوبة
    ["سهل", "متوسط", "صعب"].forEach((d) => { let k = want[d], guard = 0; while (k > 0 && guard++ < 500) { for (const c of BD.lessons) { if (k <= 0) break; const q = byL[c].find((x) => x.d === d && !out.includes(x)); if (q) { out.push(q); k--; } } if (!BD.lessons.some((c) => byL[c].some((x) => x.d === d && !out.includes(x)))) break; } });
    shuffle(pool.slice()).forEach((q) => { if (out.length < n && !out.includes(q)) out.push(q); });
    BD.drawn = out.sort((a, b) => DORD[a.d] - DORD[b.d] || a.id.localeCompare(b.id)).map((q) => q.id);
  }
  function listDraw(pool) {
    const by = {}; pool.forEach((q) => (by[q.id] = q));
    const card = (q, sel, idx, swap) => { const m = ocOf(q);
      return `<div class="bq ${sel ? "on" : ""}" data-id="${q.id}">${BD.mode === "manual" ? `<span class="bq-k">${sel ? idx : "＋"}</span>` : `<span class="bq-k">${idx}</span>`}
        <div class="grow"><div class="bq-s">${esc(q.s)}</div><div class="bq-o">${q.opts.map((t, j) => `<span class="${j === q.c ? "ok" : ""}">${L[j]}) ${esc(t)}</span>`).join("")}</div>
          <div class="bq-m"><span class="pill">${esc(m.lesson.split(":")[0])}</span><span class="pill gold" title="${esc(m.ot)}">${esc(m.oc)} · ${esc(m.ot.length > 46 ? m.ot.slice(0, 46) + "…" : m.ot)}</span><span class="pill ${q.d === "سهل" ? "open" : q.d === "صعب" ? "warn" : ""}">${esc(q.d)}</span><span class="pill">${esc(q.b)}</span></div></div>
        ${swap ? `<button class="btn ghost sm bq-sw" title="بدّله بسؤال آخر من الدرس والصعوبة نفسيهما">${ic("refresh", "sm")}</button>` : ""}</div>`; };
    let h = "";
    if (BD.mode === "random") {
      h = BD.drawn.length ? BD.drawn.map((id, i) => card(by[id], true, i + 1, true)).join("") : `<div class="card pad empty-b">${ic("spark", "lg")}<b>اختر الدروس والعدد، ثم «اسحب الأسئلة»</b><span class="tiny">ستظهر هنا لتراجعها، ويمكنك تبديل أي سؤال بزر واحد.</span></div>`;
      $("bCount").textContent = BD.drawn.length ? "الأسئلة المسحوبة: " + BD.drawn.length : "";
    } else {
      const outs = [...new Set(pool.map((q) => ocOf(q).oc))];
      const vis = pool.filter((q) => (!BD.fo || ocOf(q).oc === BD.fo) && (!BD.fd || q.d === BD.fd) && (!BD.q || q.s.includes(BD.q)));
      h = `<div class="bd-f"><select class="input sm" id="fO"><option value="">كل النتاجات</option>${outs.map((o) => `<option ${o === BD.fo ? "selected" : ""}>${o}</option>`).join("")}</select>
          <select class="input sm" id="fD"><option value="">كل الصعوبات</option>${["سهل", "متوسط", "صعب"].map((d) => `<option ${d === BD.fd ? "selected" : ""}>${d}</option>`).join("")}</select>
          <input class="input sm grow" id="fQ" placeholder="بحث في نص السؤال" value="${esc(BD.q)}"><button class="btn outline sm" id="fAll">اختر الظاهر (${vis.length})</button></div>` +
        vis.map((q) => { const i = BD.picked.indexOf(q.id); return card(q, i >= 0, i + 1, false); }).join("");
      $("bCount").textContent = "اخترت " + BD.picked.length + " من " + pool.length;
    }
    $("bList").innerHTML = h;
    document.querySelectorAll(".bq").forEach((el) => {
      const id = el.dataset.id;
      if (BD.mode === "manual") el.onclick = () => { const i = BD.picked.indexOf(id); if (i >= 0) BD.picked.splice(i, 1); else BD.picked.push(id); listDraw(pool); };
      const sw = el.querySelector(".bq-sw"); if (sw) sw.onclick = (e) => { e.stopPropagation(); const q = by[id], alt = shuffle(D.bank[id.split("-")[0]].filter((x) => x.d === q.d && !BD.drawn.includes(x.id)))[0] || shuffle(pool.filter((x) => !BD.drawn.includes(x.id)))[0];
        if (!alt) return toast("لا يوجد بديل متاح"); BD.drawn[BD.drawn.indexOf(id)] = alt.id; listDraw(pool); };
    });
    if ($("fO")) { $("fO").onchange = (e) => { BD.fo = e.target.value; listDraw(pool); }; $("fD").onchange = (e) => { BD.fd = e.target.value; listDraw(pool); };
      $("fQ").onchange = (e) => { BD.q = e.target.value.trim(); listDraw(pool); };
      $("fAll").onclick = () => { pool.filter((q) => (!BD.fo || ocOf(q).oc === BD.fo) && (!BD.fd || q.d === BD.fd) && (!BD.q || q.s.includes(BD.q))).forEach((q) => { if (!BD.picked.includes(q.id)) BD.picked.push(q.id); }); listDraw(pool); }; }
  }

  // ===================== السجلات الرسمية بأسماء طلابك (مدفوعة رمزيًّا) =====================
  async function recordsPage() {
    const LR = window.LearnRecords; await loadIdx(); await LR.loadOrders(VID, true);
    const F = ls.get("sahm_pub_rec", {}), mNow = new Date(), ym = F.month || (mNow.getFullYear() + "-" + String(mNow.getMonth() + 1).padStart(2, "0"));
    const sel = F.sel || ["sum"];
    let h = crumb("السجلات الرسمية بأسماء طلابك", "سجلات وزارة التربية جاهزة للطباعة على A4 — فارغة للتعبئة اليدوية، مع أسماء طلابك وترويسة مدرستك") +
      `<div class="rec-promo">${ic("award", "lg")}<div><b>اطبع سجلاتك كاملة بدينارين فقط للشعبة طوال الفصل</b><span>دينار واحد للسجل الواحد، أو ديناران لكل السجلات الثمانية. عاين مجانًا بأسماء طلابك، وادفع عند الطباعة فقط عبر CliQ.</span></div></div>
      <div class="bd" style="margin-top:14px"><aside class="card pad bd-side">
        <div class="lbl">بيانات الترويسة</div>
        <label class="field"><span>المديرية</span><input class="input" id="rD" value="${esc(F.directorate || "")}" placeholder="مثال: لواء وادي السير"></label>
        <label class="field"><span>المدرسة</span><input class="input" id="rS" value="${esc(F.school || (ME && ME.school) || "")}"></label>
        <label class="field"><span>المعلّم/ة</span><input class="input" id="rT" value="${esc(F.teacher || (ME && ME.name) || "")}"></label>
        <div class="fields two"><label class="field"><span>الصف</span><input class="input" id="rG" value="${esc(F.grade || "الثاني عشر الأكاديمي")}"></label><label class="field"><span>الشعبة</span><input class="input" id="rC" value="${esc(F.section || "")}" placeholder="أ"></label></div>
        <label class="field"><span>الفصل والعام</span><input class="input" id="rY" value="${esc(F.term || "الفصل الأول 2026/2027")}"></label>
        <label class="field"><span>شهر كشف الحضور</span><input class="input" type="month" id="rM" value="${ym}"></label>
        <div class="lbl" style="margin-top:12px">أسماء الطلبة</div>
        <textarea class="input" id="rN" rows="9" placeholder="الصق عمود الأسماء من Excel — اسم في كل سطر">${esc((F.names || []).join("\n"))}</textarea>
        <div class="tiny" id="rNc"></div>
      </aside><section class="bd-main"><div class="bd-bar"><b id="rSum"></b><span class="grow"></span><button class="btn outline" id="rPrev">${ic("eye", "sm")}معاينة مجانية</button><button class="btn primary" id="rPrint">${ic("printer", "sm")}اطبع</button></div>
        <div class="rec-list">${LR.REC.map(([k, t, d, o]) => `<label class="rec-c ${sel.includes(k) ? "on" : ""}"><input type="checkbox" class="rK" value="${k}" ${sel.includes(k) ? "checked" : ""}>
          <span class="rec-i">${ic(k === "attendance" ? "cal" : k === "daily" ? "bolt" : k === "verbal" ? "award" : "list")}</span><span class="grow"><b>${t}</b><span class="tiny">${d} · ${o === "l" ? "A4 أفقي" : "A4 عمودي"}</span></span><span class="rec-st"></span></label>`).join("")}</div>
        <div id="rOrders"></div></section></div>`;
    $("ln").innerHTML = h; wire();
    const ctx = () => ({ idx: D.idx, directorate: $("rD").value.trim(), school: $("rS").value.trim(), teacher: $("rT").value.trim(), grade: $("rG").value.trim(), section: $("rC").value.trim(), term: $("rY").value.trim(), month: $("rM").value || ym, names: LR.parseNames($("rN").value) });
    const chosen = () => [...document.querySelectorAll(".rK:checked")].map((c) => c.value);
    const refresh = () => {
      const c = ctx(), ks = chosen(); ls.set("sahm_pub_rec", { directorate: c.directorate, school: c.school, teacher: c.teacher, grade: c.grade, section: c.section, term: c.term, month: c.month, names: c.names, sel: ks });
      $("rNc").textContent = c.names.length ? c.names.length + " طالبًا" : "لم تُدخل أسماء بعد";
      document.querySelectorAll(".rec-c").forEach((el) => { const k = el.querySelector("input").value, on = el.querySelector("input").checked; el.classList.toggle("on", on);
        el.querySelector(".rec-st").innerHTML = c.names.length && LR.recUnlocked(k, c.names) ? '<span class="pill open">مدفوع ✓</span>' : ""; });
      const need = ks.filter((k) => !(c.names.length && LR.recUnlocked(k, c.names)));
      $("rSum").textContent = ks.length ? (need.length ? `المختار ${ks.length} · الطباعة: ${need.length === 1 && ks.length === 1 ? "1 دينار" : "2 دينار لكل السجلات"}` : "كل المختار مدفوع — اطبع متى شئت") : "اختر سجلًّا واحدًا على الأقل";
      const ords = LR.O.list.filter((o) => o.kind === "records");
      $("rOrders").innerHTML = ords.length ? `<div class="lbl" style="margin:16px 0 8px">طلباتي</div>` + ords.map((o) => `<div class="card pad row sp wrap" style="margin-bottom:8px"><span><b>طلب ${o.no}</b> · ${esc(o.section)} · ${o.n} طالبًا · ${o.records.length === 8 ? "كل السجلات" : o.records.length + " سجل"}</span>
        <span class="pill ${o.status === "active" ? "open" : o.status === "pending" ? "soon" : ""}">${o.status === "active" ? "مفعّل حتى " + o.until : o.status === "pending" ? "بانتظار التأكيد" : "منتهي"}</span></div>`).join("") : "";
    };
    ["rD", "rS", "rT", "rG", "rC", "rY", "rM", "rN"].forEach((id) => ($(id).oninput = refresh));
    document.querySelectorAll(".rK").forEach((c) => (c.onchange = refresh));
    refresh();
    const valid = () => { const c = ctx(); if (!chosen().length) { toast("اختر سجلًّا واحدًا على الأقل", true); return null; } if (!c.names.length) { toast("الصق أسماء طلابك أولًا", true); return null; } if (!c.section) { toast("اكتب الشعبة", true); return null; } return c; };
    $("rPrev").onclick = () => { const c = valid(); if (!c) return; LR.printRecords(chosen(), c, "نسخة معاينة — اضغط «اطبع» لطباعة النسخة النظيفة"); };
    $("rPrint").onclick = () => { const c = valid(); if (!c) return; const ks = chosen(), need = ks.filter((k) => !LR.recUnlocked(k, c.names));
      if (!need.length) { LR.printRecords(ks, c, null); ping("sheet"); return; }
      LR.buySheet({ vid: VID, me: ME, kind: "records", records: need, section: (c.grade + " / " + c.section).slice(0, 60), names: c.names, amount: need.length === 1 ? 1 : 2,
        label: need.length === 1 ? "طباعة سجل واحد" : "طباعة كل السجلات", onActive: () => { refresh(); LR.printRecords(ks, ctx(), null); } }); };
  }

  // ===================== الموجّه =====================
  function route() {
    if (!ME) { regScreen(); return; }
    $("lnWho").classList.remove("hide"); $("lnName").textContent = firstName(ME.name); $("lnRole").textContent = ME.role === "teacher" ? "معلّم" : "طالب";
    const [k, a] = (location.hash || "").replace("#/", "").split("/");
    if (k === "lesson" && a) return lessonPage(a);
    if (k === "build") return builder(a).catch(() => toast("تعذّر تحميل الأسئلة", true));
    if (k === "records") return recordsPage();
    if ((k === "practice" && !R.qs.length) || (k === "diag" && !G.qs.length)) { location.hash = ""; return; }
    if (k === "practice" || k === "diag") return;
    home().catch(() => ($("ln").innerHTML = '<div class="card pad">تعذّر التحميل — تحقّق من الإنترنت وأعد المحاولة.</div>'));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  $("lnHome").onclick = (e) => { e.preventDefault(); location.hash = ""; route(); };
  $("lnWho").onclick = () => regScreen();
  if (ME && ls.get("sahm_pub_open", "") !== today()) { ls.set("sahm_pub_open", today()); ping("open"); }
  else if (!ME) ping("open");
  route();
})();
