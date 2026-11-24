const KEY="levelup365-v1";
const startDate=new Date(2026,10,25);
let state=load();

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY))||{};
    return {
      tasks:Array.isArray(saved.tasks)?saved.tasks:[],
      goals:Array.isArray(saved.goals)?saved.goals:[],
      reflections:saved.reflections||{},
      generatedDays:saved.generatedDays||{}
    };
  }catch{
    return {tasks:[],goals:[],reflections:{},generatedDays:{}};
  }
}
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
function save(){persist();render();}
function dateKey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(date,amount){const d=new Date(date);d.setDate(d.getDate()+amount);return d;}
function rawDayNumber(){
  const today=new Date();today.setHours(0,0,0,0);
  const start=new Date(startDate);start.setHours(0,0,0,0);
  return Math.floor((today-start)/86400000)+1;
}
function dayNumber(){return Math.max(1,Math.min(365,rawDayNumber()));}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
}
function uid(){return (crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));}

/*
  Daily plan rules:
  - Day 1 is left untouched so the user's existing first-day tasks are preserved.
  - Starting on Day 2, one plan is generated the first time the app is opened on that date.
  - No future tasks are created early; tomorrow's plan appears tomorrow.
  - A completed/unfinished previous day gently adjusts the suggested effort.
*/
function generateTodayPlan(){
  const d=rawDayNumber();
  if(d<2 || d>365) return false;
  const key=dateKey();
  if(state.generatedDays[key]) return false;

  const prevKey=dateKey(addDays(new Date(),-1));
  const previous=state.tasks.filter(t=>t.auto===true && t.date===prevKey);
  const previousRate=previous.length?previous.filter(t=>t.done).length/previous.length:null;
  const effort=previousRate===null?"steady":previousRate>=0.8?"slightly-up":previousRate<0.4?"lighter":"steady";
  const stage=Math.floor((d-1)/30)+1;

  const bodyMinutes=effort==="slightly-up"?25:effort==="lighter"?12:18;
  const readMinutes=effort==="slightly-up"?25:effort==="lighter"?10:15;
  const skillMinutes=effort==="slightly-up"?30:effort==="lighter"?15:20;
  const moneyMinutes=effort==="slightly-up"?20:effort==="lighter"?8:12;

  const focusTasks=[
    {category:"Тело",name:`Комфортная активность ${bodyMinutes} минут: прогулка, лёгкая зарядка или подвижная пауза`},
    {category:"Интеллект",name:`Прочитай или изучи что-то полезное ${readMinutes} минут и запиши одну мысль`},
    {category:"Навыки",name:`Практикуй выбранный навык ${skillMinutes} минут без отвлечений`},
    {category:"Деньги",name:`${moneyMinutes} минут финансовой грамотности: изучи один термин или принцип и запиши пример`},
    {category:"Ментальное состояние",name:"Сделай короткую паузу и оцени своё состояние: что сейчас важно, что может подождать?"},
    {category:"Личное",name:"Выбери один небольшой приоритет дня и подготовь всё необходимое для его выполнения"}
  ];

  // A weekly review is the seventh task on every seventh day of the program.
  if(d%7===0){
    focusTasks.push({category:"Личное",name:"Недельный обзор: отметь достижения, трудности и один вывод на следующую неделю",optional:true});
  } else if(previousRate!==null && previousRate>=0.8){
    focusTasks.push({category:"Навыки",name:"Дополнительный шаг по выбранному навыку: 10 минут практики",optional:true});
  }

  const tasks=focusTasks.map((item,index)=>({
    id:uid(),name:item.name,category:item.category,date:key,done:false,
    auto:true,dayIndex:d,stage,optional:!!item.optional,order:index+1
  }));
  state.tasks.push(...tasks);
  state.generatedDays[key]={day:d,createdAt:new Date().toISOString(),effort,count:tasks.length};
  persist();
  return true;
}

