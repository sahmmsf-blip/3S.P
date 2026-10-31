// أدوات التعلّم: صفحات الدروس، أسئلة الطلبة، تحليل جودة الأسئلة، الورقة العلاجية، بطاقة الخروج
(function () {
  const { esc, toast, openSheet, closeSheet, confirmSheet } = U, S = T.S, B = () => T.brain;
  const AL = ["أ", "ب", "ج", "د"];

  // ================= صفحات الدروس: فيديو + ملخص لكل درس =================
  T.view("lessons", {
    title: "صفحات الدروس", sub: () => "فيديو الشرح والملخص لكل درس — يراها الطالب في «صفحة الدرس» مع مستواه وتدريب الدرس",
    async render(el) {
      el.innerHTML = T.empty("video", "جارٍ التحميل…");
      let res = []; try { res = await T.q(T.sb.from("lesson_resources").select("*")); } catch (e) { toast(e.message, true); }
      const R = {}; res.forEach((r) => (R[r.lesson_id] = r));
      const asks = {}; (S.asks || []).forEach((a) => { if (a.lesson_id) asks[a.lesson_id] = (asks[a.lesson_id] || 0) + 1; });
      el.innerHTML = `<div class="note" style="margin-bottom:12px">ضع رابط فيديو الشرح (يوتيوب أو أي رابط يبدأ بـ https) وملخصًا قصيرًا. يُحفظ تلقائيًّا عند الخروج من الخانة.
          إن كان الفيديو على يوتيوب فسيُعرض داخل المنصة مباشرة.</div>` +
        S.units.map((u) => `<details class="unit card pad" open style="margin-bottom:10px"><summary style="cursor:pointer"><b>الوحدة ${u.seq}: ${esc(u.title)}</b></summary>` +
          u.lessons.map((l) => { const r = R[l.id] || {};
            return `<div class="lres" data-l="${l.id}"><div class="row sp wrap"><b>الدرس ${l.seq}: ${esc(l.title)}</b><span class="tiny">${r.video_url || r.summary ? '<span class="pill open">منشور للطلبة</span>' : '<span class="pill">فارغ</span>'}${asks[l.id] ? " · " + asks[l.id] + " سؤالًا من الطلبة" : ""}</span></div>
              <div class="fields two" style="margin-top:8px"><label class="field"><span>رابط الفيديو</span><input class="input lrV" dir="ltr" placeholder="https://youtu.be/…" value="${esc(r.video_url || "")}"></label>
                <label class="field"><span>ملخص الدرس</span><textarea class="input lrS" rows="3" maxlength="6000" placeholder="أهم الأفكار والمعادلات والأمثلة…">${esc(r.summary || "")}</textarea></label></div></div>`; }).join("") + "</details>").join("");
      el.querySelectorAll(".lres").forEach((box) => {
        const save = async () => {
          const v = box.querySelector(".lrV").value.trim(), s = box.querySelector(".lrS").value.trim();
          if (v && !/^https:\/\//i.test(v)) return toast("الرابط يجب أن يبدأ بـ https://", true);
          try { await T.q(T.sb.from("lesson_resources").upsert({ lesson_id: box.dataset.l, teacher_id: S.me.id, video_url: v || null, summary: s || null, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" }).select());
            toast("حُفظت صفحة الدرس"); box.querySelector(".pill").outerHTML = v || s ? '<span class="pill open">منشور للطلبة</span>' : '<span class="pill">فارغ</span>'; }
          catch (e) { toast(e.message, true); }
        };
        box.querySelector(".lrV").onchange = save; box.querySelector(".lrS").onchange = save;
      });
    }
  });

  // ================= أسئلة الطلبة =================
  const AF = { f: "open" };
  T.view("asks", {
    title: "أسئلة الطلبة", secAware: false, sub: () => "«اسأل معلّمي»: أجب مرة واحدة فيستفيد كل طلبة الشعبة — زملاء السائل لا يرون اسمه",
    async render(el) {
      await T.loadAsks();
      const all = (S.asks || []).filter((a) => !a.hidden), open = all.filter((a) => !a.answer), done = all.filter((a) => a.answer);
      const list = AF.f === "open" ? open : AF.f === "done" ? done : all;
      const L = {}; S.units.forEach((u) => u.lessons.forEach((l) => (L[l.id] = l)));
      el.innerHTML = `<div class="vhead"><div class="seg" id="akF"><button data-f="open" aria-pressed="${AF.f === "open"}">بانتظار إجابتك (${open.length})</button>
          <button data-f="done" aria-pressed="${AF.f === "done"}">مُجابة (${done.length})</button><button data-f="all" aria-pressed="${AF.f === "all"}">الكل</button></div></div>` +
        (list.length ? list.map((a) => { const st = S.stu[a.student_id] || {}, sec = S.sections.find((x) => x.id === a.section_id) || {}, l = L[a.lesson_id];
          return `<div class="card pad tak" data-id="${a.id}" style="margin-bottom:10px"><div class="row sp wrap"><span>${T.av(a.student_id, 26)}<b>${esc(st.full_name || "طالب")}</b> <span class="tiny">· ${esc(sec.name || "")} · ${l ? "الدرس " + l.seq + ": " + esc(l.title) : "سؤال عام"} · ${esc(U.ago(a.created_at))}</span></span>
              ${a.answer ? '<span class="pill open">مُجاب</span>' : '<span class="pill gold">جديد</span>'}</div>
            <p class="q" style="white-space:pre-wrap;margin:8px 0">${esc(a.body)}</p>
            <textarea class="input akA" rows="3" maxlength="3000" placeholder="اكتب الجواب…">${esc(a.answer || "")}</textarea>
            <div class="row sp wrap" style="margin-top:8px"><div class="seg akV"><button data-v="section" aria-pressed="${a.visibility !== "private"}">يراه كل طلبة الشعبة (بلا اسم السائل)</button><button data-v="private" aria-pressed="${a.visibility === "private"}">خاص بالطالب</button></div>
              <div class="row" style="gap:6px"><button class="btn ghost sm akH">إخفاء</button><button class="btn primary sm akS">${ic("check", "sm")}حفظ الجواب</button></div></div></div>`; }).join("")
          : T.empty("chat", AF.f === "open" ? "لا أسئلة بانتظارك" : "لا أسئلة", "يسأل الطلبة من صفحاتهم عبر «اسأل معلّمي»، وتظهر أسئلتهم هنا."));
      el.querySelectorAll("#akF button").forEach((b) => (b.onclick = () => { AF.f = b.dataset.f; T.route(); }));
      el.querySelectorAll(".tak").forEach((box) => {
        const id = box.dataset.id;
        box.querySelectorAll(".akV button").forEach((b) => (b.onclick = () => box.querySelectorAll(".akV button").forEach((z) => z.setAttribute("aria-pressed", z === b))));
        box.querySelector(".akS").onclick = async () => {
          const ans = box.querySelector(".akA").value.trim(); if (!ans) return toast("اكتب الجواب أولًا", true);
          const vis = box.querySelector('.akV [aria-pressed="true"]').dataset.v;
          try { await T.q(T.sb.from("asks").update({ answer: ans, answered_at: new Date().toISOString(), visibility: vis }).eq("id", id)); toast("أُرسل الجواب"); T.route(); } catch (e) { toast(e.message, true); }
        };
        box.querySelector(".akH").onclick = async () => {
          if (!(await confirmSheet("إخفاء السؤال؟", "يختفي من صفحات الطلبة ومن هذه القائمة.", "أخفِ", true))) return;
          try { await T.q(T.sb.from("asks").update({ hidden: true }).eq("id", id)); T.route(); } catch (e) { toast(e.message, true); }
        };
      });
    }
  });

  // ================= تحليل جودة الأسئلة =================
  const pLabel = (p) => (p > 0.9 ? ["سهل جدًا", "warn"] : p >= 0.3 ? ["مناسب", "open"] : ["صعب جدًا", "bad"]);
  const dLabel = (d) => (d == null ? ["—", ""] : d < 0 ? ["سالب — راجعه", "bad"] : d < 0.2 ? ["ضعيف", "warn"] : d < 0.3 ? ["مقبول", ""] : d < 0.4 ? ["جيد", "open"] : ["ممتاز", "open"]);
  async function quality(box, examId) {
    box.innerHTML = '<div class="card pad tiny">جارٍ التحليل…</div>';
    let rows; try { rows = await T.rpc("t_item_analysis", { p_exam: examId || null }); } catch (e) { box.innerHTML = T.empty("alert", e.message); return; }
    rows = rows || [];
    if (!rows.length) { box.innerHTML = T.empty("chart", "لا إجابات بعد", "يظهر التحليل بعد أن يسلّم الطلبة."); return; }
    const flags = (r) => { const f = [], n = r.n, opts = r.options || [], c = r.counts || {};
      if (n >= 5 && r.p < 0.3) f.push("صعب جدًا — تأكّد من المفتاح ووضوح الصياغة");
      if (n >= 5 && r.p > 0.9) f.push("سهل جدًا — لا يميّز");
      if (n >= 8 && r.d != null && r.d < 0) f.push("المتفوّقون أخطؤوا فيه أكثر من الضعاف — غالبًا خلل في المفتاح");
      else if (n >= 8 && r.d != null && r.d < 0.2) f.push("تمييز ضعيف");
      opts.forEach((_, i) => { if (i !== r.correct && (c[i] || 0) > (c[r.correct] || 0) && n >= 5) f.push("البديل «" + AL[i] + "» جذب أكثر من الصحيح"); });
      if (n >= 10) opts.forEach((_, i) => { if (i !== r.correct && !(c[i] || 0)) f.push("البديل «" + AL[i] + "» لم يختره أحد — بديل ضعيف"); });
      return f; };
    const bad = rows.filter((r) => flags(r).length).length;
    box.innerHTML = `<div class="note" style="margin-bottom:12px"><b>${rows.length}</b> سؤالًا حُلّ ${rows.reduce((a, r) => a + r.n, 0)} مرة · <b>${bad}</b> تحتاج مراجعة.
        الصعوبة = نسبة من أجاب صحيحًا (المناسب ٣٠–٩٠٪). التمييز = الفرق بين أعلى ٢٧٪ وأدنى ٢٧٪ من الطلبة (٠٫٤ فأعلى ممتاز، أقل من ٠٫٢ ضعيف).</div>
      <div class="seg" id="qaF" style="margin-bottom:10px"><button data-f="bad" aria-pressed="true">تحتاج مراجعة (${bad})</button><button data-f="all" aria-pressed="false">كل الأسئلة</button></div><div id="qaL"></div>`;
    const draw = (only) => {
      box.querySelector("#qaL").innerHTML = rows.filter((r) => !only || flags(r).length).map((r) => { const [pl, pc] = pLabel(r.p), [dl, dc] = dLabel(r.n >= 6 ? r.d : null), c = r.counts || {}, n = r.n || 1;
        return `<div class="card pad qa" style="margin-bottom:10px"><div class="row sp wrap"><span class="tiny">#${r.num} · ${esc(r.outcome || "")} · ${esc(r.diff)} · ${esc(r.bloom || "")}${r.active ? "" : ' · <span class="pill">معطّل</span>'}</span>
            <span class="row" style="gap:6px"><span class="pill ${pc}">الصعوبة ${Math.round(r.p * 100)}٪ · ${pl}</span><span class="pill ${dc}">التمييز ${r.n >= 6 && r.d != null ? T.nf(r.d, 2) : "—"} · ${dl}</span></span></div>
          <p style="margin:8px 0;white-space:pre-wrap">${esc(r.stem)}</p>
          <div class="qa-o">${(r.options || []).map((o, i) => { const k = c[i] || 0; return `<div class="${i === r.correct ? "ok" : ""}"><span class="L">${AL[i]}</span><span class="grow">${esc(o)}</span><span class="qa-b"><i style="width:${(k / n) * 100}%"></i></span><b class="num">${k}</b></div>`; }).join("")}</div>
          <div class="tiny" style="margin-top:6px">حُلّ ${r.n} مرة${r.blank ? " · بلا إجابة " + r.blank : ""}${r.practice_n ? ` · في التدريب الذاتي ${r.practice_n} مرة بدقّة ${Math.round((r.practice_p || 0) * 100)}٪` : ""}</div>
          ${flags(r).length ? `<ul class="qa-f">${flags(r).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
          <div class="row" style="gap:6px;margin-top:8px">${r.active ? `<button class="btn sm outline" data-off="${r.id}">تعطيل السؤال</button>` : `<button class="btn sm outline" data-on="${r.id}">إعادة تفعيله</button>`}</div></div>`; }).join("") || T.empty("check", "لا أسئلة تحتاج مراجعة", "");
      box.querySelectorAll("[data-off],[data-on]").forEach((b) => (b.onclick = async () => { const on = !!b.dataset.on, id = b.dataset.on || b.dataset.off;
        try { await T.rpc("t_set_question_active", { p_id: id, p_active: on }); rows.find((r) => r.id === id).active = on; toast(on ? "أُعيد تفعيل السؤال" : "عُطّل السؤال — لن يُسحب في الاختبارات والتدريب"); draw(only); } catch (e) { toast(e.message, true); } }));
    };
    box.querySelectorAll("#qaF button").forEach((b) => (b.onclick = () => { box.querySelectorAll("#qaF button").forEach((z) => z.setAttribute("aria-pressed", z === b)); draw(b.dataset.f === "bad"); }));
    draw(true);
  }
  function bankQuality() { const b = openSheet(`<h3>${ic("chart", "sm")} تحليل جودة بنك الأسئلة</h3><div id="bqBox"></div>`, true); quality(b.querySelector("#bqBox"), null); }

  // ================= الورقة العلاجية =================
  function remedial(lessonId) {
    const secId = S.sec, L = S.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId) || S.units[0].lessons[0];
    const studs = T.studentsOf(secId);
    const outs = L.outcomes.map((o) => { const lv = studs.map((s) => { const e = B().effOf(s.id, o.id); return e ? e.level : null; }), m = lv.filter((x) => x != null);
      return { o, weak: lv.filter((x) => x != null && x <= 2).length, avg: m.length ? m.reduce((a, b) => a + b, 0) / m.length : null }; });
    const best = outs.slice().sort((a, b) => b.weak - a.weak)[0];
    const b = openSheet(`<h3>${ic("target", "sm")} ورقة علاجية — الدرس ${L.seq}</h3>
      <p class="tiny">تُنشأ ورقة عمل ورقية من البنك على نتاج واحد، للطلبة الذين تختارهم فقط (الأسهل أولًا)، ثم تطبعها وترصدها كالمعتاد فتُحدّث مستواهم في النتاج.</p>
      <label class="field"><span>النتاج</span><select class="input" id="rmO">${outs.map((x) => `<option value="${x.o.id}" ${x === best ? "selected" : ""}>${esc(x.o.short || x.o.label)} — ${esc(x.o.text.slice(0, 70))} (${x.weak} ضعيفًا${x.avg != null ? " · متوسط " + T.nf(x.avg, 1) : ""})</option>`).join("")}</select></label>
      <div class="row wrap" style="margin-top:10px;gap:10px"><label class="field" style="width:auto"><span>عدد الأسئلة</span><select class="input" id="rmN">${T.opt("6", [4, 6, 8, 10].map((n) => [String(n), String(n)]))}</select></label>
        <span class="tiny grow">محدَّدون تلقائيًّا: من مستواهم «مبتدئ» أو «نامٍ» في النتاج.</span></div>
      <div id="rmS" class="rmS"></div><div class="row" style="margin-top:12px"><button class="btn primary grow" id="rmGo">${ic("file", "sm")}أنشئ الورقة العلاجية</button></div>`, true);
    const drawS = () => { const oid = b.querySelector("#rmO").value;
      b.querySelector("#rmS").innerHTML = studs.map((s) => { const e = B().effOf(s.id, oid), lv = e ? e.level : null;
        return `<label class="check"><input type="checkbox" value="${s.id}" ${lv != null && lv <= 2 ? "checked" : ""}> ${T.av(s.id, 20)}${esc(s.full_name)} <span class="lv lv${lv || 0}">${lv ? T.LV[lv] : "لم يُقَس"}</span></label>`; }).join(""); };
    drawS(); b.querySelector("#rmO").onchange = drawS;
    b.querySelector("#rmGo").onclick = async () => {
      const ids = [...b.querySelectorAll("#rmS input:checked")].map((c) => c.value); if (!ids.length) return toast("اختر طالبًا واحدًا على الأقل", true);
      const btn = b.querySelector("#rmGo"); U.spin(btn, true, "جارٍ الإنشاء…");
      try { const r = await T.rpc("t_remedial_create", { p_outcome: b.querySelector("#rmO").value, p_students: ids, p_n: +b.querySelector("#rmN").value });
        closeSheet(); toast("أُنشئت الورقة العلاجية لـ " + r.sheets + " طلاب — اطبعها من صفحتها"); await T.refreshExams(); T.go("#exam/" + r.id); }
      catch (e) { U.spin(btn, false); toast(e.message, true); }
    };
  }

  // ================= بطاقة الخروج (QR) =================
  const QR_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
  function exitTicket() {
    const units = T.semUnits(S.sec), lessons = units.flatMap((u) => u.lessons);
    const recent = S.mastery.filter((m) => S.stu[m.student_id] && S.stu[m.student_id].section_id === S.sec).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
    const cur = recent && S.O[recent.outcome_id] ? S.O[recent.outcome_id].lesson.id : lessons.length ? lessons[0].id : "";
    const b = openSheet(`<h3>${ic("qr", "sm")} بطاقة خروج — ${esc(T.sec().name)}</h3>
      <p class="tiny">أسئلة قليلة من البنك على درس اليوم يحلّها الطلبة بهواتفهم في آخر الحصة بمسح رمز QR، فتعرف فورًا من فهم، وتُعتمد في النتاجات بأداة «بطاقة الخروج».</p>
      <label class="field"><span>الدرس</span><select class="input" id="xtL">${units.map((u) => `<optgroup label="الوحدة ${u.seq}">${u.lessons.map((l) => `<option value="${l.id}" ${l.id === cur ? "selected" : ""}>الدرس ${l.seq}: ${esc(l.title)}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <div class="fields two" style="margin-top:10px"><label class="field"><span>عدد الأسئلة</span><select class="input" id="xtN">${T.opt("3", [2, 3, 4, 5].map((n) => [String(n), String(n)]))}</select></label>
        <label class="field"><span>المدة (دقائق)</span><select class="input" id="xtM">${T.opt("10", [5, 7, 10, 15].map((n) => [String(n), String(n)]))}</select></label></div>
      <div class="row" style="margin-top:12px"><button class="btn primary grow" id="xtGo">${ic("qr", "sm")}افتح البطاقة واعرض الرمز</button></div>`);
    b.querySelector("#xtGo").onclick = async () => {
      const btn = b.querySelector("#xtGo"); U.spin(btn, true, "جارٍ الفتح…");
      try { const r = await T.rpc("t_exit_create", { p_section: S.sec, p_lesson: b.querySelector("#xtL").value, p_n: +b.querySelector("#xtN").value, p_minutes: +b.querySelector("#xtM").value });
        closeSheet(); await T.refreshExams(); qrScreen(r.id); }
      catch (e) { U.spin(btn, false); toast(e.message, true); }
    };
  }
  async function qrScreen(id) {
    const url = location.href.split("#")[0].replace(/teacher\.html.*$/, "students.html") + "#/go/" + id;
    const ov = document.createElement("div"); ov.className = "qrov"; ov.id = "qrov";
    ov.innerHTML = `<button class="hw-x" aria-label="إغلاق">✕</button><div class="qr-in"><h2>بطاقة الخروج — ${esc(T.sec().name)}</h2>
      <div class="qr-c" id="qrC"></div><p class="qr-u" dir="ltr">${esc(url)}</p><p>امسح الرمز بكاميرا هاتفك، وادخل بحسابك، وأجب عن الأسئلة.</p>
      <div class="qr-k"><div><b class="num" id="qrD">0</b><span>سلّموا</span></div><div><b class="num" id="qrS">0</b><span>بدؤوا</span></div><div><b class="num" id="qrA">—</b><span>المتوسط</span></div><div><b class="num" id="qrT">—</b><span>متبقٍّ</span></div></div>
      <div class="row wrap" style="justify-content:center;margin-top:16px"><button class="btn primary lg" id="qrBook">${ic("check", "sm")}أغلق البطاقة واعتمدها في النتاجات</button><button class="btn outline lg" id="qrRep">النتائج التفصيلية</button></div></div>`;
    document.body.appendChild(ov);
    try { await T.loadScript(QR_URL); const qr = window.qrcode(0, "M"); qr.addData(url); qr.make(); ov.querySelector("#qrC").innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); }
    catch (e) { ov.querySelector("#qrC").innerHTML = '<p class="tiny">تعذّر رسم الرمز — اكتب الرابط أعلاه أو افتح المنصة من «اختباراتي».</p>'; }
    let endsAt = null, t;
    const tick = async () => { try { const r = await T.rpc("t_exit_live", { p_exam: id }); if (!document.body.contains(ov)) return;
        endsAt = r.ends_at; ov.querySelector("#qrD").textContent = r.done + " / " + r.n; ov.querySelector("#qrS").textContent = r.started; ov.querySelector("#qrA").textContent = r.avg != null ? r.avg + "٪" : "—";
        if (r.state === "ended") ov.querySelector("#qrT").textContent = "انتهت"; } catch (e) {} };
    const clock = () => { if (!endsAt || !document.body.contains(ov)) return; const ms = new Date(endsAt) - Date.now(); if (ms > 0) ov.querySelector("#qrT").textContent = U.mmss(ms); };
    tick(); t = setInterval(tick, 4000); const c = setInterval(clock, 1000);
    const close = () => { clearInterval(t); clearInterval(c); ov.remove(); T.route(); };
    ov.querySelector(".hw-x").onclick = close;
    ov.querySelector("#qrRep").onclick = () => { close(); T.go("#exam/" + id); };
    ov.querySelector("#qrBook").onclick = async () => {
      const btn = ov.querySelector("#qrBook"); U.spin(btn, true, "جارٍ الاعتماد…");
      try { await T.rpc("t_exam_action", { p_id: id, p_action: "close_now" }); await T.rpc("t_book", { p_exam: id, p_commit: true });
        const [m, mk] = await Promise.all([T.all("mastery", "*", "created_at"), T.all("exam_marks", "*")]); S.mastery = m; S.marks = mk; B().invalidate();
        await T.refreshExams(); toast("أُغلقت بطاقة الخروج واعتُمدت في النتاجات"); close(); T.go("#exam/" + id); }
      catch (e) { U.spin(btn, false); toast(e.message, true); }
    };
  }

  // ================= زوّار القسم العام (لصاحب المنصة) =================
  const VF = { q: "", role: "all" };
  T.view("visitors", {
    title: "زوّار القسم العام", sub: () => "«تعلّم مجانًا»: من سجّل من الطلبة والمعلمين، وكم زائرًا، وماذا يستخدمون",
    async render(el) {
      el.innerHTML = T.empty("chart", "جارٍ التحميل…");
      let st, rows = [];
      let orders = [];
      try { [st, rows, orders] = await Promise.all([T.rpc("t_visitors_stats"), T.all("visitors", "id,name,phone,school,role,created_at,last_seen", "created_at"), T.q(T.sb.from("print_orders").select("*").order("created_at", { ascending: false })).catch(() => [])]); }
      catch (e) { el.innerHTML = T.empty("lock", "هذه الصفحة لصاحب المنصة فقط", esc(e.message)); return; }
      rows = rows.reverse(); const a = st.activity || {}, nf = (v) => (v == null ? "0" : Number(v).toLocaleString("ar-JO"));
      const k = (v, t, s2) => `<div class="kp"><b class="num">${nf(v)}</b><span>${t}</span>${s2 ? `<small>${s2}</small>` : ""}</div>`;
      const days = st.days || [], mx = Math.max(1, ...days.map((d) => d.visits)), W = 720, H = 200, pl = 30, pb = 26, bw = (W - pl - 8) / days.length;
      const bars = days.map((d, i) => { const h = ((H - pb - 12) * d.visits) / mx, x = pl + i * bw + 2, y = H - pb - h;
        return `<rect class="vb" data-i="${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, bw - 4).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="3"/>`; }).join("");
      const lab = (d) => new Date(d + "T00:00:00").toLocaleDateString("ar-JO", { day: "numeric", month: "short" });
      const xl = days.map((d, i) => (i % 5 === 0 || i === days.length - 1 ? `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" class="ax" text-anchor="middle">${lab(d.d)}</text>` : "")).join("");
      const yl = [0, Math.round(mx / 2), mx].map((v) => `<line x1="${pl}" x2="${W - 8}" y1="${H - pb - ((H - pb - 12) * v) / mx}" y2="${H - pb - ((H - pb - 12) * v) / mx}" class="gl"/><text x="${pl - 6}" y="${H - pb - ((H - pb - 12) * v) / mx + 4}" class="ax" text-anchor="end">${v}</text>`).join("");
      el.innerHTML = `<div class="kpi-row" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">${k(st.students, "طالبًا سجّل", "+" + nf(st.new_today) + " اليوم")}${k(st.teachers, "معلّمًا سجّل")}
          ${k(st.visits_today, "زائرًا اليوم")}${k(st.visits_7, "زائرًا في ٧ أيام")}${k(st.visits_30, "زائرًا في ٣٠ يومًا")}${k(st.visits_all, "كل الزوّار (أجهزة)")}</div>
        <div class="card pad" style="margin-top:14px"><div class="row sp wrap"><h3 style="font-size:16px">${ic("chart", "sm")} الزوّار يوميًّا — آخر ٣٠ يومًا</h3><span class="tiny">زائر = جهاز فتح القسم العام في ذلك اليوم</span></div>
          <div class="chart" id="vChart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الزوّار يوميًّا">${yl}${bars}${xl}</svg><div class="tipbox hide" id="vTip"></div></div></div>
        <div class="kpi-row" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:14px">${k(a.diag, "اختبارًا تشخيصيًّا")}${k(a.practice, "سؤال تدريب")}${k(a.sheet, "ورقة عمل طُبعت")}${k(a.video, "مشاهدة صفحة فيديو")}</div>
        <div class="g2" style="margin-top:14px"><div class="card pad"><h3 style="font-size:16px;margin-bottom:10px">${ic("users", "sm")} أكثر المدارس</h3>
            ${(st.schools || []).length ? `<div class="tw"><table class="t"><thead><tr><th>المدرسة</th><th class="num">طلبة</th><th class="num">معلمون</th></tr></thead><tbody>${st.schools.map((x) => `<tr><td>${esc(x.school)}</td><td class="num">${x.st}</td><td class="num">${x.te}</td></tr>`).join("")}</tbody></table></div>` : '<p class="tiny">لا تسجيلات بعد.</p>'}</div>
          <div class="card pad"><h3 style="font-size:16px;margin-bottom:10px">${ic("spark", "sm")} رابط القسم العام</h3><p class="tiny">شاركه في قناتك ومع زملائك:</p>
            <div class="row" style="gap:6px"><input class="input mono" id="vUrl" dir="ltr" readonly value="${esc(location.href.split("#")[0].replace(/teacher\.html.*$/, "index.html"))}"><button class="btn outline sm" id="vCopy">نسخ</button></div></div></div>
        <div class="card pad" style="margin-top:14px" id="vOrd"></div>
        <div class="card pad" style="margin-top:14px"><div class="row sp wrap"><h3 style="font-size:16px">${ic("list", "sm")} المسجّلون (${rows.length})</h3>
            <div class="row wrap" style="gap:6px"><input class="input sm" id="vQ" placeholder="بحث بالاسم أو المدرسة أو الهاتف" value="${esc(VF.q)}" style="width:220px">
              <select class="input sm" id="vR" style="width:auto">${T.opt(VF.role, [["all", "الكل"], ["student", "الطلبة"], ["teacher", "المعلمون"]])}</select>
              <button class="btn primary sm" id="vX">${ic("file", "sm")}تصدير Excel</button></div></div>
          <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>الاسم</th><th>الهاتف</th><th>المدرسة</th><th>النوع</th><th>تاريخ التسجيل</th><th>آخر زيارة</th></tr></thead><tbody id="vB"></tbody></table></div></div>`;
      // ---- طلبات الطباعة (CliQ) ----
      const vmap = {}; rows.forEach((r) => (vmap[r.id] = r));
      const C = window.APP_CONFIG || {}, RN = { sum: "التجميعي", det: "التفصيلي", checklist: "الشطب", evidence: "القياس بالأدوات", verbal: "التقدير اللفظي", marks: "العلامات", attendance: "الحضور", daily: "الرصد اليومي" };
      const subTxt = (o) => { const it = o.items || [], rc = it.filter((x) => x.startsWith("rec:")); return [rc.length >= 2 ? "كل السجلات" : rc.length ? "سجل " + (RN[rc[0].slice(4)] || "") : "", it.includes("ws") ? "أوراق العمل الاحترافية" : "", it.includes("wl") ? "الترويسة الخاصة" : "", it.includes("book") ? "الملزمة" : ""].filter(Boolean).join(" + "); };
      const ordHtml = () => { const pend = orders.filter((o) => o.status === "pending"), sumAct = orders.filter((o) => o.status === "active").reduce((a2, o) => a2 + Number(o.amount), 0);
        return `<div class="row sp wrap"><h3 style="font-size:16px">${ic("printer", "sm")} طلبات الطباعة المدفوعة</h3><span class="tiny">بانتظار التأكيد: <b>${pend.length}</b> · المُفعّل: <b>${T.nf(sumAct)}</b> دينار · الاسم المستعار CliQ: <b dir="ltr">${esc(C.CLIQ || "")}</b></span></div>
          <p class="tiny">تأكّد من وصول التحويل في تطبيق بنكك (اسم المحوِّل والمبلغ)، ثم اضغط «تفعيل» فتُفتح الطباعة عند المعلّم تلقائيًّا. الرمز الاحتياطي لمن يطبع من جهاز آخر.</p>` +
          (orders.length ? `<div class="tw"><table class="t"><thead><tr><th>#</th><th>المعلّم</th><th>الطلب</th><th class="num">المبلغ</th><th>اسم المحوِّل</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead><tbody>` + orders.map((o) => { const v = vmap[o.visitor_id] || {};
            const ph = String(v.phone || "").replace(/\D/g, ""), wa = ph ? "https://wa.me/962" + ph.slice(1) + "?text=" + encodeURIComponent("مرحبًا " + (v.name || "") + "، تم تفعيل طلبك رقم " + o.no + " على منصة السهم العلمي. يمكنك الطباعة الآن. وإن طبعت من جهاز آخر فرمز التفعيل: " + o.code) : "";
            return `<tr><td class="num">${o.no}</td><td>${esc(v.name || "—")}<div class="tiny" dir="ltr" style="text-align:right">${esc(v.phone || "")} · ${esc(v.school || "")}</div></td>
              <td>${o.kind === "sub" || o.kind === "book" ? (o.kind === "book" ? "ملزمة طالب" : "اشتراك معلّم") + ": " + esc(subTxt(o)) + "<div class='tiny'>الصفوف: " + esc((o.grades || []).slice().sort((x, y) => x - y).join("، ")) + "</div>"
                : o.kind === "wl" ? "اختبار بترويسة خاصة: " + esc(o.section) : (o.records.length === 8 ? "كل السجلات" : o.records.map((r) => RN[r] || r).join("، ")) + "<div class='tiny'>" + esc(o.section) + " · " + o.n + " طالبًا</div>"}</td>
              <td class="num"><b>${T.nf(Number(o.amount))}</b></td><td>${esc(o.payer || "—")}</td><td class="tiny">${esc(U.fmtDT(o.created_at, false))}</td>
              <td><span class="pill ${o.status === "active" ? "open" : o.status === "pending" ? "gold" : ""}">${o.status === "active" ? "مفعّل" : o.status === "pending" ? "بانتظارك" : "مرفوض"}</span><div class="tiny">رمز: <b dir="ltr">${esc(o.code)}</b></div></td>
              <td><div class="row wrap" style="gap:4px">${o.status !== "active" ? `<button class="btn primary sm" data-act="${o.id}">تفعيل</button>` : ""}${o.status === "pending" ? `<button class="btn ghost sm" data-rej="${o.id}">رفض</button>` : ""}${wa ? `<a class="btn outline sm" target="_blank" rel="noopener" href="${wa}">واتساب</a>` : ""}</div></td></tr>`; }).join("") + "</tbody></table></div>"
            : '<p class="tiny">لا طلبات بعد.</p>'); };
      const drawOrd = () => { el.querySelector("#vOrd").innerHTML = ordHtml();
        el.querySelectorAll("[data-act],[data-rej]").forEach((b) => (b.onclick = async () => { const id = b.dataset.act || b.dataset.rej, stt = b.dataset.act ? "active" : "rejected";
          try { await T.rpc("t_order_set", { p_id: id, p_status: stt }); orders.find((o) => o.id === id).status = stt; S.printPending = orders.filter((o) => o.status === "pending").length; toast(stt === "active" ? "فُعّل الطلب — أرسل للمعلّم رسالة واتساب للتأكيد" : "رُفض الطلب"); drawOrd(); }
          catch (e) { toast(e.message, true); } })); };
      drawOrd();
      const filt = () => rows.filter((r) => (VF.role === "all" || r.role === VF.role) && (!VF.q || (r.name + " " + r.school + " " + r.phone).includes(VF.q)));
      const draw = () => { const f = filt(); el.querySelector("#vB").innerHTML = f.slice(0, 300).map((r) => `<tr><td>${esc(r.name)}</td><td dir="ltr" style="text-align:right">${esc(r.phone)}</td><td>${esc(r.school)}</td>
          <td><span class="pill ${r.role === "teacher" ? "gold" : "open"}">${r.role === "teacher" ? "معلّم" : "طالب"}</span></td><td class="tiny">${esc(U.fmtDT(r.created_at, false))}</td><td class="tiny">${esc(U.ago(r.last_seen))}</td></tr>`).join("") || '<tr><td colspan="6" class="tiny">لا نتائج.</td></tr>'; };
      draw();
      el.querySelector("#vQ").oninput = (e) => { VF.q = e.target.value.trim(); draw(); };
      el.querySelector("#vR").onchange = (e) => { VF.role = e.target.value; draw(); };
      el.querySelector("#vCopy").onclick = () => { const i = el.querySelector("#vUrl"); i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand("copy"); } toast("نُسخ الرابط"); };
      el.querySelector("#vX").onclick = async () => {
        try { await T.loadScript(T.XLSX_URL); const X = window.XLSX, f = filt();
          const ws = X.utils.aoa_to_sheet([["الاسم", "الهاتف", "المدرسة", "النوع", "تاريخ التسجيل", "آخر زيارة"]].concat(f.map((r) => [r.name, r.phone, r.school, r.role === "teacher" ? "معلّم" : "طالب",
            new Date(r.created_at).toLocaleString("en-GB"), new Date(r.last_seen).toLocaleString("en-GB")])));
          ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 8 }, { wch: 20 }, { wch: 20 }]; ws["!views"] = [{ RTL: true }];
          const wb = X.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; X.utils.book_append_sheet(wb, ws, "الزوّار");
          X.writeFile(wb, "زوّار منصة السهم العلمي - " + new Date().toISOString().slice(0, 10) + ".xlsx"); toast("نُزّل ملف Excel"); }
        catch (e) { toast(e.message, true); }
      };
      const svg = el.querySelector("#vChart svg"), tip = el.querySelector("#vTip");
      svg.querySelectorAll(".vb").forEach((r) => (r.onmouseenter = () => { const d = days[+r.dataset.i], b = r.getBoundingClientRect(), s0 = svg.getBoundingClientRect();
        tip.innerHTML = `<b>${esc(lab(d.d))}</b><br>زوّار: ${d.visits}<br>تسجيل جديد: ${d.students} طالب · ${d.teachers} معلّم`; tip.classList.remove("hide");
        tip.style.left = Math.min(s0.width - 170, Math.max(0, b.left - s0.left - 70)) + "px"; tip.style.top = Math.max(0, b.top - s0.top - 70) + "px"; }));
      svg.onmouseleave = () => tip.classList.add("hide");
    }
  });

  T.learn = { quality, bankQuality, remedial, exitTicket, qrScreen };
})();
