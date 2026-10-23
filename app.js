const $=s=>document.querySelector(s), J=u=>fetch(u).then(r=>r.json());
const usd=(x,d=2)=>(x<0?"-$":"$")+Math.abs(x).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const cls=x=>x>=0?"pos":"neg";
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const PAL=["#6d4aff","#12b76a","#f79009","#2e90fa","#ee46bc","#15b79e","#f04438","#98a2b3","#7a5af8","#fdb022"];
Chart.defaults.color=css("--mute");Chart.defaults.borderColor=css("--line");
const kpis=(el,a)=>$(el).innerHTML=a.map(([l,v,c])=>`<div class="kpi"><span>${l}</span><b class="${c||""}">${v}</b></div>`).join("");
const table=(el,head,rows,rc)=>$(el).innerHTML="<tr>"+head.map(h=>`<th>${h}</th>`).join("")+"</tr>"+rows.map((r,i)=>`<tr class="${rc?rc(i):""}">${r.map(c=>`<td>${c??""}</td>`).join("")}</tr>`).join("");
const charts={};function chart(id,cfg){charts[id]?.destroy();charts[id]=new Chart($("#"+id),cfg)}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.tab").forEach(e=>e.classList.remove("on"));b.classList.add("on");$("#"+b.dataset.tab).classList.add("on");location.hash=b.dataset.tab});
if(location.hash)document.querySelector(`nav [data-tab="${location.hash.slice(1)}"]`)?.click();

J("data/retirement.json").then(d=>{
 $("#ret-sub").textContent=`${d.account} · snapshot ${d.as_of}`;
 kpis("#ret-kpis",[["Total value",usd(d.total)],["Mutual funds",usd(d.funds_total)],["Cash & MM",usd(d.cash_total)],["Day change",`${usd(d.day_change)} (${d.day_pct}%)`,cls(d.day_change)],["Unrealized G/L",`${usd(d.unrealized)} (${d.unrealized_pct}%)`,cls(d.unrealized)]]);
 table("#ret-hold",["Fund","Name","Shares","Price","Value","Day chg","Gain/Loss","Gain %"],d.funds.map(h=>[h.symbol,`<span class="l">${h.name}</span>`,h.shares.toLocaleString(),usd(h.price),usd(h.value),`<span class="${cls(h.day_chg)}">${usd(h.day_chg)} (${h.day_pct}%)</span>`,`<span class="${cls(h.gain)}">${usd(h.gain)}</span>`,`<span class="${cls(h.gain)}">${h.gain_pct}%</span>`]));
 table("#ret-cash",["Holding","Value"],d.cash.map(c=>[c.name,usd(c.value)]));
 chart("c-alloc",{type:"doughnut",data:{labels:d.funds.map(f=>f.symbol).concat(["Cash & MM"]),datasets:[{data:d.funds.map(f=>f.value).concat([d.cash_total]),backgroundColor:PAL.concat(["#475467"])}]},options:{plugins:{legend:{position:"right"}}}});
 chart("c-sector",{type:"bar",data:{labels:d.sectors.map(s=>s.label),datasets:[{data:d.sectors.map(s=>s.value),backgroundColor:PAL}]},options:{indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${usd(c.raw,0)} (${(c.raw/d.total*100).toFixed(1)}%)`}}}}});
 const st=d.lookthrough.filter(r=>!r.ticker.startsWith("Other")&&!d.non_stock.includes(r.ticker)).slice(0,20);
 chart("c-stocks",{type:"bar",data:{labels:st.map(s=>s.ticker),datasets:[{data:st.map(s=>s.value),backgroundColor:"#6d4aff"}]},options:{indexAxis:"y",maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${st[c.dataIndex].name}: ${usd(c.raw,0)} via ${st[c.dataIndex].via}`}}}}});
 $("#ret-cav").textContent=d.caveat;
 table("#ret-look",["Holding","Ticker","$ exposure","% acct","Held via"],d.lookthrough.map(r=>[r.name,r.ticker,usd(r.value,0),(r.value/d.total*100).toFixed(2)+"%",r.via]));
 $("#ret-trades").innerHTML=d.trades.length?"<div class=scroll><table id=ret-tl></table></div>":`<p class="note">Starting snapshot recorded ${d.as_of}. New buys and sells will appear here (add them to <code>trades</code> in src/retirement.json).</p>`;
 if(d.trades.length)table("#ret-tl",["Date","Action","Fund","Shares","Price","Amount"],d.trades.map(t=>[t.date,t.action,t.symbol,t.shares,usd(t.price),usd(t.amount)]));
});


fetch("data/notes.json").then(r=>r.json()).then(n=>{
 const li=a=>a.map(x=>`<li>${x}</li>`).join("");
 $("#n-sub").textContent="Updated "+n.updated;$("#n-pledge").textContent=n.pledge;
 $("#n-rules").innerHTML=n.rules.map(g=>`<div><h3>${g.group}</h3><ul>${li(g.items)}</ul></div>`).join("");
 $("#n-goals").innerHTML=li(n.goals);
 $("#n-lessons").innerHTML=n.lessons.map(l=>`<div class="lesson"><span class="note">${l.date}</span> <b>${l.title}</b><p>${l.text}</p></div>`).join("");
 const rows=n.daily.flatMap(d=>d.items.map(i=>({...i,date:d.date})));
 table("#n-daily",["Date","Account","R","Takeaway"],rows.map(r=>[r.date,r.acct,`<span class="${r.R>=0?"pos":"neg"}">${r.R>0?"+":""}${r.R.toFixed(2)}R</span>`,`<span class="l">${r.note}</span>`]));
 $("#n-watch").innerHTML=n.watchlist.map(w=>`<div><h3>${w.name}</h3><ul>${li(w.items)}</ul></div>`).join("")+(n.ideas.length?`<div><h3>Ideas</h3><ul>${li(n.ideas)}</ul></div>`:"");
});
