/* Main.js — UI behavior, payment flow, key management and ban checks (demo client-side) */
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const storeKey = "zcorp_portal_data";

/* Initialize or load local demo store:
   structure: { bugs:[], appeals:[], keys:[] } */
let data = JSON.parse(localStorage.getItem(storeKey) || '{"bugs":[],"appeals":[],"keys":[]}');

function save() { localStorage.setItem(storeKey, JSON.stringify(data)); }
function id(prefix) { return prefix + "-" + Math.random().toString(36).slice(2,8).toUpperCase(); }
function page(name) { $$(".page").forEach(x => x.classList.toggle("active", x.id === name)); window.scrollTo({top:0,behavior:"smooth"}); }

/* Navigation */
$$("[data-page]").forEach(b => b.addEventListener("click", () => page(b.dataset.page)));
$("#adminBtn").onclick = () => page("admin");

/* Copy pay number */
$("#copyPay").onclick = async () => {
  try {
    await navigator.clipboard.writeText("9066760078");
    $("#copyPay").textContent = "COPIED ✓";
    setTimeout(()=>$("#copyPay").textContent="COPY NUMBER",2000);
  } catch {
    alert("Copy failed. Number: 9066760078");
  }
};

/* Ensure keys from Pins.js are loaded into local data.keys on first run */
function ensureKeysLoaded() {
  if (!data.keys || data.keys.length === 0) {
    data.keys = [];
    if (window.ZCORP_PINS && Array.isArray(ZCORP_PINS.accessKeys)) {
      ZCORP_PINS.accessKeys.forEach(k => {
        let plan = "ONE-TIME", price = 2500, expiresIn = 0;
        if (k.includes("-WK-")) { plan = "WEEKLY"; price = 9000; expiresIn = 7; }
        else if (k.includes("-MO-")) { plan = "MONTHLY"; price = 29000; expiresIn = 30; }
        else if (k.includes("-YR-")) { plan = "YEARLY"; price = 145000; expiresIn = 365; }
        else { plan = "ONE-TIME"; price = 2500; expiresIn = 0; }
        data.keys.push({ key: k, plan, price, uses: plan === "ONE-TIME" ? 1 : Infinity, status: "ACTIVE", issuedAt: null, expiresAt: null });
      });
      save();
    }
  }
}
ensureKeysLoaded();

