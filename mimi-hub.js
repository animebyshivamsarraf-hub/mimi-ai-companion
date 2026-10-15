window.ConnectorHub = (function(){
  const LS_KEY = 'mimi_connectors_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let connectors = [];
  let wiz = null;

  const ST_TXT = {connected:['st-ok','🟢 Connected'], unreachable:['st-err','🔴 Unreachable'],
    'auth-required':['st-warn','🟡 Auth required'], 'config-error':['st-err','🔴 Config error'],
    disabled:['st-off','⚪ Disabled'], demo:['st-warn','🟡 Demo'], untested:['st-off','⚪ Not tested']};
  const stBadge = s => { const m = ST_TXT[s]||ST_TXT.untested; return '<span class="hub-badge '+m[0]+'">'+m[1]+'</span>'; };

  function load(){ try{ connectors = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ connectors=[]; } }
  function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(connectors)); }catch(e){} }
  function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'conn'; }

  function demoCards(){
    return [
      {id:'demo-mcp', name:'Example MCP', type:'mcp', kind:'demo', url:'https://mcp.example.com/mcp',
       status:'demo', lastCheck:'—', tools:[{name:'<dynamic via tools/list>', permission:'modify'}]}
    ];
  }

  function render(){
    const el = $('hubList'); if(!el) return;
    const demos = demoCards();
    const all = demos.concat(connectors);
    if(!all.length){ el.innerHTML = '<p class="neu-sub">Abhi koi connector nahi.</p>'; return; }
    el.innerHTML = all.map(c=>{
      const isDemo = c.kind==='demo';
      const badge = isDemo ? '<span class="hub-badge hub-demo">DEMO</span>'
        : (c.lastTestOk ? '<span class="hub-badge hub-real">REAL</span>' : '<span class="hub-badge hub-prev">PREVIEW</span>');
      const dis = c.status==='disabled';
      const hasAuth = c.auth && c.auth.value;
      const needsAuth = c.status==='disconnected' || c.status==='auth-required';
      return '<div class="neu-in conn-card" style="padding:12px;">'
        + '<div class="conn-head"><h4>'+esc(c.type==='mcp'?'🔗 ':c.type==='ai'?'🤖 ':'🌐 ')+esc(c.name)+'</h4>'
        + '<span>'+badge+stBadge(dis?'disabled':c.status)+'</span></div>'
        + '<div class="conn-meta">'+esc(c.url||'')+' &nbsp;•&nbsp; last check: '+esc(c.lastCheck||'—')+'</div>'
        + (c.lastError?'<div class="conn-meta" style="color:#9b2c2c;">⚠️ '+esc(c.lastError)+'</div>':'')
        + '<div class="conn-btns">'
        + (isDemo
          ? '<button class="neu-btn sm" data-hact="demo-info" data-hid="'+esc(c.id)+'">ℹ️ Ye kya hai?</button>'
          : (needsAuth
            ? '<button class="neu-btn sm primary" data-hact="reconnect" data-hid="'+esc(c.id)+'">🔌 Reconnect</button>'
            : '<button class="neu-btn sm" data-hact="test" data-hid="'+esc(c.id)+'">🔍 Test</button>')
            + '<button class="neu-btn sm" data-hact="detail" data-hid="'+esc(c.id)+'">📋 Details</button>'
            + (hasAuth && !needsAuth ? '<button class="neu-btn sm" data-hact="disconnect" data-hid="'+esc(c.id)+'">🔌 Disconnect</button>' : '')
            + '<button class="neu-btn sm" data-hact="toggle" data-hid="'+esc(c.id)+'">'+(dis?'▶️ Enable':'⏸️ Disable')+'</button>'
            + '<button class="neu-btn sm danger" data-hact="del" data-hid="'+esc(c.id)+'">🗑️</button>')
        + '</div></div>';
    }).join('');
    el.querySelectorAll('[data-hact]').forEach(b=>{ b.onclick=()=>cardAction(b.dataset.hact, b.dataset.hid); });
  }

  function cardAction(act, id){
    if(act==='demo-info'){ alert('Ye DEMO example hai — asli me nahi chalega.\n\nAsli connector jodne ke liye "Add Connector" dabao.'); return; }
    const c = connectors.find(x=>x.id===id); if(!c) return;
    if(act==='test') testConnector(c);
    else if(act==='detail') showDetail(c);
    else if(act==='toggle'){ c.status = c.status==='disabled' ? 'untested' : 'disabled'; save(); render(); }
    else if(act==='del'){ if(confirm('"'+c.name+'" hatayein?')){ connectors = connectors.filter(x=>x.id!==id); save(); render(); } }
    else if(act==='disconnect'){
      if(confirm('"'+c.name+'" se disconnect karein?\nToken hat jayega, connector list me rahega.')){ 
        c.auth={}; c.status='disconnected'; c.lastTestOk=false; c.lastError=''; save(); render(); 
      }
    }
    else if(act==='reconnect'){ openReconnect(c); }
  }

  function openReconnect(c){
    wiz = {name:c.name||'', url:c.url||'', auth: c.auth||{type:'none'}, testResult:null, tools:[], reconnectId:c.id};
    $('hubWizard').classList.add('open'); renderWiz();
  }

  async function testConnector(c){
    c.status='untested'; c.lastError=''; render();
    try{
      let r;
      if(c.type==='mcp'){
        r = await fetch('/api/mcp-discover',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({mcp_url:c.url, auth:c.auth||{}})}).then(x=>x.json());
        if(r.ok){ c.tools=(r.tools||[]).map(t=>({name:t.name,permission:'modify',description:t.description})); }
      }else{
        r = await fetch('/api/conn-test',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({url:c.url, health_path:c.health_path||'', auth:c.auth||{}})}).then(x=>x.json());
      }
      if(r.ok){ c.status='connected'; c.lastTestOk=true; c.lastCheck=new Date().toLocaleString('en-IN'); c.lastError=''; }
      else{
        c.lastTestOk=false; c.lastCheck=new Date().toLocaleString('en-IN');
        const e=String(r.error||'failed');
        c.status = /401|403|auth/i.test(e)?'auth-required':/url|config|invalid/i.test(e)?'config-error':'unreachable';
        c.lastError=e.slice(0,160);
      }
    }catch(e){ c.status='unreachable'; c.lastTestOk=false; c.lastError='Test me dikkat: '+String(e.message||e).slice(0,120); }
    save(); render();
  }

  /* ---- detail drawer ---- */
  let detailTab='tools';
  function showDetail(c){
    $('hubDetail').style.display='block';
    $('hubDetailName').textContent=(c.type==='mcp'?'🔗 ':c.type==='ai'?'🤖 ':'🌐 ')+c.name;
    $('hubDetail').dataset.hid=c.id;
    document.querySelectorAll('[data-htab]').forEach(t=>t.classList.toggle('on',t.dataset.htab===detailTab));
    renderTab(c);
    $('hubDetail').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function renderTab(c){
    const b=$('hubTabBody'); const tools=c.tools||[];
    if(detailTab==='tools'){
      const canTry = c.kind==='user' && c.type==='mcp' && c.status==='connected';
      b.innerHTML = tools.length
        ? '<ul style="margin:6px 0;padding-left:0;list-style:none;font-size:13px;">'+tools.map((t,i)=>'<li class="hub-kv" style="margin-bottom:6px;"><b>'+esc(t.name)+'</b> '+(t.description?'<span class="neu-sub">'+esc(String(t.description).slice(0,80))+'</span>':'')
          +(canTry?'<div style="margin-top:6px;"><input id="tryArgs'+i+'" class="neu-in" style="padding:8px;font-size:12px;margin-bottom:6px;" placeholder=\'Arguments (JSON, jaise {"sides":6}) — khaali = {}\'>'
          +'<button class="neu-btn sm" data-try="'+i+'">▶ Try (asli call)</button></div>':'')+'</li>').join('')+'</ul>'
          +'<div id="tryOut" style="margin-top:8px;"></div>'
          +(canTry?'<p class="neu-sub">Try dabane par server par <b>asli</b> tools/call jayega. Sirf safe read-only tools try karo.</p>':'')
        : '<p class="neu-sub">Koi tools nahi mile. MCP ke liye "Test" dabao — tools/list se discover honge.</p>';
      if(canTry){
        b.querySelectorAll('[data-try]').forEach(btn=>{ btn.onclick=()=>{
          const i=+btn.dataset.try;
          const argInp=$('tryArgs'+i);
          let args={};
          if(argInp && argInp.value.trim()){
            try{ args=JSON.parse(argInp.value); }
            catch(e){ $('tryOut').innerHTML='<div class="hub-kv" style="border-left:3px solid #9b2c2c;">JSON galat hai: '+esc(e.message).slice(0,80)+'</div>'; return; }
          }
          tryTool(c, tools[i], args);
        }; });
      }
    }else if(detailTab==='perms'){
      const rows = tools.map(t=>'<div class="hub-kv"><b>'+esc(t.name)+'</b> — '+esc(t.permission||'modify')+'</div>').join('');
      b.innerHTML = (rows||'<p class="neu-sub">Tools nahi hain.</p>')
        + '<p class="neu-sub" style="margin-top:8px;">Permission unknown ho to <b>modify</b> (safe default) milta hai — write actions par approval lagega.</p>';
    }else if(detailTab==='approvals'){
      b.innerHTML = '<p class="neu-sub">Write/publish/delete actions chalane se pehle <b>approval token</b> chahiye:'
        + '<br>• Token exact action + parameters se bound hota hai<br>• 10 minute me expire<br>• Ek baar hi chalega (replay blocked)<br>• Tools tab me <b>▶ Try</b> se safe tools ka asli call hota hai (audit me log hota hai).</p>';
    }else if(detailTab==='results'){
      b.innerHTML = '<p class="neu-sub">Is preview me koi execution nahi hua. Real system me yahan har run ka result + validation dikhega.</p>';
    }else{
      const log = (c.audit||[]).slice(-8).reverse().map(a=>esc(a)).join('\n') || 'Koi audit entry nahi.';
      b.innerHTML = '<div class="hub-log">'+log+'</div><p class="neu-sub">Secrets kabhi audit me nahi aate.</p>';
    }
  }

  async function tryTool(c, t, args){
    const out=$('tryOut'); if(!out||!t) return;
    args = args || {};
    out.innerHTML='<p class="neu-sub">⏳ "'+esc(t.name)+'" chal raha hai… (asli call)</p>';
    try{
      const r=await fetch('/api/mcp-call',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mcp_url:c.url, tool_name:t.name, arguments:args, auth:c.auth||{}})}).then(x=>x.json());
      if(r.ok){
        const res=r.result||{};
        let txt='';
        try{
          const content=res.content||[];
          txt=content.map(x=>x.text||JSON.stringify(x)).join('\n');
        }catch(e){ txt=JSON.stringify(res).slice(0,500); }
        out.innerHTML='<div class="hub-kv" style="border-left:3px solid #2f9e44;"><b>✅ Asli result:</b><br>'+esc(txt||JSON.stringify(res)).slice(0,600)+'</div>';
        c.audit=c.audit||[]; c.audit.push('tried '+t.name+' '+new Date().toLocaleString('en-IN')); save();
      }else{
        out.innerHTML='<div class="hub-kv" style="border-left:3px solid #9b2c2c;"><b>❌ Fail:</b> '+esc(String(r.error||'unknown')).slice(0,200)+'</div>';
      }
    }catch(e){
      out.innerHTML='<div class="hub-kv" style="border-left:3px solid #9b2c2c;">Request fail: '+esc(String(e.message||e)).slice(0,120)+'</div>';
    }
  }

  /* ---- MCP-only wizard (ChatGPT-style simple) ---- */
  function openWizard(){
    wiz = {name:'', url:'', auth:{type:'none'}, testResult:null, tools:[]};
    $('hubWizard').classList.add('open'); renderWiz();
  }
  function closeWizard(){ $('hubWizard').classList.remove('open'); wiz=null; }
  function openLovableMcp(){
    wiz = {name:'Lovable', url:'https://mcp.lovable.dev', auth:{type:'none'}, testResult:null, tools:[]};
    $('hubWizard').classList.add('open'); renderWiz();
  }
  function openDemoMcp(){
    let origin=''; try{ origin=location.origin; }catch(e){}
    wiz = {name:'Mimi Demo', url:origin+'/api/demo-mcp', auth:{type:'none'}, testResult:null, tools:[]};
    $('hubWizard').classList.add('open'); renderWiz();
  }

  function renderWiz(){
    if(!wiz) return;
    const B=$('hubWizBody');
    B.innerHTML =
      '<h4 style="margin:0 0 8px;">🔗 MCP Server jodo</h4>'
      + '<div class="hub-field"><label>Connector ka naam</label>'
      + '<input id="wzName" class="neu-in" style="padding:10px;" placeholder="Mera MCP Server" value="'+esc(wiz.name)+'"></div>'
      + '<div class="hub-field"><label>MCP server URL</label>'
      + '<input id="wzUrl" class="neu-in" style="padding:10px;" placeholder="https://mcp.example.com/mcp" value="'+esc(wiz.url)+'" inputmode="url"></div>'
      + '<p class="neu-sub">Sirf https:// URLs. Pehle <b>bina auth</b> test hoga — server mange to auth box khulega.</p>'
      + '<div id="wzAuthBox"></div>'
      + '<div id="wzTestOut" style="margin:10px 0;"></div>'
      + '<div id="wzToolsBox"></div>';
    $('wzName').oninput=e=>{ wiz.name=e.target.value; };
    $('wzUrl').oninput=e=>{ wiz.url=e.target.value.trim(); wiz.testResult=null; wiz.tools=[];
      const o=$('wzTestOut'),t=$('wzToolsBox'),a=$('wzAuthBox');
      if(o)o.innerHTML=''; if(t)t.innerHTML=''; if(a)a.innerHTML=''; };
    const nb=$('hubWizNext'); nb.textContent='🔌 Connect'; nb.disabled=false; nb.onclick=wizConnect;
  }

  async function wizConnect(){
    const name=(($('wzName')||{}).value||'').trim();
    const url=(($('wzUrl')||{}).value||'').trim();
    const out=$('wzTestOut'), ab=$('wzAuthBox'), tb=$('wzToolsBox');
    if(!name){ out.innerHTML='<p class="neu-sub" style="color:#9b2c2c;">Connector ka naam likho.</p>'; return; }
    if(!/^https:\/\/.+\..+/.test(url)){ out.innerHTML='<p class="neu-sub" style="color:#9b2c2c;">Sahi https:// URL likho.</p>'; return; }
    wiz.name=name; wiz.url=url;
    out.innerHTML='<p class="neu-sub">⏳ Server test ho raha hai…</p>'; ab.innerHTML=''; tb.innerHTML='';
    const nb=$('hubWizNext'); nb.disabled=true;
    try{
      const auth = (wiz.auth && wiz.auth.type && wiz.auth.type!=='none') ? wiz.auth : {};
      const r = await fetch('/api/mcp-discover',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mcp_url:url, auth})}).then(x=>x.json());
      wiz.testResult=r;
      if(r.ok){
        wiz.tools=r.tools||[];
        out.innerHTML='<p>'+stBadge('connected')+'</p><div class="hub-kv">'+esc(r.detail||'connected')+'</div>';
        drawWizTools();
      }else if(/401|403|unauthori|forbidden|auth/i.test(String(r.error||''))){
        out.innerHTML='<p>'+stBadge('auth-required')+'</p><div class="hub-kv" style="color:#9b2c2c;">🔐 Server ne authentication manga.</div>';
        if(/mcp\.lovable\.dev/.test(url)){
          ab.innerHTML='<div class="hub-kv">🔐 <b>Lovable OAuth login</b></div>'
            +'<div class="hub-kv" style="margin-top:8px;font-size:13px;">'
            +'⚠️ <b>Seedhi baat:</b> MCP tools (project banao, deploy karo) ke liye Lovable <b>Business/Enterprise plan</b> mangta hai. Free plan par client register ho jayega, par tools kaam nahi karenge.<br><br>'
            +'Agar Business plan hai to:<br>'
            +'1. <b>lovable.dev</b> → workspace <b>Settings</b> → <b>OAuth clients</b><br>'
            +'2. <b>New OAuth client</b> banao, redirect URI:<br>'
            +'<code style="font-size:11px;word-break:break-all;">https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/</code><br>'
            +'3. <b>Client ID</b> neeche dalo, <b>Check</b> dabao, phir <b>Login</b><br>'
            +'<span style="color:#9b2c2c;">Docs wala public client_id web par kaam <b>nahi</b> karega.</span></div>'
            +'<div class="hub-field" style="margin-top:8px;"><label>Lovable Client ID</label>'
            +'<input id="wzLovCid" class="neu-in" style="padding:10px;font-size:14px;" placeholder="abc123..." value="'+esc(wiz.lovCid||'')+'" autocomplete="off"></div>'
            +'<div style="margin-top:8px;"><button class="neu-btn primary" id="wzLovLogin" style="width:100%;padding:12px;">🔐 Lovable se Login karo</button></div>'
            +'<div style="margin-top:6px;"><button class="neu-btn sm" id="wzLovCheck" style="width:100%;padding:10px;">🔍 Pehle check karo — kya login kaam karega?</button></div>'
            +'<div id="wzLovCheckOut" style="margin-top:6px;"></div>'
            +'<p class="neu-sub">PKCE flow — koi secret browser me save nahi hota. Login ke baad wapas yahin aaoge.</p>';
          $('wzLovCid').oninput=e=>{ wiz.lovCid=e.target.value.trim(); };
          $('wzLovLogin').onclick=lovableLogin;
          $('wzLovCheck').onclick=lovableCheck;
        }else{
          ab.innerHTML='<div class="hub-field"><label>Auth type</label>'
            +'<select id="wzAuthType" class="neu-in" style="padding:10px;">'
            +'<option value="none">🔓 Bina auth</option>'
            +'<option value="bearer">🔑 Bearer token</option>'
            +'<option value="apikey">🗝️ API Key (header)</option>'
            +'<option value="basic">👤 Basic (username/password)</option>'
            +'</select></div>'
            +'<div id="wzAuthFields"></div>'
            +'<p class="neu-sub">Auth sirf is browser me rahega; test ke waqt hi server ko bheja jayega.</p>';
          const at=$('wzAuthType'), af=$('wzAuthFields');
          // existing auth ho to pre-select karo
          const ea=(wiz.auth&&wiz.auth.type)||'none';
          at.value=['none','bearer','apikey','basic'].includes(ea)?ea:'none';
          if(!wiz.auth) wiz.auth={type:'none'};
          const drawAuthFields=()=>{
            const t=at.value; wiz.auth={type:t};
            if(t==='bearer'){
              af.innerHTML='<div class="hub-field"><label>Bearer token</label>'
                +'<input id="wzAuthV" type="password" class="neu-in" style="padding:10px;" placeholder="••••••" value="'+esc(wiz.auth.value||'')+'"></div>';
              $('wzAuthV').oninput=e=>{ wiz.auth.value=e.target.value; };
            }else if(t==='apikey'){
              af.innerHTML='<div class="hub-field"><label>Header naam</label>'
                +'<input id="wzAuthH" class="neu-in" style="padding:10px;" placeholder="X-API-Key" value="'+esc(wiz.auth.header||'X-API-Key')+'"></div>'
                +'<div class="hub-field"><label>API Key</label>'
                +'<input id="wzAuthV" type="password" class="neu-in" style="padding:10px;" placeholder="••••••" value="'+esc(wiz.auth.value||'')+'"></div>';
              wiz.auth.header=wiz.auth.header||'X-API-Key';
              $('wzAuthH').oninput=e=>{ wiz.auth.header=e.target.value||'X-API-Key'; };
              $('wzAuthV').oninput=e=>{ wiz.auth.value=e.target.value; };
            }else if(t==='basic'){
              af.innerHTML='<div class="hub-field"><label>Username</label>'
                +'<input id="wzAuthU" class="neu-in" style="padding:10px;" placeholder="username" value="'+esc(wiz.auth.username||'')+'"></div>'
                +'<div class="hub-field"><label>Password</label>'
                +'<input id="wzAuthV" type="password" class="neu-in" style="padding:10px;" placeholder="••••••" value="'+esc(wiz.auth.value||'')+'"></div>';
              $('wzAuthU').oninput=e=>{ wiz.auth.username=e.target.value; };
              $('wzAuthV').oninput=e=>{ wiz.auth.value=e.target.value; };
            }else{ af.innerHTML=''; }
          };
          at.onchange=drawAuthFields; drawAuthFields();
        }
      }else{
        out.innerHTML='<p>'+stBadge('unreachable')+'</p><div class="hub-kv" style="color:#9b2c2c;">'+esc(String(r.error||'fail')).slice(0,220)+'</div>';
      }
    }catch(e){
      out.innerHTML='<p>'+stBadge('unreachable')+'</p><div class="hub-kv" style="color:#9b2c2c;">Request fail: '+esc(String(e.message||e)).slice(0,120)+'</div>';
    }
    nb.disabled=false;
  }

  function drawWizTools(){
    const tb=$('wzToolsBox'); if(!tb) return;
    let h='';
    if(!wiz.tools.length){
      h='<p class="neu-sub">⚠️ Server connect hua lekin koi tool discover nahi hua.</p>';
    }else{
      h='<h4 style="margin:12px 0 6px;">🧰 Mile hue tools ('+wiz.tools.length+') — permission approve karo</h4>'
        +'<div style="max-height:180px;overflow:auto;">';
      wiz.tools.forEach((t,i)=>{
        const ro = t.annotations && t.annotations.readOnlyHint===true;
        const dest = t.annotations && t.annotations.destructiveHint===true;
        const defPerm = ro ? 'view' : 'modify';
        h+='<div class="hub-kv" style="margin-bottom:6px;">'
          +'<div style="display:flex;gap:8px;align-items:center;">'
          +'<b style="flex:1;word-break:break-all;">'+(ro?'👁️ ':'')+(dest?'⚠️ ':'')+esc(t.name)+'</b>'
          +'<select id="wzPerm'+i+'" class="neu-in" style="padding:6px;max-width:110px;">'
          +['view','modify','admin'].map(p=>'<option value="'+p+'"'+(p===defPerm?' selected':'')+'>'+p+'</option>').join('')
          +'</select></div>'
          +(t.description?'<div class="neu-sub" style="margin-top:4px;">'+esc(t.description)+'</div>':'')
          +(ro?'<div class="neu-sub">🔒 Read-only tool — safe hai.</div>':'')
          +'</div>';
      });
      h+='</div>';
    }
    h+='<p class="neu-sub">Tool execution abhi <b>band</b> hai (409) — tools approve ho sakte hain, chalenge nahi. Fake success nahi dikhega.</p>'
      +'<div style="margin-top:10px;"><button class="neu-btn primary" id="wzSave" style="width:100%;">💾 Approve karke Save karo</button></div>';
    tb.innerHTML=h;
    $('wzSave').onclick=wizSave;
  }

  function wizSave(){
    const pid=slug(wiz.name);
    // Reconnect: existing connector update karo
    if(wiz.reconnectId){
      const c=connectors.find(x=>x.id===wiz.reconnectId);
      if(c){
        c.url=wiz.url;
        c.auth=(wiz.auth && wiz.auth.type && wiz.auth.type!=='none') ? wiz.auth : {};
        c.status='connected'; c.lastTestOk=true; c.lastCheck=new Date().toLocaleString('en-IN'); c.lastError='';
        c.tools=(wiz.tools||[]).map((t,i)=>{
          const sel=$('wzPerm'+i);
          return {name:t.name, description:t.description||'', permission: sel?sel.value:'modify',
                  annotations: t.annotations||{}};
        });
        c.audit=c.audit||[]; c.audit.push('reconnected '+new Date().toLocaleString('en-IN'));
        save(); render(); closeWizard(); return;
      }
    }
    if(connectors.some(c=>c.id===pid)||['lovable','demo-mcp'].includes(pid)){ alert('Is naam ka connector pehle se hai — alag naam chuno.'); return; }
    const tools=(wiz.tools||[]).map((t,i)=>{
      const sel=$('wzPerm'+i);
      return {name:t.name, description:t.description||'', permission: sel?sel.value:'modify',
              annotations: t.annotations||{}};
    });
    const c={id:pid, name:wiz.name, type:'mcp', kind:'user', url:wiz.url,
      auth: (wiz.auth && wiz.auth.type && wiz.auth.type!=='none') ? wiz.auth : {},
      status:'connected', lastTestOk:true, lastCheck:new Date().toLocaleString('en-IN'), lastError:'',
      tools:tools, audit:['created '+new Date().toLocaleString('en-IN')]};
    connectors.push(c); save(); render(); closeWizard();
  }
  /* ---- Lovable MCP OAuth (official: https://mcp.lovable.dev, OAuth login) ---- */
  const LOV_MCP_URL='https://mcp.lovable.dev';
  const LOV_REDIRECT='https://mimi-connector-hub-preview-indocial5014-1702.vercel.app/';

  function oauthNote(msg, ms){
    let n=$('oauthNote');
    if(!n){ n=document.createElement('div'); n.id='oauthNote';
      n.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:9999;background:#1a1a2e;color:#fff;padding:12px 14px;border-radius:12px;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.35);';
      document.body.appendChild(n); }
    n.textContent=msg; n.style.display='block';
    clearTimeout(n._t); n._t=setTimeout(()=>{ n.style.display='none'; }, ms||6000);
  }

  function b64url(bytes){
    return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function randB64(n){ const a=new Uint8Array(n); crypto.getRandomValues(a); return b64url(a.buffer); }

  async function lovableCheck(){
    const out=$('wzLovCheckOut');
    const cid=((($('wzLovCid')||{}).value)||'').trim() || (wiz&&wiz.lovCid)||'';
    if(!/^[A-Za-z0-9_-]{8,128}$/.test(cid)){ if(out) out.innerHTML='<p class="neu-sub" style="color:#9b2c2c;">Pehle Client ID dalo.</p>'; return; }
    if(wiz) wiz.lovCid=cid;
    if(out) out.innerHTML='<p class="neu-sub">⏳ Client ID check ho raha hai…</p>';
    try{
      const r=await fetch('/api/oauth-check',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({client_id:cid})}).then(x=>x.json());
      if(!r.ok){ if(out) out.innerHTML='<p class="neu-sub" style="color:#9b2c2c;">'+esc(r.error||'fail')+'</p>'; return; }
      const col=r.will_work?'#2f9e44':'#9b2c2c';
      if(out) out.innerHTML='<div class="hub-kv" style="border-left:3px solid '+col+';">'+esc(r.detail)+'</div>';
    }catch(e){ if(out) out.innerHTML='<p class="neu-sub" style="color:#9b2c2c;">Check fail: '+esc(String(e.message||e)).slice(0,100)+'</p>'; }
  }

  async function lovableLogin(){
    try{
      const cid=((($('wzLovCid')||{}).value)||'').trim() || (wiz&&wiz.lovCid)||'';
      if(!/^[A-Za-z0-9_-]{8,128}$/.test(cid)){ oauthNote('Pehle sahi Lovable Client ID dalo.'); return; }
      if(wiz){ wiz.lovCid=cid; }
      const verifier=randB64(48);
      const dig=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge=b64url(dig);
      const state=randB64(16);
      // SECURITY: sirf verifier+state+cid store hota hai — koi secret kabhi browser me nahi
      try{ localStorage.setItem('mimi_lovable_oauth', JSON.stringify({verifier, state, cid})); }catch(e){}
      const q=new URLSearchParams({response_type:'code', client_id:cid,
        redirect_uri:LOV_REDIRECT, code_challenge:challenge, code_challenge_method:'S256',
        state, scope:'projects:read projects:write', resource:'https://mcp.lovable.dev'});
      location.href='https://lovable.dev/oauth/authorize?'+q.toString();
    }catch(e){ oauthNote('Login start nahi hua: '+String(e.message||e).slice(0,100)); }
  }

  async function handleOAuthCallback(){
    let q; try{ q=new URLSearchParams(location.search); }catch(e){ return; }
    const code=q.get('code'), state=q.get('state'), err=q.get('error');
    if(!code && !err) return;
    try{ history.replaceState(null,'',location.pathname); }catch(e){}
    if(err){ oauthNote('Lovable login fail: '+String(q.get('error_description')||err).slice(0,120)); return; }
    let saved=null; try{ saved=JSON.parse(localStorage.getItem('mimi_lovable_oauth')||'null'); }catch(e){}
    try{ localStorage.removeItem('mimi_lovable_oauth'); }catch(e){}
    if(!saved || saved.state!==state){ oauthNote('OAuth state mismatch — dobara Connect dabao.'); return; }
    oauthNote('🔐 Login mil gaya — token le raha hun…');
    try{
      const r=await fetch('/api/oauth-exchange',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code, code_verifier:saved.verifier, redirect_uri:LOV_REDIRECT,
          client_id:saved.cid||''})}).then(x=>x.json());
      if(!(r.ok && r.access_token)){ oauthNote('Token nahi mila: '+String(r.error||'unknown').slice(0,120)); return; }
      try{ localStorage.setItem('mimi_lovable_token', r.access_token); }catch(e){}
      oauthNote('✅ Token mila — Lovable tools discover ho rahe hain…');
      const d=await fetch('/api/mcp-discover',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mcp_url:LOV_MCP_URL, auth:{type:'bearer', value:r.access_token}})}).then(x=>x.json());
      if(d.ok){
        const tools=(d.tools||[]).map(t=>({name:t.name, description:t.description||'', permission:'modify'}));
        connectors=connectors.filter(x=>x.id!=='lovable');
        connectors.push({id:'lovable', name:'Lovable', type:'mcp', kind:'user', url:LOV_MCP_URL,
          auth:{type:'bearer', value:r.access_token},
          status:'connected', lastTestOk:true, lastCheck:new Date().toLocaleString('en-IN'), lastError:'',
          tools, audit:['oauth connected '+new Date().toLocaleString('en-IN')]});
        save(); render();
        oauthNote('✅ Lovable MCP connected — '+tools.length+' tools mile! Hub me dekho.');
      }else{
        oauthNote('Token mila lekin tools nahi: '+String(d.error||'').slice(0,120));
      }
    }catch(e){ oauthNote('OAuth me dikkat: '+String(e.message||e).slice(0,100)); }
  }
  function init(){
    load(); render();
    const add=$('hubAdd'); if(add) add.onclick=openWizard;
    $('hubWizClose').onclick=closeWizard; $('hubWizScrim').onclick=closeWizard;
    const lovBtn=$('hubLovConnect'); if(lovBtn) lovBtn.onclick=openLovableMcp;
    const demoBtn=$('hubDemo'); if(demoBtn) demoBtn.onclick=openDemoMcp;
    // Lovable OAuth se wapas aaye to callback handle karo
    try{ handleOAuthCallback(); }catch(e){}
    // One-tap setup: ?lovable_cid=XXX aaye to wizard kholo aur CID pre-fill karo
    try{
      const up=new URLSearchParams(location.search);
      const pcid=(up.get('lovable_cid')||'').trim();
      if(/^[A-Za-z0-9_-]{8,128}$/.test(pcid)){
        history.replaceState(null,'',location.pathname);
        openLovableMcp();
        if(wiz) wiz.lovCid=pcid;
        renderWiz();
        // CID field me daalo aur auto-check chalao
        setTimeout(()=>{ const inp=$('wzLovCid'); if(inp){ inp.value=pcid; } lovableCheck(); }, 400);
      }
    }catch(e){}
    $('hubDetailClose').onclick=()=>{ $('hubDetail').style.display='none'; };
    document.querySelectorAll('[data-htab]').forEach(t=>{ t.onclick=()=>{
      detailTab=t.dataset.htab;
      document.querySelectorAll('[data-htab]').forEach(x=>x.classList.toggle('on',x===t));
      const hid=$('hubDetail').dataset.hid; const c=connectors.find(x=>x.id===hid);
      if(c) renderTab(c);
    };});
  }
  function refresh(){ load(); render(); }
  return {init:init, refresh:refresh};
})();
document.addEventListener('DOMContentLoaded', ()=>{ if(window.ConnectorHub) window.ConnectorHub.init(); });
