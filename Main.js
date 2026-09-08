const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const storeKey="zcorp_portal_data";
let data=JSON.parse(localStorage.getItem(storeKey)||'{"bugs":[],"appeals":[],"keys":[]}');

function save(){localStorage.setItem(storeKey,JSON.stringify(data))}
function id(prefix){return prefix+"-"+Math.random().toString(36).slice(2,8).toUpperCase()}
function page(name){$$(".page").forEach(x=>x.classList.toggle("active",x.id===name));window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("#adminBtn").onclick=()=>page("admin");

$("#copyPay").onclick=async()=>{try{await navigator.clipboard.writeText("9066760078");$("#copyPay").textContent="COPIED ✓"}catch{alert("Copy failed. Number: 9066760078")}};

$("#loginBtn").onclick=()=>{
 const key=$("#keyInput").value.trim().toUpperCase();
 const found=data.keys.find(k=>k.key===key && k.status==="ACTIVE");
 const r=$("#loginResult");
 if(!key){r.innerHTML='<div class="error">ENTER AN ACCESS KEY.</div>';return}
 if(found){sessionStorage.setItem("zcorpAccess","1");r.innerHTML='<div class="success">ACCESS GRANTED • '+found.plan+' • '+found.expires+'</div>';setTimeout(()=>page("admin"),500)}
 else r.innerHTML='<div class="error">INVALID OR INACTIVE ACCESS KEY.</div>';
};

$("#checkBan").onclick=()=>{
 const q=$("#banSearch").value.trim().toLowerCase(), r=$("#banResult");
 if(!q){r.innerHTML='<div class="error">ENTER A BAN ID, USER ID OR PHONE.</div>';return}
 const demo=[{id:"BAN-ZC-001",user:"Example User",status:"UNDER REVIEW",reason:"Record not connected to production API.",date:"—",expires:"—"}];
 const x=demo.find(v=>v.id.toLowerCase()===q)||null;
 r.innerHTML=x?`<div class="info"><b>${x.status}</b><br>Ban ID: ${x.id}<br>User: ${x.user}<br>Reason: ${x.reason}<br>Date: ${x.date}<br>Expires: ${x.expires}</div>`:'<div class="info">NO LOCAL RECORD FOUND. Connect the portal to your moderation backend for live ban lookup.</div>';
};

$("#bugForm").onsubmit=e=>{
 e.preventDefault();const f=new FormData(e.target), b=Object.fromEntries(f.entries());
 b.id=id("ZBUG");b.status="OPEN";b.created=new Date().toLocaleString();data.bugs.unshift(b);save();e.target.reset();
 $("#bugResult").innerHTML=`<div class="success">BUG REPORT CREATED<br><b>${b.id}</b> • Status: OPEN</div>`;adminRefresh();
};
$("#lookupBug").onclick=()=>{
 const x=data.bugs.find(b=>b.id===($("#bugId").value||"").trim().toUpperCase());
 $("#bugLookupResult").innerHTML=x?`<div class="info"><b>${x.id}</b><br>Status: ${x.status}<br>Category: ${x.category}<br>Created: ${x.created}</div>`:'<div class="error">BUG REPORT NOT FOUND.</div>';
};

$("#appealForm").onsubmit=e=>{
 e.preventDefault();const f=new FormData(e.target), a=Object.fromEntries(f.entries());
 a.id=id("ZAPP");a.status="PENDING";a.created=new Date().toLocaleString();data.appeals.unshift(a);save();e.target.reset();
 $("#appealResult").innerHTML=`<div class="success">APPEAL SUBMITTED<br><b>${a.id}</b> • Status: PENDING</div>`;adminRefresh();
};

$("#pinBtn").onclick=()=>{
 const r=$("#pinResult");
 if($("#pinInput").value===ZCORP_PINS.adminPin){
   $("#adminGate").classList.add("hidden");$("#adminConsole").classList.remove("hidden");adminRefresh();
 }else r.innerHTML='<div class="error">INVALID ADMIN PIN.</div>';
};
function adminRefresh(){
 if(!$("#adminConsole")||$("#adminConsole").classList.contains("hidden"))return;
 $("#bugCount").textContent=data.bugs.length;$("#appealCount").textContent=data.appeals.length;$("#keyCount").textContent=data.keys.length;
 $("#adminReports").innerHTML=data.bugs.slice(0,8).map(b=>`<div class="report"><b>${b.id}</b> — ${b.category} — ${b.severity}<br><small>${b.status} • ${b.created}</small></div>`).join("")||'<p class="muted">No reports yet.</p>';
}
$("#generateKey").onclick=()=>{
 const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let raw="";
 for(let i=0;i<12;i++)raw+=chars[Math.floor(Math.random()*chars.length)];
 const key="ZCORP-"+raw.slice(0,4)+"-"+raw.slice(4,8)+"-"+raw.slice(8);
 const k={key,plan:"MANUAL",status:"ACTIVE",expires:"MANUAL"};
 data.keys.push(k);save();$("#generatedKey").innerHTML=`<div class="success"><b>${key}</b><br><small>Demo/static key. Move generation server-side before selling access.</small></div>`;adminRefresh();
};
adminRefresh();
