/*
  Main UI and behavior for ZCORP Ban Portal
  - Adds neon-gold UI tweaks, payment flow wiring, ban/unban animations, timers and expiry logic for keys.
  - NOTE: This is still frontend-only demo logic; real payments and secure key issuance must be server-side.
*/
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const storeKey="zcorp_portal_data";
let data=JSON.parse(localStorage.getItem(storeKey)||'{"bugs":[],"appeals":[],"keys":[]}');

function save(){localStorage.setItem(storeKey,JSON.stringify(data))}
function id(prefix){return prefix+"-"+Math.random().toString(36).slice(2,8).toUpperCase()}
function page(name){$$(".page").forEach(x=>x.classList.toggle("active",x.id===name));window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("#adminBtn").onclick=()=>page("admin");

$("#copyPay").onclick=async()=>{try{await navigator.clipboard.writeText("9066760078");$("#copyPay").textContent="COPIED ✓"}catch{alert("Copy failed. Number: 9066760078")}};

// Build store of keys from Pins.js if not yet loaded
if(!data.keys || data.keys.length===0){
  data.keys = [];
  if(window.ZCORP_PINS && Array.isArray(ZCORP_PINS.accessKeys)){
    ZCORP_PINS.accessKeys.forEach(k=>{
      let plan="ONE-TIME", price=2500, expiresIn=0;
      if(k.includes("-WK-")) {plan="WEEKLY"; price=9000; expiresIn=7}
      else if(k.includes("-MO-")) {plan="MONTHLY"; price=29000; expiresIn=30}
      else if(k.includes("-YR-")) {plan="YEARLY"; price=145000; expiresIn=365}
      else {plan="ONE-TIME"; price=2500; expiresIn=0}
      data.keys.push({key:k,plan,price,uses: plan==="ONE-TIME"?1:Infinity,status:"ACTIVE",issuedAt:null,expiresIn})
    })
    save();
  }
}

// UI: payment selection modal (simple in-page flow)
function showPaymentOptions(){
  const html=`<div class="modal">
    <div class="modal-body neon">
      <h3>Select Access Plan</h3>
      <div class="plans">
        <button class="plan" data-plan="ONE-TIME" data-price="2500">One-time • ₦2,500</button>
        <button class="plan" data-plan="WEEKLY" data-price="9000">Weekly • ₦9,000</button>
        <button class="plan" data-plan="MONTHLY" data-price="29000">Monthly • ₦29,000</button>
        <button class="plan" data-plan="YEARLY" data-price="145000">Yearly • ₦145,000</button>
      </div>
      <div class="acct">Pay to: <b>9066760078</b> (OPay) • <small>CHRISTANA Godwin okon</small></div>
      <div class="actions"><button id="paidBtn" class="gold">I'VE PAID</button> <button id="closeModal">CANCEL</button></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  document.querySelectorAll('.modal .plan').forEach(b=>b.onclick=()=>document.querySelectorAll('.modal .plan').forEach(x=>x.classList.toggle('selected',x===b)));
  document.getElementById('closeModal').onclick=()=>document.querySelectorAll('.modal').forEach(m=>m.remove());

  document.getElementById('paidBtn').onclick=async()=>{
    const sel=document.querySelector('.modal .plan.selected');
    if(!sel){alert('Select a plan first');return}
    const price=sel.dataset.price, plan=sel.dataset.plan;
    // show loading for 60s then open whatsapp with message
    sel.textContent='Processing…';
    document.getElementById('paidBtn').disabled=true;
    await new Promise(r=>setTimeout(r,60000));
    // open WhatsApp to owner with template message
    const msg=`I paid ₦${price} for ${plan} access. Receipt attached. Please issue my access code.`;
    window.open('https://wa.me/2349066760078?text='+encodeURIComponent(msg),'_blank');
    // ask for code input
    const code=prompt('Paste the access code you received from owner here');
    if(code){
      // mark code as issued/activated locally if it matches one of the pre-generated
      const found=data.keys.find(k=>k.key===code.trim().toUpperCase());
      if(found){
        found.issuedAt=new Date().toISOString();
        if(found.expiresIn>0){
          found.expires=new Date(Date.now()+found.expiresIn*24*60*60*1000).toISOString();
        } else found.expires='ONE-TIME';
        save();
        alert('Code accepted. You can now login with your key.');
        document.querySelectorAll('.modal').forEach(m=>m.remove());
      } else alert('Code not recognized. Ask owner to send the correct code.');
    }
  }
}

// Attach payment flow to home and access page
$$('.actions .gold[data-page="access"]').forEach(b=>b.onclick=()=>showPaymentOptions());

$("#loginBtn").onclick=()=>{
 const key=$("#keyInput").value.trim().toUpperCase();
 const found=data.keys.find(k=>k.key===key && k.status==="ACTIVE");
 const r=$("#loginResult");
 if(!key){r.innerHTML='<div class="error">ENTER AN ACCESS KEY.</div>';return}
 if(found){
   // check expiry
   if(found.expires && found.expires!=='ONE-TIME'){
     if(new Date(found.expires) < new Date()){r.innerHTML='<div class="error">KEY HAS EXPIRED.</div>';return}
   }
   // consume one-time uses
   if(found.uses===1){found.status='USED'}
   sessionStorage.setItem("zcorpAccess","1");
   sessionStorage.setItem('zcorpKey',found.key);
   r.innerHTML='<div class="success">ACCESS GRANTED • '+found.plan+' • '+(found.expires||'—')+'</div>';
   setTimeout(()=>page('admin'),800);
 } else r.innerHTML='<div class="error">INVALID OR INACTIVE ACCESS KEY.</div>';
};

// Ban checker with animations and 20s loading
$("#checkBan").onclick=async()=>{
  const q=$("#banSearch").value.trim();const r=$("#banResult");
  if(!q){r.innerHTML='<div class="error">ENTER A BAN ID, USER ID OR PHONE.</div>';return}
  r.innerHTML='<div class="loading">Checking…</div>';
  await new Promise(r=>setTimeout(r,20000));
  // simple demo result
  const banned=Math.random()>0.5;
  r.innerHTML=`<div class="success">${banned? 'BANNED' : 'NO ACTIVE BANS'}<br>Query: ${q}</div>`;
  // auto-send to whatsapp owner
  const summary=`Lookup:${q} Result:${banned? 'BANNED':'CLEAR'}`;
  navigator.sendBeacon && navigator.sendBeacon('https://example.com/wh?m='+encodeURIComponent(summary));
}

// Bug form
$("#bugForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target), b=Object.fromEntries(f.entries());b.id=id('ZBUG');b.status='OPEN';b.created=new Date().toLocaleString();data.bugs.unshift(b);save();e.target.reset();$("#bugResult").innerHTML=`<div class="success">BUG REPORT CREATED<br><b>${b.id}</b> • Status: OPEN</div>`;adminRefresh();}

$("#lookupBug").onclick=()=>{const x=data.bugs.find(b=>b.id===(($("#bugId").value||"").trim().toUpperCase()));$("#bugLookupResult").innerHTML=x?`<div class="info"><b>${x.id}</b><br>Status: ${x.status}<br>Category: ${x.category}<br>Created: ${x.created}</div>`:'<div class="error">BUG REPORT NOT FOUND.</div>'}

// Appeals
$("#appealForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target), a=Object.fromEntries(f.entries());a.id=id('ZAPP');a.status='PENDING';a.created=new Date().toLocaleString();data.appeals.unshift(a);save();e.target.reset();$("#appealResult").innerHTML=`<div class="success">APPEAL SUBMITTED<br><b>${a.id}</b> • Status: PENDING</div>`;adminRefresh();}

// Admin pin
$("#pinBtn").onclick=()=>{const r=$("#pinResult");if($("#pinInput").value===ZCORP_PINS.adminPin){$("#adminGate").classList.add('hidden');$("#adminConsole").classList.remove('hidden');adminRefresh();}else r.innerHTML='<div class="error">INVALID ADMIN PIN.</div>'}

function adminRefresh(){
 if(!$("#adminConsole")||$("#adminConsole").classList.contains('hidden'))return;
 $("#bugCount").textContent=data.bugs.length;$("#appealCount").textContent=data.appeals.length;$("#keyCount").textContent=data.keys.length;
 $("#adminReports").innerHTML=data.bugs.slice(0,8).map(b=>`<div class="report"><b>${b.id}</b> — ${b.category} — ${b.severity}<br><small>${b.status} • ${b.created}</small></div>`).join('')||'<div class="muted">No reports</div>';
 // show available codes (20 each type) when admin logged in
 const codes=data.keys.slice(0,60).map(k=>`<div class="code ${k.status.toLowerCase()}"><b>${k.key}</b><span>${k.plan}</span></div>`).join('');
 const codePanel=document.getElementById('generatedKey');codePanel.innerHTML=`<div class="codes">${codes}</div>`;
}

$("#generateKey").onclick=()=>{alert('Server-side key generation required for production. Using pre-generated keys for demo.');}

// Small UI tweak: neon/gold ambient
(function addAmbient(){const a=document.querySelector('.ambient');if(a)a.style.boxShadow='0 0 80px 20px rgba(255,215,0,0.08) inset';})();

adminRefresh();
