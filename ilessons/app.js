/* ---------- بيانات الوحدات ---------- */
var UNITS=[
 {k:'tic',f:'tic.html',ic:'📡',c:'#4f46e5',t:'تكنولوجيا الإعلام والاتصال',lessons:['المفاهيم','تطور الاتصال','أنظمة التشغيل','أجهزة الحاسوب','التحدي النهائي']},
 {k:'pc',f:'pc.html',ic:'🖥️',c:'#0d9488',t:'الحاسوب: أجزاؤه وتركيبه',lessons:['ما هو الحاسوب','وحدات الحاسوب','الوحدة المركزية','وحدات الذاكرة','التحدي النهائي']},
 {k:'os',f:'os.html',ic:'💿',c:'#d97706',t:'نظام التشغيل: تعريفه وتثبيته',lessons:['ما هو نظام التشغيل','التثبيت والتهيئة','إعداد البيوس BIOS','تثبيت Windows 7','التحدي النهائي']},
 {k:'sec',f:'sec.html',ic:'🛡️',c:'#dc2626',t:'لوحة التحكم وأمن الحاسوب',lessons:['لوحة التحكم','حسابات المستخدمين','البرامج الضارة وأنواعها','الأعراض والأنواع','الوقاية والحماية','التحدي النهائي']},
 {k:'net',f:'net.html',ic:'🌐',c:'#2563eb',t:'الشبكات: أنواعها وطرق ربطها',lessons:['ما هي الشبكة','أنواع الشبكات','الخادم والزبون','طوبولوجيا الربط','التحدي النهائي']}
];
var TOTAL_LESSONS=UNITS.reduce(function(a,u){return a+u.lessons.length},0);

/* ---------- أدوات ومصادر إضافية ---------- */
var TOOLS=[
 {ic:'📝',c:'#e08a3c',t:'معاينة الإجابة النموذجية للفرض',d:'اطّلع على التصحيح النموذجي',img:'devoirsl1.webp'},
 {ic:'💿',c:'#d97706',t:'محاكاة تثبيت Windows 7',d:'جرّب خطوات التثبيت تفاعليا',url:'https://csdocs.work.gd/win7sim.html'},
 {ic:'📚',c:'#4f46e5',t:'امتحانات السنوات الماضية',d:'تدرّب على مواضيع سابقة',url:'https://exams.work.gd/'},
 {ic:'🧮',c:'#0d9488',t:'حساب المعدل',d:'احسب معدلك بسهولة',url:'https://exams.work.gd/calculmoyen.html'}
];

/* ---------- أدوات ---------- */
var app=document.getElementById('app');
var cur=null,curU=null,view='login',mem={};
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){return String(s||'').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/\s+/g,' ').trim()}
function sid(s){return s.className+'|'+s.fullName}
function initials(s){return (s.firstName.trim().charAt(0)+' '+s.lastName.trim().charAt(0))}
function ls(k,v){
  try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); return null }
  catch(e){ if(v===undefined) return mem[k]===undefined?null:mem[k]; mem[k]=v; return null }
}
function getProg(){try{return JSON.parse(ls('ts_prog:'+sid(cur))||'{}')||{}}catch(e){return{}}}
function setUnit(k,st){var p=getProg();p[k]=st;ls('ts_prog:'+sid(cur),JSON.stringify(p));pushUnit(k,st)}
function brand(){return '<div class="brand"><span class="logo">💻</span><span class="tx">رحلة المعلوماتية</span></div>'}

/* ---------- عارض الصور ---------- */
function openImg(src,title){
  var o=document.createElement('div');o.className='lb';
  o.innerHTML='<div class="lb-bar"><div class="tt">'+esc(title)+'</div>'+
    '<a class="btn ghost sm" href="'+esc(src)+'" target="_blank" rel="noopener">فتح في تبويب ↗</a>'+
    '<button class="btn ghost sm" id="lbx">✕ إغلاق</button></div>'+
    '<div class="lb-body" id="lbb"><img src="'+esc(src)+'" alt="'+esc(title)+'"></div>';
  document.body.appendChild(o);
  function close(){o.remove();document.removeEventListener('keydown',key)}
  function key(e){if(e.key==='Escape')close()}
  document.addEventListener('keydown',key);
  o.querySelector('#lbx').onclick=close;
  o.querySelector('#lbb').onclick=function(e){
    if(e.target.tagName==='IMG')this.classList.toggle('zoom');else close();
  };
}

