(function(){
'use strict';
var KEY='habit-pet-v1';
var STAGES=[
 {min:0,e:'🥚',n:'神祕蛋'},
 {min:3,e:'🐣',n:'剛孵化的小雞'},
 {min:10,e:'🐥',n:'毛茸茸小雞'},
 {min:25,e:'🐤',n:'活力小鳥'},
 {min:50,e:'🦆',n:'穩重小鴨'},
 {min:90,e:'🦉',n:'智慧貓頭鷹'},
 {min:150,e:'🦅',n:'自律老鷹'},
 {min:250,e:'🐉',n:'傳說神龍'}
];
var EMOJIS=['💧','🏃','📚','🧘','🥗','😴','💊','✍️','🎸','🧹','🦷','🚶'];
var LINES={
 idle:['今天也一起加油吧！','我肚子有點餓，快打卡～','點我一下試試看 😆','習慣是最棒的零食！','喵…不對，我是寵物啦','再一點點就升級囉！'],
 feed:['好好吃！謝謝你 😋','嗝～再來一口！','你好棒，我吃飽有力氣了！','打卡成功，我的最愛！','耶～能量補充完畢！'],
 all:['今天全部完成！你是最強的 🎉','滿分！我要跳舞啦 💃','太厲害了，給你一個大大的抱抱！'],
 sad:['你是不是忘了我… 🥺','好餓喔，今天還沒打卡…','我有點難過，陪陪我嘛…','咕嚕嚕…肚子在叫了'],
 poke:['哈哈好癢！','你戳我幹嘛啦～','我在這裡喔！','再戳我就要裝睡了 😴'],
 undo:['咦？剛剛那個不算嗎？','好吧，等你真的做完再來喔']
};
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function pad(n){return n<10?'0'+n:''+n}
function dkey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function today(){return dkey(new Date())}
function addDays(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);return x}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

var state=load();
function load(){
  try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&s.habits)return s}catch(e){}
  return {habits:[],log:{},total:0,created:today(),lastLv:1,mood:80,moodDate:today()};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}

function doneSet(day){return state.log[day]||[]}
function habitsOn(day){ // habits existing on that day
  return state.habits.filter(function(h){return !h.created||h.created<=day});
}
function isFull(day){
  var hs=habitsOn(day);if(!hs.length)return false;
  var ds=doneSet(day);return hs.every(function(h){return ds.indexOf(h.id)>-1});
}
function anyDone(day){return doneSet(day).some(function(id){return state.habits.some(function(h){return h.id===id})})}
function streak(){
  var d=new Date(),n=0;
  if(!isFull(dkey(d)))d=addDays(d,-1); // today not finished yet doesn't break
  while(isFull(dkey(d))){n++;d=addDays(d,-1)}
  return n;
}
function stageIdx(){var t=state.total,i=0;STAGES.forEach(function(s,k){if(t>=s.min)i=k});return i}
function level(){return Math.floor(state.total/5)+1}

// mood: decays for each skipped day (days with habits where nothing done), refreshed on load
function updateMood(){
  var t=today();
  if(state.moodDate===t)return;
  var d=new Date(state.moodDate+'T00:00:00'),end=new Date(t+'T00:00:00'),guard=0;
  while(d<end&&guard++<60){
    var k=dkey(d);
    if(habitsOn(k).length){
      var hs=habitsOn(k).length,dn=doneSet(k).length;
      if(dn===0)state.mood-=25;else if(dn<hs)state.mood-=8;else state.mood+=5;
    }
    d=addDays(d,1);
  }
  state.mood=Math.max(0,Math.min(100,state.mood));
  state.moodDate=t;save();
}