/* Payment modal */
function showPaymentModal() {
  // Build modal HTML
  const owner = (window.ZCORP_PINS && ZCORP_PINS.owner) ? ZCORP_PINS.owner : { name: "Owner Zeus", phone: "+2349066760078" };
  const resellers = (window.ZCORP_PINS && ZCORP_PINS.resellers) ? ZCORP_PINS.resellers : [];

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-body">
      <h3>Select Access Plan</h3>
      <div class="plans">
        <button class="plan" data-plan="ONE-TIME" data-price="2500">One-time • ₦2,500</button>
        <button class="plan" data-plan="WEEKLY" data-price="9000">Weekly • ₦9,000</button>
        <button class="plan" data-plan="MONTHLY" data-price="29000">Monthly • ₦29,000</button>
        <button class="plan" data-plan="YEARLY" data-price="145000">Yearly • ₦145,000</button>
      </div>

      <div class="acct">Pay to: <b>9066760078</b> (OPay) • <small>CHRISTANA Godwin okon</small></div>

      <div class="resellers">
        <div class="muted">Contact owner or reseller on WhatsApp:</div>
        <div class="row reseller-buttons"></div>
      </div>

      <div class="actions" style="margin-top:12px">
        <button id="paidBtn" class="gold">I'VE PAID</button>
        <button id="cancelModal" class="outline">CANCEL</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // add reseller buttons
  const container = modal.querySelector(".reseller-buttons");
  const addWA = (name, phone) => {
    const btn = document.createElement("button");
    btn.className = "outline";
    btn.textContent = `${name} • ${phone}`;
    btn.onclick = () => {
      const msg = `I want to buy access - please assist.`;
      window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, "_blank");
    };
    container.appendChild(btn);
  };
  addWA("Owner", owner.phone);
  resellers.forEach(r => addWA(r.name, r.phone));

  // plan selection
  modal.querySelectorAll(".plan").forEach(b => b.onclick = () => {
    modal.querySelectorAll(".plan").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
  });

  modal.querySelector("#cancelModal").onclick = () => modal.remove();

  modal.querySelector("#paidBtn").onclick = async () => {
    const sel = modal.querySelector(".plan.selected");
    if (!sel) { alert("Select a plan first"); return; }
    const plan = sel.dataset.plan, price = sel.dataset.price;
    sel.textContent = "Processing…";
    modal.querySelector("#paidBtn").disabled = true;

    // Wait 60s showing loading
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "loading";
    loadingMsg.textContent = "Please wait, verifying payment (automatically opens WhatsApp after 60s)…";
    modal.querySelector(".modal-body").appendChild(loadingMsg);

    await new Promise(r => setTimeout(r, 60000));

    // Open owner WhatsApp with prefilled message
    const waMsg = `I paid ₦${price} for ${plan} access. Receipt attached. Please issue my access code.`;
    window.open(`https://wa.me/${owner.phone.replace(/\D/g,'')}?text=${encodeURIComponent(waMsg)}`, "_blank");

    // Prompt for the access code owner will send after confirming receipt
    const code = prompt("Paste the access code you received from the owner here:");
    if (!code) {
      alert("No code entered. If you already received a code later, paste it into the Access page.");
      modal.remove();
      return;
    }

    const found = data.keys.find(k => k.key === code.trim().toUpperCase() && k.status === "ACTIVE");
    if (!found) {
      alert("Code not recognized or inactive. Ask the owner to send a valid code.");
      modal.remove();
      return;
    }

    // Activate the key locally
    found.issuedAt = new Date().toISOString();
    if (found.plan === "ONE-TIME") {
      found.expiresAt = "ONE-TIME";
    } else {
      const days = found.plan === "WEEKLY" ? 7 : (found.plan === "MONTHLY" ? 30 : 365);
      found.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    save();
    alert("Code activated locally. Use it on the Access page to login.");
    modal.remove();
  };
}

/* Wire home CTA and Access page pay button */
$("#openPay") && $("#openPay").addEventListener("click", showPaymentModal);
$("#showPayFromAccess") && $("#showPayFromAccess").addEventListener("click", showPaymentModal);
$("#openOwnerChat") && $("#openOwnerChat").setAttribute("href", `https://wa.me/${(ZCORP_PINS.owner.phone||'+2349066760078').replace(/\D/g,'')}`);

/* Login with key */
$("#loginBtn").onclick = () => {
  const key = $("#keyInput").value.trim().toUpperCase();
  const r = $("#loginResult");
  if (!key) { r.innerHTML = '<div class="error">ENTER AN ACCESS KEY.</div>'; return; }
  const found = data.keys.find(k => k.key === key && k.status === "ACTIVE");
  if (!found) { r.innerHTML = '<div class="error">INVALID OR INACTIVE ACCESS KEY.</div>'; return; }

  // check expiry for dated keys
  if (found.expiresAt && found.expiresAt !== "ONE-TIME") {
    if (new Date(found.expiresAt) < new Date()) { r.innerHTML = '<div class="error">KEY HAS EXPIRED.</div>'; return; }
  }

  // consume one-time use
  if (found.uses === 1) {
    found.status = "USED";
  }

  sessionStorage.setItem("zcorpAccess", "1");
  sessionStorage.setItem("zcorpKey", found.key);
  save();

  r.innerHTML = `<div class="success">ACCESS GRANTED • ${found.plan} • ${found.expiresAt || '—'}</div>`;
  setTimeout(() => showDashboard(found.key), 700);
};

/* Dashboard display */
function showDashboard(key) {
  const found = data.keys.find(k => k.key === key);
  if (!found) return page("access");
  page("dashboard");
  renderUserKey(found);
  startCountdown(found);
}

/* Render user key info */
function renderUserKey(k) {
  const info = $("#userKeyInfo");
  const issued = k.issuedAt ? new Date(k.issuedAt).toLocaleString() : "Not issued";
  let expires = k.expiresAt === "ONE-TIME" ? "One-time use" : (k.expiresAt ? new Date(k.expiresAt).toLocaleString() : "N/A");
  info.innerHTML = `
    <div><b>${k.key}</b></div>
    <div class="muted">${k.plan} • ₦${k.price.toLocaleString()}</div>
    <div>Issued: ${issued}</div>
    <div>Expires: ${expires}</div>
  `;
}