/* ---------- Supabase ---------- */
var syncState='';
var SYNC_TXT={busy:'⏳ جارٍ الحفظ…',ok:'☁️ تم حفظ تقدمك',err:'⚠️ بدون اتصال، سيُحفظ لاحقا'};
function setSync(s){syncState=s;var e=$('sync');if(e)e.textContent=SYNC_TXT[s]||''}
function sb(path,method,body,prefer){
  var h={apikey:SUPABASE_ANON,Authorization:'Bearer '+SUPABASE_ANON,'Content-Type':'application/json'};
  if(prefer)h.Prefer=prefer;
  return fetch(SUPABASE_URL+'/rest/v1/'+path,{method:method,headers:h,body:body?JSON.stringify(body):undefined}).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return method==='GET'?r.json():null;
  });
}
function registerStudent(s){
  return sb('students?on_conflict=id','POST',{id:sid(s),class_name:s.className,last_name:s.lastName,first_name:s.firstName,last_seen:new Date().toISOString()},'resolution=merge-duplicates,return=minimal');
}
function pushUnit(k,st){
  if(!cur)return Promise.resolve();
  setSync('busy');
  return sb('progress?on_conflict=student_id,unit','POST',{student_id:sid(cur),unit:k,max:st.max||0,done:st.done||{},pts:st.pts||0,updated_at:new Date().toISOString()},'resolution=merge-duplicates,return=minimal')
    .then(function(){setSync('ok')},function(){setSync('err')});
}
function mergeState(a,b){
  a=a||{};b=b||{};
  return{max:Math.max(a.max||0,b.max||0),done:Object.assign({},a.done||{},b.done||{}),pts:Math.max(a.pts||0,b.pts||0)};
}
function syncStudent(s){
  return registerStudent(s)
   .then(function(){return sb('progress?student_id=eq.'+encodeURIComponent(sid(s))+'&select=unit,max,done,pts','GET')})
   .then(function(rows){
     var local=getProg(),merged={};
     UNITS.forEach(function(u){merged[u.k]=local[u.k]||null});
     rows.forEach(function(r){merged[r.unit]=mergeState(merged[r.unit],{max:r.max,done:r.done,pts:r.pts})});
     ls('ts_prog:'+sid(s),JSON.stringify(Object.keys(merged).reduce(function(o,k){if(merged[k])o[k]=merged[k];return o},{})));
     var jobs=[];
     UNITS.forEach(function(u){if(merged[u.k])jobs.push(pushUnit(u.k,merged[u.k]))});
     return Promise.all(jobs).then(function(){setSync('ok')});
   });
}
function enter(s){
  cur=s;ls('ts_last',sid(s));
  app.innerHTML='<div class="auth"><div class="panel" style="grid-column:1/-1"><div class="formcard fade" style="text-align:center"><div class="av" style="margin:0 auto 14px;width:56px;height:56px">'+esc(initials(s))+'</div><h2>أهلا '+esc(s.firstName)+'</h2><p class="sub">⏳ جارٍ تحميل تقدمك…</p></div></div></div>';
  syncStudent(s).then(showDash,function(){setSync('err');showDash()});
}