var $=function(id){return document.getElementById(id)};
function say(t){$('bubble').textContent=t}
function toast(t){var el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show')},2200)}
function anim(cls,ms){var p=$('pet');p.classList.remove('happy','eat','evolve');void p.offsetWidth;p.classList.add(cls);setTimeout(function(){p.classList.remove(cls)},ms)}

function render(){
  var si=stageIdx(),st=STAGES[si],lv=level();
  $('pet').textContent=st.e;$('petName').textContent=st.n;
  $('pet').classList.toggle('sad',state.mood<35);
  $('streak').textContent='🔥 '+streak()+' 天';
  $('lvTxt').textContent='Lv.'+lv;
  var into=state.total%5;$('xpBar').style.width=(into/5*100)+'%';$('xpTxt').textContent=into+'/5';
  $('moodBar').style.width=state.mood+'%';
  $('moodTxt').textContent=state.mood>=75?'😄 超開心':state.mood>=50?'🙂 不錯':state.mood>=30?'😐 普通':'😢 想你';
  var t=today(),ds=doneSet(t),ul=$('habits');ul.innerHTML='';
  var cnt=0;
  state.habits.forEach(function(h){
    var done=ds.indexOf(h.id)>-1;if(done)cnt++;
    var li=document.createElement('li');li.className='habit'+(done?' done':'');
    li.innerHTML='<span class="em"></span><span class="nm"></span><span class="ck">'+(done?'✓':'')+'</span><button class="del" aria-label="刪除">🗑</button>';
    li.querySelector('.em').textContent=h.emoji;li.querySelector('.nm').textContent=h.name;
    li.onclick=function(e){if(e.target.classList.contains('del'))return;toggle(h.id)};
    li.querySelector('.del').onclick=function(e){e.stopPropagation();if(confirm('刪除「'+h.name+'」？')){state.habits=state.habits.filter(function(x){return x.id!==h.id});save();render()}};
    ul.appendChild(li);
  });
  if(!state.habits.length){var e=document.createElement('li');e.className='empty';e.innerHTML='還沒有習慣喔<br>按下面的按鈕新增第一個吧 👇';ul.appendChild(e)}
  $('progress').textContent=cnt+'/'+state.habits.length;
  $('totalChip').textContent='累計 '+state.total+' 次';
  renderWeek();
}
function renderWeek(){
  var w=$('week');w.innerHTML='';var names=['日','一','二','三','四','五','六'];
  var now=new Date();
  for(var i=6;i>=0;i--){
    var d=addDays(now,-i),k=dkey(d),n=habitsOn(k).length,dn=doneSet(k).filter(function(id){return state.habits.some(function(h){return h.id===id})}).length;
    var cls=isFull(k)?'full':(dn>0?'part':'');
    var el=document.createElement('div');el.className='day'+(i===0?' today':'');
    el.innerHTML=names[d.getDay()]+'<div class="dot '+cls+'">'+(isFull(k)?'⭐':(n?dn+'/'+n:'·'))+'</div>';
    w.appendChild(el);
  }
}
function toggle(id){
  var t=today(),ds=state.log[t]=state.log[t]||[],i=ds.indexOf(id);
  if(i>-1){
    ds.splice(i,1);state.total=Math.max(0,state.total-1);save();render();say(rnd(LINES.undo));return;
  }
  var before=stageIdx(),beforeLv=level();
  ds.push(id);state.total++;state.mood=Math.min(100,state.mood+12);save();
  if(navigator.vibrate)navigator.vibrate(25);
  render();anim('eat',600);
  var after=stageIdx(),afterLv=level();
  if(isFull(t)){
    say(rnd(LINES.all));anim('happy',2200);confetti();
  }else say(rnd(LINES.feed));
  if(after>before){setTimeout(function(){anim('evolve',1400);confetti();say('哇！我進化成「'+STAGES[after].n+'」了！✨');toast('🎊 進化：'+STAGES[after].e+' '+STAGES[after].n)},700)}
  else if(afterLv>beforeLv)toast('⬆️ 升級！Lv.'+afterLv);
}
function confetti(){
  var box=$('confetti'),em=['🎉','✨','⭐','🎊','💖','🌟'];
  for(var i=0;i<36;i++){
    var s=document.createElement('span');s.className='cf';s.textContent=rnd(em);
    s.style.left=Math.random()*100+'%';s.style.animationDuration=(1.8+Math.random()*1.8)+'s';s.style.animationDelay=(Math.random()*.4)+'s';
    s.style.fontSize=(18+Math.random()*20)+'px';box.appendChild(s);
    (function(x){setTimeout(function(){x.remove()},4200)})(s);
  }
}

// add modal
var selEmoji='💧';
function buildEmojis(){
  var r=$('emojiRow');r.innerHTML='';
  EMOJIS.forEach(function(e){var b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=function(){selEmoji=e;$('emojiInput').value=e;mark()};r.appendChild(b)});
  mark();
}
function mark(){Array.prototype.forEach.call($('emojiRow').children,function(b){b.classList.toggle('sel',b.textContent===$('emojiInput').value)})}
$('emojiInput').oninput=mark;
$('addBtn').onclick=function(){$('nameInput').value='';$('modal').hidden=false;buildEmojis();setTimeout(function(){$('nameInput').focus()},50)};
$('cancelBtn').onclick=function(){$('modal').hidden=true};
$('modal').onclick=function(e){if(e.target===$('modal'))$('modal').hidden=true};
$('form').onsubmit=function(e){
  e.preventDefault();var n=$('nameInput').value.trim();if(!n)return;
  state.habits.push({id:uid(),name:n,emoji:$('emojiInput').value.trim()||'⭐',created:today()});
  save();$('modal').hidden=true;render();say('新朋友「'+n+'」加入！一起養成它吧～');
};
$('pet').onclick=function(){anim('eat',600);say(state.mood<35?rnd(LINES.sad):rnd(LINES.poke))};
$('resetLink').onclick=function(e){e.preventDefault();if(confirm('確定要清除所有資料並重新開始嗎？')){localStorage.removeItem(KEY);state=load();render();say('重新開始！我又是一顆蛋了 🥚')}};

updateMood();render();
say(state.habits.length?(state.mood<35?rnd(LINES.sad):rnd(LINES.idle)):'嗨！先幫我加一個習慣吧～');
setInterval(function(){if(state.mood>=35&&!document.hidden)say(rnd(LINES.idle))},15000);
document.addEventListener('visibilitychange',function(){if(!document.hidden){updateMood();render()}});

if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
window.__hp={state:function(){return state},toggle:toggle};
})();