/* Countdown timer for dashboard */
let countdownInterval = null;
function startCountdown(k) {
  clearInterval(countdownInterval);
  const el = $("#countdown");
  if (!k.expiresAt || k.expiresAt === "ONE-TIME") {
    el.textContent = k.expiresAt === "ONE-TIME" ? "This code expires after one use." : "No expiry";
    return;
  }
  function update() {
    const now = Date.now();
    const exp = new Date(k.expiresAt).getTime();
    const diff = exp - now;
    if (diff <= 0) {
      el.textContent = "EXPIRED";
      clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hrs = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    el.textContent = `Expires in ${days}d ${hrs}h ${mins}m ${secs}s`;
  }
  update();
  countdownInterval = setInterval(update, 1000);
}

/* Logout */
$("#logoutBtn") && ($("#logoutBtn").onclick = () => {
  sessionStorage.removeItem("zcorpAccess");
  sessionStorage.removeItem("zcorpKey");
  page("home");
});

/* Ban checker with 20s load + auto WhatsApp on success */
$("#checkBan").onclick = async () => {
  const q = $("#banSearch").value.trim();
  const r = $("#banResult");
  if (!q) { r.innerHTML = '<div class="error">ENTER A BAN ID, USER ID OR PHONE.</div>'; return; }
  r.innerHTML = '<div class="loading">Checking ban status — please wait (20s)…</div>';
  await new Promise(res => setTimeout(res, 20000));

  // Demo logic: random true/false
  const banned = Math.random() < 0.4; // 40% chance banned
  if (banned) {
    r.innerHTML = `<div class="error"><b>BANNED</b><br>Query: ${q}<br>Action required: Appeal or contact owner.</div>`;
    // Open owner WhatsApp summary automatically (user agent will open new tab)
    const ownerPhone = (ZCORP_PINS && ZCORP_PINS.owner && ZCORP_PINS.owner.phone) ? ZCORP_PINS.owner.phone : "+2349066760078";
    const msg = `Lookup result for ${q}: BANNED — please review.`;
    try { window.open(`https://wa.me/${ownerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, "_blank"); } catch(e){}
  } else {
    r.innerHTML = `<div class="success"><b>CLEAR</b><br>Query: ${q}</div>`;
    const ownerPhone = (ZCORP_PINS && ZCORP_PINS.owner && ZCORP_PINS.owner.phone) ? ZCORP_PINS.owner.phone : "+2349066760078";
    const msg = `Lookup result for ${q}: CLEAR.`;
    try { window.open(`https://wa.me/${ownerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, "_blank"); } catch(e){}
  }
};

/* Simulate ban/unban quick buttons (demo) */
$("#simulateBan") && ($("#simulateBan").onclick = async () => {
  $("#banResult").innerHTML = '<div class="loading">Running ban flow (20s)…</div>';
  await new Promise(res => setTimeout(res,20000));
  $("#banResult").innerHTML = '<div class="success">BAN SUCCESS • Record updated. Owner notified.</div>';
  // notify owner
  const ownerPhone = (ZCORP_PINS && ZCORP_PINS.owner && ZCORP_PINS.owner.phone) ? ZCORP_PINS.owner.phone : "+2349066760078";
  window.open(`https://wa.me/${ownerPhone.replace(/\D/g,'')}?text=${encodeURIComponent('A ban action completed — please check.')}`, "_blank");
});
$("#simulateUnban") && ($("#simulateUnban").onclick = async () => {
  $("#banResult").innerHTML = '<div class="loading">Running unban flow (20s)…</div>';
  await new Promise(res => setTimeout(res,20000));
  $("#banResult").innerHTML = '<div class="success">UNBAN SUCCESS • Record updated. Owner notified.</div>';
  const ownerPhone = (ZCORP_PINS && ZCORP_PINS.owner && ZCORP_PINS.owner.phone) ? ZCORP_PINS.owner.phone : "+2349066760078";
  window.open(`https://wa.me/${ownerPhone.replace(/\D/g,'')}?text=${encodeURIComponent('An unban action completed — please check.')}`, "_blank");
});

/* Bug form */
$("#bugForm").onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), b = Object.fromEntries(f.entries());
  b.id = id("ZBUG"); b.status = "OPEN"; b.created = new Date().toLocaleString();
  data.bugs.unshift(b); save(); e.target.reset();
  $("#bugResult").innerHTML = `<div class="success">BUG REPORT CREATED<br><b>${b.id}</b> • Status: OPEN</div>`;
  adminRefresh();
};

/* Bug lookup */
$("#lookupBug").onclick = () => {
  const key = ($("#bugId").value || "").trim().toUpperCase();
  const x = data.bugs.find(b => b.id === key);
  $("#bugLookupResult").innerHTML = x ? `<div class="info"><b>${x.id}</b><br>Status: ${x.status}<br>Category: ${x.category}<br>Created: ${x.created}</div>` : '<div class="error">BUG REPORT NOT FOUND.</div>';
};

/* Appeal form */
$("#appealForm").onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), a = Object.fromEntries(f.entries());
  a.id = id("ZAPP"); a.status = "PENDING"; a.created = new Date().toLocaleString();
  data.appeals.unshift(a); save(); e.target.reset();
  $("#appealResult").innerHTML = `<div class="success">APPEAL SUBMITTED<br><b>${a.id}</b> • Status: PENDING</div>`;
  adminRefresh();
};