/* ---------- شاشة الدخول ---------- */
function showLogin(){
  view='login';cur=null;curU=null;
  var lastId=ls('ts_last'),lastS=null;
  if(lastId){lastS=students.filter(function(s){return sid(s)===lastId})[0]||null}
  var opts=Object.keys(classesData).map(function(c){return '<option value="'+esc(c)+'">'+esc(c)+'</option>'}).join('');
  app.innerHTML=
  '<div class="auth">'+
   '<aside class="hero">'+
     brand()+
     '<div><h1>تعلّم المعلوماتية <em>خطوة بخطوة</em></h1><p>دروس تفاعلية وتطبيقات واختبارات قصيرة، وتقدمك محفوظ تلقائيا لتتابع من أي جهاز.</p></div>'+
     '<ul class="feat">'+
       '<li><span class="i">📚</span><span>شرح مبسط لكل مفهوم بأمثلة</span></li>'+
       '<li><span class="i">🎯</span><span>تطبيقات واختبارات لكل مستوى</span></li>'+
       '<li><span class="i">🏆</span><span>نقاط وتقدم تتابعه في كل وحدة</span></li>'+
     '</ul>'+
     '<div class="stats"><div><b>'+UNITS.length+'</b><span>وحدات</span></div><div><b>'+TOTAL_LESSONS+'</b><span>درسا</span></div><div><b>'+students.length+'</b><span>تلميذا</span></div></div>'+
   '</aside>'+
   '<section class="panel"><div class="formcard fade">'+
     '<h2>تسجيل الدخول</h2><p class="sub">اختر قسمك ثم اكتب لقبك واسمك لتبدأ.</p>'+
     (lastS?'<div class="resume"><span class="av sm">'+esc(initials(lastS))+'</span><div class="t"><small>آخر استعمال على هذا الجهاز</small><b>'+esc(lastS.fullName)+'</b></div><button class="btn sm" id="cont">متابعة</button></div>':'')+
     '<div class="field"><label class="lab" for="cls"><span class="num">1</span>القسم</label><select id="cls"><option value="">اختر القسم</option>'+opts+'</select></div>'+
     '<div class="grid2">'+
       '<div class="field"><label class="lab" for="ln"><span class="num">2</span>اللقب</label><input id="ln" autocomplete="off" placeholder="مثال: بلحوت"></div>'+
       '<div class="field"><label class="lab" for="fn"><span class="num">3</span>الاسم</label><input id="fn" autocomplete="off" placeholder="مثال: مريم"></div>'+
     '</div>'+
     '<div id="cand" aria-live="polite"></div>'+
     '<button class="btn lg block" id="go" disabled style="margin-top:16px">ابدأ التعلم ←</button>'+
     '<div style="text-align:center"><button class="linkbtn" id="showall">لا أجد اسمي، اعرض أسماء القسم</button></div>'+
     '<div id="all"></div>'+
   '</div></section>'+
  '</div>';
  var sel=null,cands=[];
  function fill(s){$('ln').value=s.lastName;$('fn').value=s.firstName;upd()}
  function match(s,a,b){return(!a||norm(s.lastName).indexOf(a)>-1)&&(!b||norm(s.firstName).indexOf(b)>-1)}
  function upd(){
    var c=$('cls').value,ln=norm($('ln').value),fn=norm($('fn').value),box=$('cand'),go=$('go');
    sel=null;go.disabled=true;cands=[];
    if(!c){box.innerHTML='<div class="msg hint">👆 اختر قسمك أولا.</div>';return}
    var pool=students.filter(function(s){return s.className===c});
    var exact=pool.filter(function(s){return norm(s.lastName)===ln&&norm(s.firstName)===fn})[0]||
              pool.filter(function(s){return ln&&fn&&norm(s.lastName)===fn&&norm(s.firstName)===ln})[0];
    if(exact){sel=exact;go.disabled=false;
      box.innerHTML='<div class="found"><span class="av sm">'+esc(initials(exact))+'</span><div><b>✓ وجدنا اسمك</b><small>'+esc(exact.fullName)+' · <bdi>'+esc(exact.className)+'</bdi></small></div></div>';return}
    if(!ln&&!fn){box.innerHTML='<div class="msg hint">✍️ اكتب أول حروف لقبك أو اسمك، ثم اضغط على اسمك من الاقتراحات.</div>';return}
    var m=pool.filter(function(s){return match(s,ln,fn)||match(s,fn,ln)});
    if(!m.length){
      var other=students.filter(function(s){return s.className!==c&&((norm(s.lastName)===ln&&norm(s.firstName)===fn)||(norm(s.lastName)===fn&&norm(s.firstName)===ln))});
      if(other.length){
        box.innerHTML='<div class="msg warn">هذا الاسم ليس في هذا القسم، لكنه موجود في:</div><div class="chips">'+
          other.map(function(s,i){return '<button class="chip" data-o="'+i+'">'+esc(s.fullName)+' · <bdi>'+esc(s.className)+'</bdi></button>'}).join('')+'</div>';
        Array.prototype.forEach.call(box.querySelectorAll('[data-o]'),function(b){b.onclick=function(){var s=other[+b.dataset.o];$('cls').value=s.className;fill(s)}});
      }else{
        box.innerHTML='<div class="msg warn">لا يوجد اسم مطابق في هذا القسم. تأكد من القسم ومن كتابة اللقب والاسم، أو اضغط «لا أجد اسمي».</div>';
      }
      return}
    m.sort(function(a,b){var x=norm(a.lastName).indexOf(ln)===0?0:1,y=norm(b.lastName).indexOf(ln)===0?0:1;return x-y});
    cands=m.slice(0,8);
    box.innerHTML='<div class="msg hint">هل تقصد أحد هؤلاء؟'+(m.length>8?' (اكتب المزيد لتضييق النتائج)':'')+'</div><div class="chips">'+
      cands.map(function(s,i){return '<button class="chip" data-i="'+i+'">'+esc(s.fullName)+'</button>'}).join('')+'</div>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-i]'),function(b){b.onclick=function(){fill(cands[+b.dataset.i])}});
  }
  $('cls').onchange=function(){$('all').innerHTML='';upd()};
  $('ln').oninput=upd;$('fn').oninput=upd;
  $('showall').onclick=function(){
    var c=$('cls').value;
    if(!c){$('cand').innerHTML='<div class="msg warn">اختر القسم أولا لتظهر أسماؤه.</div>';return}
    var pool=students.filter(function(s){return s.className===c});
    $('all').innerHTML='<div class="list"><div class="chips" style="margin-top:0">'+pool.map(function(s,i){return '<button class="chip" data-a="'+i+'">'+esc(s.fullName)+'</button>'}).join('')+'</div></div>';
    Array.prototype.forEach.call($('all').querySelectorAll('[data-a]'),function(b){b.onclick=function(){fill(pool[+b.dataset.a]);$('all').innerHTML=''}});
  };
  $('go').onclick=function(){if(sel)enter(sel)};
  if(lastS){$('cont').onclick=function(){enter(lastS)}}
  upd();
}