function taskCard(t){
  const origin=t.auto?`Автоплан · День ${String(t.dayIndex||"").padStart(3,"0")}${t.optional?" · дополнительное":""}`:(t.date===dateKey()?"Сегодня":"Добавлена ранее");
  return `<div class="task ${t.done?"done":""}">
    <button class="check" data-toggle="${esc(t.id)}" aria-label="Отметить">${t.done?"✓":""}</button>
    <div class="taskbody"><div class="tasktitle">${esc(t.name)}</div><div class="category">${esc(t.category)} · ${origin}</div></div>
    ${t.auto?'<span class="auto-mark" title="Задание программы">365</span>':`<button class="delete" data-delete="${esc(t.id)}" aria-label="Удалить">×</button>`}
  </div>`;
}
function render(){
  const d=dayNumber(),pct=(d/365*100).toFixed(1);
  document.getElementById("dayCount").textContent=`ДЕНЬ ${String(d).padStart(3,"0")} / 365`;
  document.getElementById("yearPercent").textContent=pct+"%";
  document.getElementById("yearBar").style.width=pct+"%";

  const today=state.tasks.filter(t=>t.date===dateKey());
  const done=today.filter(t=>t.done).length,ratio=today.length?done/today.length*100:0;
  document.getElementById("doneCount").textContent=done;
  document.getElementById("taskCount").textContent=`из ${today.length} задач`;
  document.getElementById("taskBar").style.width=ratio+"%";
  document.getElementById("todayTasks").innerHTML=today.length?today.map(taskCard).join(""):'<div class="empty">На сегодня пока нет задач.</div>';

  const note=document.getElementById("planNote");
  const autoToday=today.filter(t=>t.auto);
  if(d===1){
    note.textContent="Первый день — твои исходные задачи сохранены. Автоматический план начнётся со 2-го дня.";
  }else if(d>365){
    note.textContent="Годовая программа завершена. Посмотри итоги и выбери следующий этап.";
  }else if(autoToday.length){
    note.textContent=`Автоплан на сегодня готов: ${autoToday.length} заданий. План следующего дня откроется только завтра.`;
  }else{
    note.textContent="План на сегодня ещё не создан. Перезагрузи страницу, чтобы приложение сформировало его.";
  }

  document.getElementById("allTasks").innerHTML=state.tasks.length?state.tasks.slice().reverse().map(taskCard).join(""):'<div class="empty">Здесь появятся твои задачи.</div>';
  document.getElementById("goalList").innerHTML=state.goals.length?state.goals.map((g,i)=>`<div class="task goal"><div class="taskbody"><strong>${esc(g.name)}</strong><small>Цель ${i+1}</small></div><button class="delete" data-goal="${esc(g.id)}">×</button></div>`).join(""):'<div class="empty">Добавь личную долгосрочную цель. Ежедневные шаги приложение будет предлагать автоматически.</div>';
  document.getElementById("statDone").textContent=state.tasks.filter(t=>t.done).length;
  document.getElementById("statTotal").textContent=state.tasks.length;
  document.getElementById("statGoals").textContent=state.goals.length;
  document.getElementById("statToday").textContent=Math.round(ratio)+"%";
  document.getElementById("dateLabel").textContent=new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
  document.getElementById("reflection").value=state.reflections[dateKey()]||"";
}

function switchPage(p){
  document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));
document.getElementById("toTasks").onclick=()=>switchPage("tasks");
document.getElementById("quickAdd").onclick=()=>{switchPage("tasks");document.getElementById("taskName").focus();};

document.getElementById("taskForm").addEventListener("submit",e=>{
  e.preventDefault();const name=document.getElementById("taskName").value.trim();if(!name)return;
  state.tasks.push({id:uid(),name,category:document.getElementById("taskCategory").value,date:dateKey(),done:false,auto:false});
  document.getElementById("taskName").value="";save();toast("Задача добавлена");
});
document.getElementById("goalForm").addEventListener("submit",e=>{
  e.preventDefault();const name=document.getElementById("goalName").value.trim();if(!name)return;
  state.goals.push({id:uid(),name});document.getElementById("goalName").value="";save();toast("Цель сохранена");
});
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-toggle]");
  if(t){const item=state.tasks.find(x=>x.id===t.dataset.toggle);if(item)item.done=!item.done;save();return;}
  const del=e.target.closest("[data-delete]");
  if(del){state.tasks=state.tasks.filter(x=>x.id!==del.dataset.delete);save();toast("Задача удалена");return;}
  const goal=e.target.closest("[data-goal]");
  if(goal){state.goals=state.goals.filter(x=>x.id!==goal.dataset.goal);save();toast("Цель удалена");}
});
document.getElementById("saveReflection").onclick=()=>{
  state.reflections[dateKey()]=document.getElementById("reflection").value;
  persist();document.getElementById("savedNote").textContent="Запись сохранена на этом устройстве.";toast("Запись сохранена");
};
document.getElementById("exportData").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="level-up-365-backup.json";a.click();URL.revokeObjectURL(url);toast("Резервная копия создана");
};
document.getElementById("importData").onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const data=JSON.parse(await f.text());
    if(!Array.isArray(data.tasks)||!Array.isArray(data.goals))throw Error();
    state={tasks:data.tasks,goals:data.goals,reflections:data.reflections||{},generatedDays:data.generatedDays||{}};
    save();toast("Данные восстановлены");
  }catch{toast("Не удалось прочитать файл");}
  e.target.value="";
};

if("serviceWorker" in navigator && location.protocol!=="file:"){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
// Generate only today's plan. Tomorrow's tasks are not stored or shown in advance.
const generatedNow=generateTodayPlan();
render();
if(generatedNow) toast("План на сегодня автоматически создан");