/* Admin pin unlock */
$("#pinBtn").onclick = () => {
  const r = $("#pinResult");
  if ($("#pinInput").value === (ZCORP_PINS && ZCORP_PINS.adminPin || "ZCORP2026")) {
    $("#adminGate").classList.add("hidden");
    $("#adminConsole").classList.remove("hidden");
    adminRefresh();
  } else r.innerHTML = '<div class="error">INVALID ADMIN PIN.</div>';
};

/* Admin refresh */
function adminRefresh() {
  if (!$("#adminConsole") || $("#adminConsole").classList.contains("hidden")) return;
  $("#bugCount").textContent = data.bugs.length;
  $("#appealCount").textContent = data.appeals.length;
  $("#keyCount").textContent = data.keys.length;

  $("#adminReports").innerHTML = data.bugs.slice(0,8).map(b => `<div class="report"><b>${b.id}</b> — ${b.category} — ${b.severity}<br><small>${b.status} • ${b.created}</small></div>`).join("") || '<div class="muted">No reports</div>';

  // show codes: 20 per type grouped
  const codesHtml = data.keys.map(k => `<div class="code ${k.status.toLowerCase()}"><b>${k.key}</b><span style="margin-left:8px;color:var(--muted);font-size:12px">${k.plan}${k.expiresAt ? ' • ' + (k.expiresAt === 'ONE-TIME' ? 'One-use' : new Date(k.expiresAt).toLocaleDateString()) : ''}</span></div>`).join("");
  $("#generatedKey").innerHTML = `<div class="codes">${codesHtml}</div>`;
}

/* Generate key (demo only) */
$("#generateKey").onclick = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let raw = "";
  for (let i=0;i<12;i++) raw += chars[Math.floor(Math.random()*chars.length)];
  const key = "ZCORP-" + raw.slice(0,4) + "-" + raw.slice(4,8) + "-" + raw.slice(8);
  const k = { key, plan: "MANUAL", price: 0, uses: Infinity, status: "ACTIVE", issuedAt: new Date().toISOString(), expiresAt: null };
  data.keys.push(k); save(); adminRefresh();
  alert("Demo key generated: " + key);
};

/* Download bugs JSON */
$("#downloadReport").onclick = () => {
  const blob = new Blob([JSON.stringify(data.bugs, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "zcorp-bugs.json"; a.click();
  URL.revokeObjectURL(url);
};

/* On load - restore session (if user logged in) */
window.addEventListener("load", () => {
  if (sessionStorage.getItem("zcorpAccess") === "1") {
    const key = sessionStorage.getItem("zcorpKey");
    if (key) showDashboard(key);
  }
  adminRefresh();

  // wire main "Get Access" button to open modal
  $("#openPay") && ($("#openPay").onclick = showPaymentModal);
});