/* ---------- لوحة التقدم ---------- */
function ringSvg(pc){
  var r=56,C=2*Math.PI*r,off=C*(1-pc/100);
  return '<div class="ring"><svg width="132" height="132" viewBox="0 0 132 132"><circle class="tr" cx="66" cy="66" r="'+r+'" fill="none" stroke-width="11"/>'+
    '<circle class="pg" cx="66" cy="66" r="'+r+'" fill="none" stroke-width="11" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg>'+
    '<div class="c">'+pc+'%</div></div>';
}
function showDash(){
  view='dash';curU=null;
  var p=getProg(),done=0,pts=0,unitsDone=0,next=null;
  var cards=UNITS.map(function(u){
    var st=p[u.k]||{max:0,done:{},pts:0},n=u.lessons.length,d=Object.keys(st.done||{}).length;
    done+=d;pts+=st.pts||0;
    if(d>=n)unitsDone++;
    if(!next&&d<n)next=u;
    var rows=u.lessons.map(function(t,i){
      var dn=st.done&&st.done[i],open=i<=(st.max||0);
      var cl=dn?'done':open?'open':'lock',ic=dn?'✓':open?(i+1):'🔒';
      return '<li class="'+cl+'"><span class="dot">'+ic+'</span><span>'+esc(t)+'</span></li>';
    }).join('');
    var pc=Math.round(d/n*100);
    var pill=d===0?'<span class="pill">لم تبدأ بعد</span>':d<n?'<span class="pill go">قيد التقدم</span>':'<span class="pill ok">✓ مكتملة</span>';
    var label=d===0?'ابدأ الوحدة':d<n?'تابع الوحدة':'راجع الوحدة';
    return '<article class="unit fade" style="--c:'+u.c+'"><div class="uh"><div class="ub">'+u.ic+'</div><div><h3>'+esc(u.t)+'</h3>'+pill+'</div></div>'+
      '<div class="prog"><div class="track"><i style="width:'+pc+'%"></i></div><div class="pm"><span><b>'+d+'</b> من '+n+' دروس</span><span>⭐ '+(st.pts||0)+' نقطة</span></div></div>'+
      '<ul class="steps">'+rows+'</ul><button class="btn block" data-u="'+u.k+'">'+label+'</button></article>';
  }).join('');
  var pc=Math.round(done/TOTAL_LESSONS*100);
  app.innerHTML=
   '<header class="nav"><div class="nav-in">'+brand()+
     '<div class="nav-r"><span class="sync" id="sync"></span>'+
     '<div class="user"><span class="av sm">'+esc(initials(cur))+'</span><div class="nm"><b>'+esc(cur.firstName+' '+cur.lastName)+'</b><small><bdi>'+esc(cur.className)+'</bdi></small></div></div>'+
     '<button class="btn ghost sm" id="out">خروج</button></div></div></header>'+
   '<main class="wrap">'+
    '<section class="ov fade">'+ringSvg(pc)+
      '<div><h2>أهلا '+esc(cur.firstName)+' 👋</h2><p>'+(done?'واصل رحلتك، أنت تتقدم بشكل رائع.':'مستعد لبدء رحلتك مع المعلوماتية؟')+'</p>'+
      '<div class="kpis"><div class="kpi"><b>'+done+'/'+TOTAL_LESSONS+'</b><span>دروس منجزة</span></div><div class="kpi"><b>'+unitsDone+'/'+UNITS.length+'</b><span>وحدات مكتملة</span></div><div class="kpi"><b>'+pts+'</b><span>مجموع النقاط</span></div></div>'+
      (next?'<button class="btn lg" id="cont2">'+(done?'تابع من حيث توقفت ←':'ابدأ التعلم ←')+'</button>':'<span class="done-msg">🎉 أحسنت! أنهيت جميع الوحدات</span>')+
      '</div></section>'+
    '<div class="sec-title"><h2>أدوات ومصادر إضافية</h2><span>تدرّب وراجع بنفسك</span></div>'+
    '<div class="tools">'+TOOLS.map(function(t,i){
      var inner='<span class="ti">'+t.ic+'</span><span class="tx2"><b>'+esc(t.t)+'</b><small>'+esc(t.d)+'</small></span><span class="ar">'+(t.img?'🔍':'↗')+'</span>';
      return t.img
        ?'<button class="tool" style="--c:'+t.c+'" data-img="'+i+'">'+inner+'</button>'
        :'<a class="tool" style="--c:'+t.c+'" href="'+t.url+'" target="_blank" rel="noopener">'+inner+'</a>';
    }).join('')+'</div>'+
    '<div class="sec-title"><h2>وحداتك الدراسية</h2><span>اختر الوحدة التي تريد دراستها</span></div>'+
    '<div class="units">'+cards+'</div>'+
   '</main>';
  $('out').onclick=showLogin;setSync(syncState);
  if(next)$('cont2').onclick=function(){openUnit(next)};
  Array.prototype.forEach.call(app.querySelectorAll('[data-u]'),function(b){
    b.onclick=function(){openUnit(UNITS.filter(function(u){return u.k===b.dataset.u})[0])};
  });
  Array.prototype.forEach.call(app.querySelectorAll('[data-img]'),function(b){
    b.onclick=function(){var t=TOOLS[+b.dataset.img];openImg(t.img+'?v='+V,t.t)};
  });
  window.scrollTo(0,0);
}

