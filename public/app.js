(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  const localDate = (d) => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0,10); };
  const monthString = (d) => localDate(d).slice(0,7);
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const money = (n) => fmt(n) + " ကျပ်";
  const categoryEmoji = {"ကိုကိုသန့်":"🧑🏻","ထိပ်ထိပ်":"👩🏻","အိမ်စရိတ်":"🏠"};
  let db = null, user = null, rows = [], authMode = "login", busy = false;

  $("expenseDate").value = localDate(today);
  $("summaryDate").value = localDate(today);
  $("monthPicker").value = monthString(today);

  function showToast(msg) {
    const el = $("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function setMessage(id, msg, good = false) {
    const el = $(id); el.textContent = msg; el.style.color = good ? "#5b8557" : "#ad6376";
  }
  function setBusy(value) {
    busy = value;
    $("authSubmit").disabled = value;
    $("authSubmit").textContent = value ? "ခဏစောင့်ပါနော်…" : (authMode === "login" ? "အကောင့်ဝင်မယ် ♡" : "အကောင့်ဖွင့်မယ် ♡");
  }
  function renderAuth() {
    $("authCard").classList.toggle("hidden", !!user || !db);
    $("appContent").classList.toggle("hidden", !user);
    $("logoutBtn").classList.toggle("hidden", !user);
    $("toggleAuth").textContent = authMode === "login" ? "အကောင့်အသစ် ဖွင့်မယ်" : "အကောင့်ရှိပြီးသားလား။ အကောင့်ဝင်မယ်";
    $("authSubmit").textContent = authMode === "login" ? "အကောင့်ဝင်မယ် ♡" : "အကောင့်ဖွင့်မယ် ♡";
  }
  async function init() {
    try {
      const response = await fetch("/config", {cache:"no-store"});
      const config = await response.json();
      if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
        $("setupNotice").classList.remove("hidden");
        $("authCard").classList.add("hidden");
        return;
      }
      db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      const {data, error} = await db.auth.getSession();
      if (error) throw error;
      user = data.session?.user || null;
      renderAuth();
      db.auth.onAuthStateChange((_event, session) => {
        user = session?.user || null;
        renderAuth();
        if (user) setTimeout(loadExpenses, 0);
        else rows = [];
      });
      if (user) await loadExpenses();
    } catch (err) {
      $("setupNotice").classList.remove("hidden");
      setMessage("authMessage", "ချိတ်ဆက်မှု မအောင်မြင်ပါ။ Supabase URL နဲ့ key ကို ပြန်စစ်ပေးပါ။");
      console.error(err);
    }
  }

  $("toggleAuth").addEventListener("click", () => {
    authMode = authMode === "login" ? "signup" : "login";
    $("password").setAttribute("autocomplete", authMode === "login" ? "current-password" : "new-password");
    setMessage("authMessage", "");
    renderAuth();
  });

  $("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db || busy) return;
    const email = $("email").value.trim(), password = $("password").value;
    setBusy(true); setMessage("authMessage", "");
    try {
      if (authMode === "signup") {
        const {data, error} = await db.auth.signUp({email, password});
        if (error) throw error;
        if (data.session) {
          user = data.session.user; renderAuth(); await loadExpenses();
          setMessage("authMessage", "အကောင့်ဖွင့်ပြီးပါပြီ။", true);
        } else {
          setMessage("authMessage", "အကောင့်ဖွင့်ပြီးပါပြီ။ Email ထဲက အတည်ပြု link ကိုနှိပ်ပြီးမှ အကောင့်ဝင်ပါ။", true);
        }
      } else {
        const {error} = await db.auth.signInWithPassword({email, password});
        if (error) throw error;
      }
    } catch (err) {
      setMessage("authMessage", friendlyError(err));
    } finally { setBusy(false); }
  });

  function friendlyError(err) {
    const m = String(err?.message || "");
    if (/Invalid login credentials/i.test(m)) return "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ။";
    if (/User already registered/i.test(m)) return "ဒီအီးမေးလ်နဲ့ အကောင့်ရှိပြီးသားပါ။ အကောင့်ဝင်ကြည့်ပါ။";
    if (/Email not confirmed/i.test(m)) return "Email အတည်ပြုဖို့ လိုနေသေးတယ်။ Inbox ကို စစ်ပေးပါ။";
    if (/Failed to fetch/i.test(m)) return "အင်တာနက် သို့မဟုတ် Supabase URL ကို စစ်ပေးပါ။";
    return m || "တစ်ခုခုမှားနေပါတယ်။ ထပ်ကြိုးစားကြည့်ပါ။";
  }

  $("logoutBtn").addEventListener("click", async () => {
    if (db) await db.auth.signOut();
    user = null; rows = []; renderAuth(); showToast("အကောင့်ထွက်ပြီးပါပြီ။");
  });

  $("expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    const category = button?.dataset?.category;
    if (!category || !db || !user) return;
    const amount = Number($("amount").value);
    const date = $("expenseDate").value;
    const note = $("note").value.trim();
    if (!Number.isFinite(amount) || amount <= 0 || !date) {
      setMessage("expenseMessage", "ရက်စွဲနဲ့ သုညထက်ကြီးတဲ့ အမောင့်ကို ဖြည့်ပေးပါ။"); return;
    }
    document.querySelectorAll(".category-btn").forEach(b => b.disabled = true);
    setMessage("expenseMessage", "စာရင်းသိမ်းနေပါတယ်…", true);
    try {
      const {data, error} = await db.from("expenses").insert({owner_id:user.id, expense_date:date, amount:Math.round(amount), note:note || null, category}).select().single();
      if (error) throw error;
      rows.push(data);
      $("amount").value = ""; $("note").value = "";
      $("summaryDate").value = date; $("monthPicker").value = date.slice(0,7);
      renderAll(); setMessage("expenseMessage", "စာရင်းသိမ်းပြီးပါပြီ 💗", true); showToast(category + " စာရင်းထဲ သိမ်းပြီးပါပြီ!");
    } catch (err) {
      console.error(err); setMessage("expenseMessage", friendlyError(err) + " (Supabase SQL/RLS ကို စစ်ပါ။)");
    } finally { document.querySelectorAll(".category-btn").forEach(b => b.disabled = false); }
  });

  async function loadExpenses() {
    if (!db || !user) return;
    $("records").innerHTML = '<div class="empty-state"><span>🧺</span><p>စာရင်းတွေ ယူနေပါတယ်…</p></div>';
    try {
      const {data, error} = await db.from("expenses").select("id,owner_id,expense_date,amount,note,category,created_at").eq("owner_id", user.id).order("expense_date", {ascending:false}).order("created_at", {ascending:false}).limit(5000);
      if (error) throw error;
      rows = data || []; renderAll();
    } catch (err) {
      console.error(err);
      $("records").innerHTML = '<div class="empty-state"><span>🌧️</span><p>စာရင်းမဖတ်နိုင်သေးပါ။ README ထဲက SQL ကို run လုပ်ထားသလား စစ်ပေးပါ။</p></div>';
    }
  }

  async function deleteExpense(id) {
    if (!confirm("ဒီစာရင်းကို ဖျက်မှာ သေချာပြီလား။")) return;
    const {error} = await db.from("expenses").delete().eq("id", id).eq("owner_id", user.id);
    if (error) { showToast("ဖျက်မရပါ။ ထပ်စစ်ပေးပါ။"); return; }
    rows = rows.filter(r => r.id !== id); renderAll(); showToast("စာရင်းဖျက်ပြီးပါပြီ။");
  }

  async function editExpense(row) {
    const rawAmount = prompt("အမောင့်အသစ် (ကျပ်) ထည့်ပါ", String(row.amount));
    if (rawAmount === null) return;
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) { showToast("အမောင့် မှန်မှန်ထည့်ပေးပါ။"); return; }
    const note = prompt("မှတ်ချက် ပြင်ရန်", row.note || "");
    if (note === null) return;
    const {data, error} = await db.from("expenses").update({amount:Math.round(amount), note:note.trim() || null}).eq("id", row.id).eq("owner_id", user.id).select().single();
    if (error) { showToast("ပြင်ဆင်မရပါ။"); return; }
    rows = rows.map(r => r.id === row.id ? data : r); renderAll(); showToast("ပြင်ဆင်ပြီးပါပြီ။");
  }

  function sum(list, category) { return list.filter(r => !category || r.category === category).reduce((total,r) => total + Number(r.amount || 0), 0); }
  function renderTotals() {
    const date = $("summaryDate").value || localDate(today);
    const day = rows.filter(r => r.expense_date === date);
    $("todayTotal").textContent = money(sum(day));
    $("todayKoko").textContent = fmt(sum(day,"ကိုကိုသန့်"));
    $("todayHti").textContent = fmt(sum(day,"ထိပ်ထိပ်"));
    $("todayHome").textContent = fmt(sum(day,"အိမ်စရိတ်"));
    const month = $("monthPicker").value || monthString(today);
    const monthRows = rows.filter(r => r.expense_date.startsWith(month));
    $("monthTotal").textContent = money(sum(monthRows));
    $("monthKoko").textContent = money(sum(monthRows,"ကိုကိုသန့်"));
    $("monthHti").textContent = money(sum(monthRows,"ထိပ်ထိပ်"));
    $("monthHome").textContent = money(sum(monthRows,"အိမ်စရိတ်"));
    $("monthGrand").textContent = money(sum(monthRows));
    $("recordsTitle").textContent = date === localDate(today) ? "ဒီနေ့ မှတ်တမ်းများ" : date + " မှတ်တမ်းများ";
  }

  function renderRecords() {
    const date = $("summaryDate").value || localDate(today);
    const list = rows.filter(r => r.expense_date === date).slice().sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
    const root = $("records");
    if (!list.length) {
      root.innerHTML = '<div class="empty-state"><span>🧺</span><p>ဒီနေ့ စာရင်းမရှိသေးဘူးနော်။</p><p>အပေါ်ကနေ ပထမဆုံးစာရင်းလေး ထည့်လိုက်ပါ 💗</p></div>'; return;
    }
    root.innerHTML = "";
    list.forEach(row => {
      const item = document.createElement("article"); item.className = "record";
      const emoji = document.createElement("span"); emoji.className = "record-emoji"; emoji.textContent = categoryEmoji[row.category] || "🧾";
      const main = document.createElement("div"); main.className = "record-main";
      const top = document.createElement("div"); top.className = "record-top";
      const name = document.createElement("span"); name.className = "record-name"; name.textContent = row.category;
      const amount = document.createElement("strong"); amount.className = "record-amount"; amount.textContent = money(row.amount);
      top.append(name, amount);
      const note = document.createElement("div"); note.className = "record-note"; note.textContent = row.note || "မှတ်ချက်မရှိပါ";
      const dateEl = document.createElement("div"); dateEl.className = "record-date"; dateEl.textContent = row.expense_date;
      const actions = document.createElement("div"); actions.className = "record-actions";
      const edit = document.createElement("button"); edit.className = "mini-btn"; edit.type = "button"; edit.textContent = "ပြင်မယ်"; edit.addEventListener("click", () => editExpense(row));
      const del = document.createElement("button"); del.className = "mini-btn"; del.type = "button"; del.textContent = "ဖျက်မယ်"; del.addEventListener("click", () => deleteExpense(row.id));
      actions.append(edit,del); main.append(top,note,dateEl,actions); item.append(emoji,main); root.append(item);
    });
  }

  function renderAll() { renderTotals(); renderRecords(); }
  $("summaryDate").addEventListener("change", renderAll);
  $("monthPicker").addEventListener("change", renderTotals);
  init();
})();
