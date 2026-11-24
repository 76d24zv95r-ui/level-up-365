const KEY="levelup365-v1";
const startDate=new Date(2026,10,25);
let state=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{tasks:[],goals:[],reflections:{}}}catch{return {tasks:[],goals:[],reflections:{}}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function dayNumber(){const n=Math.floor((new Date(new Date().setHours(0,0,0,0))-startDate)/86400000)+1;return Math.max(1,Math.min(365,n))}
function taskCard(t){return `<div class="task ${t.done?"done":""}"><button class="check" data-toggle="${t.id}" aria-label="Отметить">${t.done?"✓":""}</button><div class="taskbody"><div class="tasktitle">${esc(t.name)}</div><div class="category">${esc(t.category)} · ${t.date===todayKey()?"Сегодня":"Добавлена ранее"}</div></div><button class="delete" data-delete="${t.id}" aria-label="Удалить">×</button></div>`}
function render(){
 const d=dayNumber(), pct=(d/365*100).toFixed(1);document.getElementById("dayCount").textContent=`ДЕНЬ ${String(d).padStart(3,"0")} / 365`;document.getElementById("yearPercent").textContent=pct+"%";document.getElementById("yearBar").style.width=pct+"%";
 const today=state.tasks.filter(t=>t.date===todayKey()),done=today.filter(t=>t.done).length,ratio=today.length?done/today.length*100:0;
 document.getElementById("doneCount").textContent=done;document.getElementById("taskCount").textContent=`из ${today.length} задач`;document.getElementById("taskBar").style.width=ratio+"%";
 document.getElementById("todayTasks").innerHTML=today.length?today.map(taskCard).join(""):'<div class="empty">Пока нет задач на сегодня. Добавь первую — даже маленький шаг имеет значение.</div>';
 document.getElementById("allTasks").innerHTML=state.tasks.length?state.tasks.slice().reverse().map(taskCard).join(""):'<div class="empty">Здесь появятся твои задачи.</div>';
 document.getElementById("goalList").innerHTML=state.goals.length?state.goals.map((g,i)=>`<div class="task goal"><div class="taskbody"><strong>${esc(g.name)}</strong><small>Цель ${i+1}</small></div><button class="delete" data-goal="${g.id}">×</button></div>`).join(""):'<div class="empty">Добавь цель, к которой хочешь двигаться.</div>';
 document.getElementById("statDone").textContent=state.tasks.filter(t=>t.done).length;document.getElementById("statTotal").textContent=state.tasks.length;document.getElementById("statGoals").textContent=state.goals.length;document.getElementById("statToday").textContent=Math.round(ratio)+"%";
 document.getElementById("dateLabel").textContent=new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
 document.getElementById("reflection").value=state.reflections[todayKey()]||"";
}
function switchPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.page===p))}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));
document.getElementById("toTasks").onclick=()=>switchPage("tasks");
document.getElementById("quickAdd").onclick=()=>{switchPage("tasks");document.getElementById("taskName").focus()};
document.getElementById("taskForm").addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("taskName").value.trim();if(!name)return;state.tasks.push({id:crypto.randomUUID(),name,category:document.getElementById("taskCategory").value,date:todayKey(),done:false});document.getElementById("taskName").value="";save();toast("Задача добавлена")});
document.getElementById("goalForm").addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("goalName").value.trim();if(!name)return;state.goals.push({id:crypto.randomUUID(),name});document.getElementById("goalName").value="";save();toast("Цель сохранена")});
document.addEventListener("click",e=>{const t=e.target.closest("[data-toggle]");if(t){const item=state.tasks.find(x=>x.id===t.dataset.toggle);if(item)item.done=!item.done;save();return}const del=e.target.closest("[data-delete]");if(del){state.tasks=state.tasks.filter(x=>x.id!==del.dataset.delete);save();toast("Задача удалена");return}const goal=e.target.closest("[data-goal]");if(goal){state.goals=state.goals.filter(x=>x.id!==goal.dataset.goal);save();toast("Цель удалена")}});
document.getElementById("saveReflection").onclick=()=>{state.reflections[todayKey()]=document.getElementById("reflection").value;localStorage.setItem(KEY,JSON.stringify(state));document.getElementById("savedNote").textContent="Запись сохранена на этом устройстве.";toast("Запись сохранена")};
document.getElementById("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="level-up-365-backup.json";a.click();URL.revokeObjectURL(url);toast("Резервная копия создана")};
document.getElementById("importData").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.tasks)||!Array.isArray(data.goals))throw Error();state={tasks:data.tasks,goals:data.goals,reflections:data.reflections||{}};save();toast("Данные восстановлены")}catch{toast("Не удалось прочитать файл")}e.target.value=""};
if("serviceWorker" in navigator && location.protocol!=="file:"){navigator.serviceWorker.register("./sw.js").catch(()=>{})}
render();