/* ---------- عرض الدرس ---------- */
function openUnit(u){
  view='lesson';curU=u;
  var st=getProg()[u.k],h='';
  if(st){try{h='#'+btoa(JSON.stringify({max:st.max||0,done:st.done||{},pts:st.pts||0}))}catch(e){}}
  app.innerHTML='<div class="lbar"><button class="btn ghost sm" id="back">→ الرئيسية</button><div class="tt">'+u.ic+' '+esc(u.t)+'</div><span class="sync" id="sync"></span></div>'+
    '<iframe id="fr" title="'+esc(u.t)+'" src="'+u.f+'?v='+V+h+'"></iframe>';
  $('back').onclick=showDash;setSync(syncState);
}

window.addEventListener('message',function(e){
  var d=e.data,fr=$('fr');
  if(!d||d.t!=='prog'||view!=='lesson'||!curU||!cur||!fr||e.source!==fr.contentWindow)return;
  if(d.s&&typeof d.s==='object'){
    setUnit(curU.k,{max:+d.s.max||0,done:d.s.done||{},pts:+d.s.pts||0});
  }
});

/* ---------- Twemoji: يحوّل الإيموجي تلقائيا بعد كل رسم للواجهة ---------- */
var twQ=0,twObs=new MutationObserver(function(){if(!twQ)twQ=requestAnimationFrame(twRun)});
function twRun(){
  twQ=0;
  if(!window.twemoji)return; /* إن تعذّر تحميل المكتبة تبقى إيموجي النظام */
  twObs.disconnect();
  try{twemoji.parse(document.body,{folder:'svg',ext:'.svg'})}catch(e){}
  twObs.observe(document.body,{childList:true,subtree:true,characterData:true});
}

showLogin();
twRun();
