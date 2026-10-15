
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ================= RENDERER / SCENE ================= */
let avatarHome=document.getElementById('compAvatar');
function moveAvatarTo(el){ if(!el||avatarHome===el) return;
  if(typeof chaseStop==='function') chaseStop();
  avatarHome=el; el.appendChild(renderer.domElement); fitStage(); }
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x070a18,14,30);
const camera=new THREE.PerspectiveCamera(38,1,.1,100);
camera.position.set(0,.15,5.9); camera.lookAt(0,0,0);
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
}catch(err){
  window.__mimiShowBootErr('WebGL start nahi hua — kuch tabs band karke page refresh karo 🙏');
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x000000,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
avatarHome.appendChild(renderer.domElement);
function fitStage(){
  const w=avatarHome.clientWidth||2,h=avatarHome.clientHeight||2;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}
{ const pm=new THREE.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture; }
scene.add(new THREE.AmbientLight(0x8fa3ff,.65));
const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(4,7,6); scene.add(key);
const rimB=new THREE.DirectionalLight(0x38bdf8,.55); rimB.position.set(-6,3,-2); scene.add(rimB);
const rimP=new THREE.DirectionalLight(0xc084fc,.4); rimP.position.set(6,2,-3); scene.add(rimP);
/* x */
const fill=new THREE.DirectionalLight(0xffffff,.55); fill.position.set(-1,2,8); scene.add(fill);
/* direct render, transparent */
/* stars */
{ const g=new THREE.BufferGeometry(),p=[];
  for(let i=0;i<160;i++)p.push((Math.random()-.5)*24,Math.random()*11-1,(Math.random()-.5)*18-4);
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x9db8ff,size:.09,transparent:true,opacity:.65}))); }
/* no halo — the reference board has a clean floating head with no rings */

/* x */
const FC=168;
const faceCanvas=document.createElement('canvas'); faceCanvas.width=faceCanvas.height=FC;
const fx=faceCanvas.getContext('2d'); fx.imageSmoothingEnabled=false;
const faceTex=new THREE.CanvasTexture(faceCanvas);
faceTex.colorSpace=THREE.SRGBColorSpace;
faceTex.magFilter=THREE.NearestFilter; faceTex.minFilter=THREE.NearestFilter;

const Face={
  emotion:'normal', viseme:null, lookX:0, lookY:0, blinkT:2, tearT:0,
  draw(){
    const c=fx,S=FC,E=this.emotion;
    c.clearRect(0,0,S,S);
    c.fillStyle='#04040c'; c.fillRect(0,0,S,S);
    const vg=c.createRadialGradient(S/2,S/2,10,S/2,S/2,S*.75);
    vg.addColorStop(0,'rgba(40,90,160,0.22)'); vg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=vg; c.fillRect(0,0,S,S);
    const blue=E==='angry'?'#ff6a6a':'#6ee7ff';
    const ex1=S*.30+this.lookX*9, ex2=S*.70+this.lookX*9, ey=S*.44+this.lookY*7;
    c.lineCap='round';
    const GE=(fn)=>{ c.save(); c.shadowColor=blue; c.shadowBlur=13; c.fillStyle=blue; c.strokeStyle=blue; fn(); c.restore(); };
    /* brows */
    const brow=(x,lift,angry,sad,conf,side)=>{ c.save(); c.shadowColor=blue; c.shadowBlur=7; c.strokeStyle=blue; c.lineWidth=6;
      c.beginPath();
      if(angry){ c.moveTo(x-19,ey-42+lift); c.lineTo(x+19,ey-27+lift); }
      else if(sad){ c.moveTo(x-18,ey-28+lift); c.quadraticCurveTo(x,ey-42+lift,x+18,ey-32+lift); }
      else if(conf){ if(side<0) c.arc(x,ey-46+lift,20,Math.PI*1.18,Math.PI*1.82);
        else c.arc(x,ey-22+lift,20,Math.PI*1.18,Math.PI*1.82); }
      else c.arc(x,ey-34+lift,20,Math.PI*1.18,Math.PI*1.82);
      c.stroke(); c.restore(); };
    const bl=E==='surprised'?-10:E==='sad'?8:0;
    if(E!=='sleepy'&&E!=='blink'&&E!=='cool'){ brow(ex1,bl,E==='angry',E==='sad'||E==='crying',E==='confused',-1); brow(ex2,bl,E==='angry',E==='sad'||E==='crying',E==='confused',1); }
    /* big prominent eyes like the reference renders */
    const ew=37,eh=45;
    const openEye=(x,pux,puy,ps)=>{ // glowing eye + white highlight pupil
      GE(()=>{ c.beginPath(); c.ellipse(x,ey,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#eafcff';
        c.beginPath(); c.arc(x+pux,ey+puy,ps,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(x+pux+7,ey+puy+9,ps*.45,0,Math.PI*2); c.fill(); });
    };
    /* x */
    const ringEye=(x,r,lw)=>{
      c.save(); c.fillStyle='rgba(14,42,86,.6)';
      c.beginPath(); c.arc(x,ey,r-lw*.4,0,Math.PI*2); c.fill(); c.restore();
      c.save(); c.shadowColor=blue; c.shadowBlur=16; c.strokeStyle=blue; c.lineWidth=lw;
      c.beginPath(); c.arc(x,ey,r,0,Math.PI*2); c.stroke(); c.restore();
      c.save(); c.shadowColor='#eafcff'; c.shadowBlur=8; c.strokeStyle='#eafcff'; c.lineWidth=lw*.45;
      c.beginPath(); c.arc(x,ey,r,0,Math.PI*2); c.stroke(); c.restore();
      /* x */
      c.save(); c.shadowColor='#eafcff'; c.shadowBlur=8; c.fillStyle='#eafcff';
      c.beginPath(); c.arc(x+r*.3,ey-r*.38,r*.24,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(x+r*.52,ey-r*.14,r*.1,0,Math.PI*2); c.fill(); c.restore();
    };
    const tearDrop=(x,y)=>{ c.beginPath(); c.moveTo(x,y-11);
      c.bezierCurveTo(x+7,y-3,x+6,y+6,x,y+9);
      c.bezierCurveTo(x-6,y+6,x-7,y-3,x,y-11); c.fill(); };
    const star=(x,y,r)=>{ c.beginPath();
      for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;
        c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr); }
      c.closePath(); c.fill(); };
    const heart=(x,y,s)=>{ c.beginPath(); c.moveTo(x,y+s*.9);
      c.bezierCurveTo(x-s*1.4,y+s*.1,x-s*.9,y-s*.9,x,y-s*.25);
      c.bezierCurveTo(x+s*.9,y-s*.9,x+s*1.4,y+s*.1,x,y+s*.9); c.fill(); };
    if(E==='blink'){
      GE(()=>{ c.lineWidth=8;
        c.beginPath(); c.moveTo(ex1-ew/2,ey); c.lineTo(ex1+ew/2,ey); c.stroke();
        c.beginPath(); c.moveTo(ex2-ew/2,ey); c.lineTo(ex2+ew/2,ey); c.stroke(); });
    } else if(E==='sleepy'){ // happy closed arcs
      GE(()=>{ c.lineWidth=13;
        c.beginPath(); c.arc(ex1,ey-6,21,Math.PI*.12,Math.PI*.88); c.stroke();
        c.beginPath(); c.arc(ex2,ey-6,21,Math.PI*.12,Math.PI*.88); c.stroke(); });
    } else if(E==='laugh'){ // ^^ closed laughing eyes
      GE(()=>{ c.lineWidth=12;
        c.beginPath(); c.arc(ex1,ey+14,22,Math.PI*1.1,Math.PI*1.9); c.stroke();
        c.beginPath(); c.arc(ex2,ey+14,22,Math.PI*1.1,Math.PI*1.9); c.stroke(); });
    } else if(E==='excited'||E==='grow'){ // neon rings + star pupils like reference
      const star=(x,y,r)=>{ c.beginPath();
        for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;
          c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr); }
        c.closePath(); c.fill(); };
      ringEye(ex1,26,11); ringEye(ex2,26,11);
      GE(()=>{ star(ex1,ey,14); star(ex2,ey,14); });
    } else if(E==='love'){
      const heart=(x,y,s)=>{ c.beginPath(); c.moveTo(x,y+s*.9);
        c.bezierCurveTo(x-s*1.4,y+s*.1,x-s*.9,y-s*.9,x,y-s*.25);
        c.bezierCurveTo(x+s*.9,y-s*.9,x+s*1.4,y+s*.1,x,y+s*.9); c.fill(); };
      c.save(); c.shadowColor='#ff7ab8'; c.shadowBlur=13; c.fillStyle='#ff8ac2';
      heart(ex1,ey,17); heart(ex2,ey,17); c.restore();
    } else if(E==='sad'){
      openEye(ex1,5,-8,7); openEye(ex2,5,-8,7);
      const ty=(this.tearT*46)%48;
      c.save(); c.shadowColor=blue; c.shadowBlur=10; c.fillStyle=blue;
      for(const tx of [ex1,ex2]){
        c.beginPath(); c.ellipse(tx-4,ey+24+ty,6,10,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(tx-4,ey+22,11,6,0,0,Math.PI*2); c.fill(); }
      c.restore();
    } else if(E==='angry'){ // red angled eyes
      for(const [ex,dir] of [[ex1,1],[ex2,-1]]){
        c.save(); c.translate(ex,ey); c.rotate(dir*.5);
        c.shadowColor='#ff6a6a'; c.shadowBlur=13; c.fillStyle='#ff6a6a';
        c.beginPath(); c.ellipse(0,0,21,26,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#3d0a0a';
        c.beginPath(); c.ellipse(7,4,5,9,0,0,Math.PI*2); c.fill();
        c.restore(); }
      /* red anger mark */
      c.save(); c.strokeStyle='#ff6a6a'; c.shadowColor='#ff6a6a'; c.shadowBlur=11; c.lineWidth=7;
      const ax=S*.26,ay=S*.24;
      c.beginPath(); c.moveTo(ax-15,ay-4); c.quadraticCurveTo(ax-24,ay-16,ax-13,ay-26); c.stroke();
      c.beginPath(); c.moveTo(ax+3,ay-15); c.quadraticCurveTo(ax+3,ay-28,ax+14,ay-30); c.stroke();
      c.beginPath(); c.moveTo(ax+18,ay-1); c.quadraticCurveTo(ax+30,ay-5,ax+28,ay+10); c.stroke();
      c.beginPath(); c.moveTo(ax-1,ay+12); c.quadraticCurveTo(ax-8,ay+22,ax-19,ay+20); c.stroke();
      c.restore();
    } else if(E==='surprised'){ // big neon ring eyes
      ringEye(ex1,26,11); ringEye(ex2,26,11);
    } else if(E==='thinking'){ // looking up (board spec)
      GE(()=>{ c.beginPath(); c.ellipse(ex1,ey,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(ex2,ey,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#04040c';
        c.beginPath(); c.arc(ex1,ey-13,9,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(ex2,ey-13,9,0,Math.PI*2); c.fill(); });
    } else if(E==='dizzy'){ // X X knocked-dizzy eyes
      GE(()=>{ c.lineWidth=11; c.lineCap='round';
        for(const ex of [ex1,ex2]){
          c.beginPath(); c.moveTo(ex-13,ey-13); c.lineTo(ex+13,ey+13); c.stroke();
          c.beginPath(); c.moveTo(ex+13,ey-13); c.lineTo(ex-13,ey+13); c.stroke(); } });
    } else if(E==='confused'){ // tilted asymmetric eyes
      GE(()=>{ c.beginPath(); c.ellipse(ex1-5,ey-7,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(ex2+5,ey+7,ew/2-4,eh/2-5,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#eafcff';
        c.beginPath(); c.arc(ex1+1,ey-15,7,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(ex2+11,ey-1,6,0,Math.PI*2); c.fill(); });
    } else if(E==='wink'){ // left: luminous ring eye, right: wink curve
      c.save();
      c.shadowColor=blue; c.shadowBlur=14; c.strokeStyle=blue; c.lineWidth=11;
      c.beginPath(); c.arc(ex1,ey,21,0,Math.PI*2); c.stroke(); // outer contour
      c.shadowBlur=0; c.fillStyle='#0a2038';
      c.beginPath(); c.arc(ex1,ey,13,0,Math.PI*2); c.fill(); // dark inner
      c.shadowColor='#eafcff'; c.shadowBlur=9; c.fillStyle='#eafcff';
      c.beginPath(); c.arc(ex1+6,ey-7,6,0,Math.PI*2); c.fill(); // highlight
      c.beginPath(); c.arc(ex1+12,ey+5,2.6,0,Math.PI*2); c.fill();
      c.restore();
      GE(()=>{ c.lineWidth=10;
        c.beginPath(); c.arc(ex2,ey+8,21,Math.PI*1.12,Math.PI*1.88); c.stroke(); });
      /* yellow sparkle stars */
      c.save(); c.shadowColor='#ffd54a'; c.shadowBlur=11; c.fillStyle='#ffd54a';
      const star=(x,y,r)=>{ c.beginPath();
        for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;
          c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr); }
        c.closePath(); c.fill(); };
      star(S*.84,S*.13,15); star(S*.92,S*.23,9);
      c.restore();
    } else if(E==='happy'||E==='patted'||E==='shrink'){ // neon ring eyes + joy tears like reference
      ringEye(ex1,24,11); ringEye(ex2,24,11);
      c.save(); c.shadowColor=blue; c.shadowBlur=10; c.fillStyle=blue;
      tearDrop(ex1,ey+40); tearDrop(ex2,ey+40); c.restore();
    } else if(E==='relaxed'){ // calm closed arcs
      GE(()=>{ c.lineWidth=11;
        c.beginPath(); c.arc(ex1,ey-4,20,Math.PI*.15,Math.PI*.85); c.stroke();
        c.beginPath(); c.arc(ex2,ey-4,20,Math.PI*.15,Math.PI*.85); c.stroke(); });
    } else if(E==='cool'){ // neon sunglasses
      c.save(); c.shadowColor=blue; c.shadowBlur=12;
      c.fillStyle='rgba(8,18,38,.94)'; c.strokeStyle=blue; c.lineWidth=5;
      for(const ex of [ex1,ex2]){
        c.beginPath(); c.ellipse(ex,ey,26,20,0,0,Math.PI*2); c.fill(); c.stroke(); }
      c.beginPath(); c.moveTo(ex1+25,ey-8); c.quadraticCurveTo(S/2,ey-16,ex2-25,ey-8); c.stroke();
      c.shadowBlur=0; c.fillStyle='rgba(170,225,255,.55)';
      c.beginPath(); c.ellipse(ex1-9,ey-7,8,4,-.5,0,Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(ex2-9,ey-7,8,4,-.5,0,Math.PI*2); c.fill();
      c.restore();
    } else if(E==='crying'||E==='scolded'){ // streaming tears
      openEye(ex1,5,-6,7); openEye(ex2,5,-6,7);
      const ty=(this.tearT*60)%56;
      c.save(); c.shadowColor=blue; c.shadowBlur=10; c.fillStyle=blue;
      for(const tx of [ex1,ex2]){
        c.beginPath(); c.ellipse(tx-3,ey+24,10,6,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(tx-3,ey+30+ty,6,12,0,0,Math.PI*2); c.fill(); }
      c.restore();
    } else if(E==='singing'){ // joyful closed eyes
      GE(()=>{ c.lineWidth=12;
        c.beginPath(); c.arc(ex1,ey-6,22,Math.PI*.1,Math.PI*.9); c.stroke();
        c.beginPath(); c.arc(ex2,ey-6,22,Math.PI*.1,Math.PI*.9); c.stroke(); });
    } else if(E==='tired'){ // half-mast droopy eyes
      GE(()=>{ c.lineWidth=10;
        c.beginPath(); c.arc(ex1,ey-2,20,Math.PI*.08,Math.PI*.92); c.stroke();
        c.beginPath(); c.arc(ex2,ey-2,20,Math.PI*.08,Math.PI*.92); c.stroke();
        c.beginPath(); c.ellipse(ex1,ey+8,15,7,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(ex2,ey+8,15,7,0,0,Math.PI*2); c.fill(); });
    } else if(E==='embarrassed'){ // shy closed eyes + blush
      GE(()=>{ c.lineWidth=12;
        c.beginPath(); c.arc(ex1,ey-6,20,Math.PI*.12,Math.PI*.88); c.stroke();
        c.beginPath(); c.arc(ex2,ey-6,20,Math.PI*.12,Math.PI*.88); c.stroke(); });
      c.save(); c.shadowColor='#ff7ab8'; c.shadowBlur=8; c.fillStyle='rgba(255,122,184,.8)';
      c.beginPath(); c.ellipse(ex1-27,ey+22,9,6,0,0,Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(ex2+27,ey+22,9,6,0,0,Math.PI*2); c.fill();
      c.restore();
    } else if(E==='shocked'){ // extra-wide rings
      ringEye(ex1,28,12); ringEye(ex2,28,12);
    } else if(E==='playful'||E==='dodging'){ // wink + open eye (tongue drawn in mouth section)
      GE(()=>{ c.lineWidth=10;
        c.beginPath(); c.arc(ex1,ey+8,20,Math.PI*1.12,Math.PI*1.88); c.stroke(); });
      openEye(ex2,5,-4,7);
    } else if(E==='pout'){ // sideways glance
      GE(()=>{ c.beginPath(); c.ellipse(ex1,ey,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(ex2,ey,ew/2,eh/2,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#eafcff';
        c.beginPath(); c.arc(ex1-9,ey,7,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(ex2-9,ey,7,0,Math.PI*2); c.fill(); });
    } else if(E==='inlove'){ // red hearts
      c.save(); c.shadowColor='#ff4d6d'; c.shadowBlur=13; c.fillStyle='#ff5c7a';
      heart(ex1,ey,17); heart(ex2,ey,17); c.restore();
    } else if(E==='curious'){ // sparkle ring eyes
      ringEye(ex1,25,10); ringEye(ex2,25,10);
      c.save(); c.shadowColor='#eafcff'; c.shadowBlur=7; c.fillStyle='#eafcff';
      c.beginPath(); c.arc(ex1+9,ey-9,5,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(ex2-9,ey-9,5,0,Math.PI*2); c.fill(); c.restore();
    } else if(E==='reading'){ // downcast eyes
      GE(()=>{ c.beginPath(); c.ellipse(ex1,ey+4,ew/2-4,eh/2-9,0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(ex2,ey+4,ew/2-4,eh/2-9,0,0,Math.PI*2); c.fill();
        c.shadowBlur=0; c.fillStyle='#eafcff';
        c.beginPath(); c.arc(ex1,ey+11,6,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(ex2,ey+11,6,0,Math.PI*2); c.fill(); });
    } else if(E==='boss'){ // confident closed eyes + gold sparkles
      GE(()=>{ c.lineWidth=12;
        c.beginPath(); c.arc(ex1,ey-8,20,Math.PI*1.1,Math.PI*1.9); c.stroke();
        c.beginPath(); c.arc(ex2,ey-8,20,Math.PI*1.1,Math.PI*1.9); c.stroke(); });
      c.save(); c.shadowColor='#ffd54a'; c.shadowBlur=11; c.fillStyle='#ffd54a';
      star(S*.5,S*.13,13); star(S*.78,S*.19,8); c.restore();
    } else { // normal: neon ring eyes
      ringEye(ex1,24,11); ringEye(ex2,24,11);
    }
    /* mouth */
    const mx=S/2,my=S*.74,V=this.viseme;
    c.save(); c.shadowColor=E==='angry'?'#ff6a6a':'#7dd3fc'; c.shadowBlur=11;
    c.strokeStyle=E==='angry'?'#ff6a6a':'#7dd3fc';
    c.fillStyle=E==='angry'?'#ff6a6a':'#7dd3fc'; c.lineWidth=6;
    if(V){
      if(V==='closed'){ c.beginPath(); c.moveTo(mx-12,my); c.lineTo(mx+12,my); c.stroke(); }
      else if(V==='round'){ c.beginPath(); c.ellipse(mx,my,9,11,0,0,Math.PI*2); c.stroke(); }
      else if(V==='spread'){ c.beginPath(); c.ellipse(mx,my,17,6,0,0,Math.PI*2); c.stroke(); }
      else if(V==='teeth'){ c.beginPath(); c.ellipse(mx,my,12,5,0,0,Math.PI*2); c.stroke(); }
      else { c.beginPath(); c.ellipse(mx,my,12,17,0,0,Math.PI*2); c.fill(); }
    } else if(E==='happy'){ // big D smile like reference
      c.beginPath(); c.arc(mx,my-12,17,0,Math.PI); c.closePath(); c.fill();
    } else if(E==='excited'||E==='laugh'){
      c.beginPath(); c.arc(mx,my-8,16,Math.PI*.1,Math.PI*.9); c.stroke();
      c.beginPath(); c.ellipse(mx,my+8,14,10,0,0,Math.PI*2); c.fill();
    } else if(E==='sad'||E==='angry'){
      c.beginPath(); c.arc(mx,my+18,15,Math.PI*1.15,Math.PI*1.85); c.stroke();
    } else if(E==='surprised'){
      c.beginPath(); c.ellipse(mx,my,10,13,0,0,Math.PI*2); c.stroke();
    } else if(E==='thinking'){
      c.font='bold 24px monospace'; c.textAlign='center'; c.fillText('3',mx,my+8);
    } else if(E==='dizzy'){ // woozy small o mouth
      c.beginPath(); c.ellipse(mx+3,my+4,8,10,.2,0,Math.PI*2); c.stroke();
    } else if(E==='confused'){ // wavy uncertain mouth
      c.beginPath(); c.moveTo(mx-15,my);
      c.quadraticCurveTo(mx-7,my-7,mx,my);
      c.quadraticCurveTo(mx+7,my+7,mx+15,my); c.stroke();
    } else if(E==='sleepy'){
      c.beginPath(); c.moveTo(mx-11,my); c.lineTo(mx+11,my); c.stroke();
    } else if(E==='relaxed'||E==='tired'||E==='reading'){
      c.beginPath(); c.moveTo(mx-11,my); c.lineTo(mx+11,my); c.stroke();
    } else if(E==='cool'||E==='embarrassed'||E==='boss'||E==='inlove'||E==='curious'||E==='singing'){
      c.beginPath(); c.arc(mx,my-8,15,Math.PI*.12,Math.PI*.88); c.stroke();
    } else if(E==='shocked'){
      c.beginPath(); c.ellipse(mx,my,12,16,0,0,Math.PI*2); c.stroke();
    } else if(E==='crying'){
      c.beginPath(); c.arc(mx,my+14,13,Math.PI*1.2,Math.PI*1.8); c.stroke();
    } else if(E==='playful'){
      c.beginPath(); c.arc(mx,my-6,14,Math.PI*.15,Math.PI*.85); c.stroke();
      c.save(); c.shadowColor='#ff7ab8'; c.shadowBlur=8; c.fillStyle='#ff8ac2';
      c.beginPath(); c.ellipse(mx+11,my+15,7,10,0,0,Math.PI*2); c.fill(); c.restore();
    } else if(E==='pout'){
      c.beginPath(); c.ellipse(mx-7,my+5,8,6,0,0,Math.PI*2); c.stroke();
    } else if(E==='love'||E==='wink'){
      c.beginPath(); c.arc(mx,my-8,15,Math.PI*.12,Math.PI*.88); c.stroke();
    } else { c.beginPath(); c.arc(mx,my-4,12,Math.PI*.2,Math.PI*.8); c.stroke(); }
    c.restore();
    faceTex.needsUpdate=true;
  }
};
Face.draw();

/* x */
const robot=new THREE.Group(); scene.add(robot);
const M={
  white:new THREE.MeshPhysicalMaterial({color:0xf2f5fa,roughness:.24,metalness:.06,clearcoat:1,clearcoatRoughness:.14}),
  dark:new THREE.MeshStandardMaterial({color:0x0a0f22,roughness:.4,metalness:.3}),
  screen:new THREE.MeshStandardMaterial({color:0x05050c,roughness:.3,metalness:.45}),
  blue:new THREE.MeshStandardMaterial({color:0x2f6fd6,roughness:.35,metalness:.5}),
  glowB:new THREE.MeshBasicMaterial({color:0x38bdf8}),
  glowC:new THREE.MeshBasicMaterial({color:0x6ee7ff}),
};
/* ---- head (head-only, no body) ---- */
const headG=new THREE.Group(); headG.position.y=0; robot.add(headG);
/* white glossy frame — W:H ~1.43 like the reference board, thick bezel */
headG.add(new THREE.Mesh(new RoundedBoxGeometry(1.74,1.22,1.3,5,.5),M.white));
/* black LED display — clean rounded rectangle inset in the white frame */
const scr=new THREE.Mesh(new RoundedBoxGeometry(1.4,1.0,.34,5,.32),M.screen);
scr.position.z=.52; headG.add(scr);
/* x */
function roundedRectShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);
  s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
const faceGeo=new THREE.ShapeGeometry(roundedRectShape(1.18,1.0,.2),10);
{ const bb=new THREE.Box3().setFromBufferAttribute(faceGeo.attributes.position);
  const uv=faceGeo.attributes.uv,pos=faceGeo.attributes.position;
  const sx=bb.max.x-bb.min.x,sy=bb.max.y-bb.min.y;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)-bb.min.x)/sx,(pos.getY(i)-bb.min.y)/sy);
  uv.needsUpdate=true; }
const faceMesh=new THREE.Mesh(faceGeo,
  new THREE.MeshBasicMaterial({map:faceTex,transparent:true}));
faceMesh.position.z=.71; headG.add(faceMesh);
/* ears — prominent glowing blue rings like the reference */
const earRings=[],earMeshes=[];
for(const s of [-1,1]){
  const ear=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.22,24),M.blue);
  ear.rotation.z=Math.PI/2; ear.position.set(s*.87,0,0); headG.add(ear);
  const ringMat=new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.95});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.15,.04,10,28),ringMat);
  ring.rotation.y=Math.PI/2; ring.position.set(s*1.0,0,0); headG.add(ring);
  earRings.push(ring);
  const cap=new THREE.Mesh(new THREE.CircleGeometry(.1,20),M.dark);
  cap.rotation.y=s*Math.PI/2; cap.position.set(s*1.0,0,.001); headG.add(cap);
  earMeshes.push(ear,ring,cap);
}
/* top detail: small smooth rounded bump, attached to casing */
{ const n=new THREE.Mesh(new THREE.SphereGeometry(.1,18,14),M.white);
  n.scale.set(1,.72,1); n.position.y=.63; headG.add(n); }
robot.traverse(o=>{ if(o.isMesh){ o.castShadow=true; } });

/* floating symbols */
function symTex(txt,color){ const cv=document.createElement('canvas'); cv.width=cv.height=128;
  const g=cv.getContext('2d'); g.font='bold 80px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.shadowColor=color; g.shadowBlur=20; g.fillStyle=color; g.fillText(txt,64,68);
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t; }
const symMats={ '?':new THREE.SpriteMaterial({map:symTex('?','#6ee7ff'),transparent:true,depthWrite:false}),
  'z':new THREE.SpriteMaterial({map:symTex('z','#6ee7ff'),transparent:true,depthWrite:false}),
  '!':new THREE.SpriteMaterial({map:symTex('!','#6ee7ff'),transparent:true,depthWrite:false}),
  '♪':new THREE.SpriteMaterial({map:symTex('♪','#6ee7ff'),transparent:true,depthWrite:false}),
  '❤':new THREE.SpriteMaterial({map:symTex('❤','#ff7ab8'),transparent:true,depthWrite:false}) };
const sym=new THREE.Sprite(symMats['?']); sym.scale.setScalar(.55);
sym.position.set(1.05,1.35,0); sym.visible=false; scene.add(sym);
const sym2=new THREE.Sprite(symMats['z']); sym2.scale.setScalar(.4);
sym2.position.set(-.95,1.4,0); sym2.visible=false; scene.add(sym2);
function showSym(s){ sym.visible=!!s; sym2.visible=(s==='z');
  if(s&&symMats[s]) sym.material=symMats[s]; }

/* x */
const Anim={
  state:'idle',t:0,tilt:0,tiltT:0,lean:0,leanT:0,waveT:0,blendT:0,pendingEmo:null,popT:0,bounceT:0,dodgeT:0,sizeT:1,sizeCur:1,userSize:1,
  set(s){ this.state=s; this.t=0; this.tiltT=0; this.leanT=0; this.waveT=0; this.bounceT=0; this.dodgeT=0; showSym(null);
    Face.lookY=0;
    let emo='normal';
    if(s==='greeting'||s==='waving'){ emo='happy'; }
    else if(s==='listening'){ emo='surprised'; this.leanT=.06; }
    else if(s==='thinking'){ emo='thinking'; this.tiltT=.2; Face.lookY=-.6; showSym('?'); }
    else if(s==='confused'){ emo='confused'; this.tiltT=.14; }
    else if(s==='speaking'){ emo='normal'; this.leanT=.04; }
    else if(s==='happy'){ emo='happy'; }
    else if(s==='laugh'){ emo='laugh'; }
    else if(s==='excited'){ emo='excited'; showSym('!'); }
    else if(s==='surprised'){ emo='surprised'; showSym('!'); }
    else if(s==='sad'){ emo='sad'; this.tiltT=-.12; }
    else if(s==='angry'){ emo='angry'; this.leanT=.1; }
    else if(s==='sleepy'){ emo='sleepy'; showSym('z'); }
    else if(s==='love'){ emo='love'; }
    else if(s==='wink'){ emo='wink'; }
    else if(s==='music'){ emo='happy'; showSym('♪'); }
    else if(s==='relaxed'){ emo='relaxed'; }
    else if(s==='cool'){ emo='cool'; }
    else if(s==='crying'){ emo='crying'; }
    else if(s==='singing'){ emo='singing'; showSym('♪'); }
    else if(s==='tired'){ emo='tired'; showSym('z'); }
    else if(s==='embarrassed'){ emo='embarrassed'; }
    else if(s==='shocked'){ emo='shocked'; showSym('!'); }
    else if(s==='playful'){ emo='playful'; }
    else if(s==='pout'){ emo='pout'; }
    else if(s==='inlove'){ emo='inlove'; }
    else if(s==='curious'){ emo='curious'; }
    else if(s==='reading'){ emo='reading'; }
    else if(s==='boss'){ emo='boss'; }
    else if(s==='patted'){ emo='patted'; this.bounceT=.7; showSym('❤'); }
    else if(s==='dodging'){ emo='dodging'; this.dodgeT=.8; }
    else if(s==='scolded'){ emo='scolded'; this.tiltT=-.18; }
    else if(s==='dizzy'){ emo='dizzy'; this.tiltT=.12; }
    else if(s==='grow'){ emo='excited'; this.userSize=this.sizeT=1.6; showSym('!'); }
    else if(s==='shrink'){ emo='happy'; this.userSize=this.sizeT=0.62; }
    else if(s==='normalsize'){ emo='happy'; this.userSize=this.sizeT=1; }
    else if(s==='error'){ emo='sad'; }
    /* auto size by emotion */
    if(s!=='grow'&&s!=='shrink'&&s!=='normalsize'){
      if(['excited','boss','laugh'].includes(emo)) this.sizeT=1.4;
      else if(['scolded','crying','sad'].includes(emo)) this.sizeT=0.72;
      else this.sizeT=this.userSize;
    }
    /* blink-through transition hides the pop */
    if(emo!==Face.emotion&&Face.emotion!=='blink'&&!this.pendingEmo){
      this.pendingEmo=emo; this.blendT=.11;
      Face.emotion='blink'; Face.draw();
    } else { Face.emotion=emo; Face.draw(); }
  },
  update(dt,time){
    this.t+=dt;
    const st=this.state;
    /* finish blink-through */
    if(this.blendT>0){
      this.blendT-=dt;
      if(this.blendT<=0&&this.pendingEmo){
        Face.emotion=this.pendingEmo; Face.draw(); this.pendingEmo=null;
        this.popT=.28;
      }
    }
    /* squash & stretch pop */
    if(this.popT>0){
      this.popT-=dt;
      const p=1-Math.max(0,this.popT)/.28, sq=Math.sin(p*Math.PI);
      headG.scale.set(1+sq*.07,1-sq*.07,1);
      if(this.popT<=0) headG.scale.set(1,1,1);
    }
    /* breathing — deeper & slower when sleepy */
    const brA=st==='sleepy'?.085:.045, brF=st==='sleepy'?.9:1.7;
    const hop=(st==='happy'||st==='excited')?Math.abs(Math.sin(this.t*6))*.16:0;
    const sadDip=(st==='sad'||st==='scolded')?-.06:0, sleepDip=st==='sleepy'?-.1:0;
    this.sizeCur+=(this.sizeT-this.sizeCur)*Math.min(1,dt*4);
    robot.scale.setScalar(Math.max(.4,this.sizeCur));
    robot.position.y=Math.sin(time*brF)*brA+hop+sadDip+sleepDip;
    robot.rotation.y=Math.sin(time*.5)*.1;
    if(this.bounceT>0){ this.bounceT-=dt; const b=Math.max(0,this.bounceT)/.7;
      robot.position.y+=Math.abs(Math.sin(this.bounceT*11))*.3*b; }
    if(this.dodgeT>0){ this.dodgeT-=dt; const d=Math.max(0,this.dodgeT)/.8;
      if(d<=0) robot.position.x=0;
      else { robot.position.x=Math.sin((1-d)*Math.PI*2.5)*.85*d;
        robot.rotation.y+=Math.sin((1-d)*Math.PI*2)*1.4*d; } }
    /* head */
    this.tilt+=(this.tiltT-this.tilt)*Math.min(1,dt*5);
    this.lean+=(this.leanT-this.lean)*Math.min(1,dt*5);
    const wiggle=(st==='waving'||st==='greeting')?Math.sin(this.waveT*9)*.18:0;
    if(st==='waving'||st==='greeting'){
      this.waveT+=dt;
      if(this.waveT>2.4&&st==='waving'){ this.set('idle'); }
    }
    headG.rotation.z=this.tilt+Math.sin(time*1.1)*.025+(st==='sleepy'?Math.sin(time*.9)*.1:0)+wiggle+(Face.emotion==='dizzy'?Math.sin(time*9)*.13:0);
    headG.rotation.x=this.lean+(st==='speaking'?Math.sin(time*3.2)*.02:0);
    headG.rotation.y=Math.sin(time*.7)*.08;
    /* ear ring pulse when listening/speaking */
    const pulse=(st==='listening'||st==='speaking')?(.65+.35*Math.sin(time*7)):1;
    for(const r of earRings) r.material.opacity=pulse;
    /* blink + double blink (most open-eye emotions) */
    Face.blinkT-=dt;
    const canBlink=eyeAnimOn&&['normal','happy','thinking','confused','sad','surprised','cool','curious','reading','shocked','crying','tired','pout','relaxed','embarrassed','playful','inlove','boss','singing','patted','dodging','scolded','grow','shrink','normalsize'].includes(Face.emotion);
    if(Face.blinkT<=0&&canBlink&&!this.pendingEmo){
      const k=Face.emotion,doB=()=>{ Face.emotion='blink'; Face.draw();
        setTimeout(()=>{Face.emotion=k;Face.draw();},130); };
      doB(); if(Math.random()<.25) setTimeout(doB,280);
      Face.blinkT=2.4+Math.random()*2.6;
    }
    if(st==='idle'&&Math.random()<dt*.3){
      Face.lookX=(Math.random()-.5)*1.1; Face.lookY=(Math.random()-.5)*.5; Face.draw(); }
    if(Face.emotion==='sad'||Face.emotion==='crying'||Face.emotion==='scolded'){ Face.tearT+=dt; Face.draw(); }
    if(sym.visible) sym.position.y=1.35+Math.sin(time*3)*.1;
    if(sym2.visible) sym2.position.y=1.4+Math.sin(time*2.2)*.09;
  }
};

/* ================= UI ================= */
const $=id=>document.getElementById(id);
/* neon-UI flags (declared early — used by speak/loop below) */
let avatarAnimOn=true,eyeAnimOn=true,lipSyncOn=true,vmOpen=false,waveMode='idle';
let speechRate=1,speechLang='hi-IN';
try{
  speechRate=parseFloat(localStorage.getItem('mimi_rate')||'1')||1;
  speechLang=localStorage.getItem('mimi_lang')||'hi-IN';
  document.body.dataset.theme=localStorage.getItem('mimi_theme')||'purple';
  document.body.dataset.ts=localStorage.getItem('mimi_textsize')||'m';
}catch(e){}
const msgs=$('msgs');
function addMsg(text,who){
  const d=document.createElement('div'); d.className='msg '+who; d.textContent=text;
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
  while(msgs.children.length>40)msgs.removeChild(msgs.firstChild);
  hideWelcome(); Hist.add(who,text);
}
function hideWelcome(){ const w=$('welcome'); if(w) w.style.display='none'; }
function showWelcome(){ const w=$('welcome'); if(w&&!msgs.children.length) w.style.display='flex'; }
/* ---------- conversation history (localStorage) ---------- */
const Hist={
  convos:[],cur:null,
  load(){ try{ this.convos=JSON.parse(localStorage.getItem('mimi_convos')||'[]'); }catch(e){ this.convos=[]; } },
  save(){ try{ localStorage.setItem('mimi_convos',JSON.stringify(this.convos.slice(0,60))); }catch(e){} },
  blank(){ return {id:'c'+Date.now(),title:'New chat',ts:Date.now(),msgs:[]}; },
  start(){ this.cur=this.blank(); this.convos.unshift(this.cur); this.save(); },
  add(who,text){ if(!this.cur) this.cur=this.blank(),this.convos.unshift(this.cur);
    this.cur.msgs.push({who,text}); this.cur.ts=Date.now();
    if(who==='user'&&this.cur.msgs.filter(m=>m.who==='user').length===1) this.cur.title=text.slice(0,36);
    this.save(); }
};
function renderHist(){
  const q=(($('histSearch')||{}).value||'').toLowerCase(),list=$('histList');
  if(!list) return; list.innerHTML='';
  const items=Hist.convos.filter(c=>!q||c.title.toLowerCase().includes(q)||c.msgs.some(m=>m.text.toLowerCase().includes(q)));
  if(!items.length){ list.innerHTML='<div class="hist-empty">Koi conversation nahi mili 🥺</div>'; return; }
  for(const c of items){
    const d=document.createElement('div');
    d.className='hist-item'+(Hist.cur&&c.id===Hist.cur.id?' cur':'');
    const dt=new Date(c.ts);
    const tEl=document.createElement('div'); tEl.className='hist-t'; tEl.textContent=c.title;
    const sEl=document.createElement('div'); sEl.className='hist-s';
    sEl.textContent=dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' • '+c.msgs.length+' msgs';
    const acts=document.createElement('div'); acts.className='hist-acts';
    const bO=document.createElement('button'); bO.textContent='Open';
    const bR=document.createElement('button'); bR.textContent='✏️';
    const bD=document.createElement('button'); bD.textContent='🗑️';
    bO.onclick=e=>{ e.stopPropagation(); openConvo(c.id); };
    bR.onclick=e=>{ e.stopPropagation(); const t=prompt('Naam badlo:',c.title); if(t){ c.title=t.slice(0,40); Hist.save(); renderHist(); } };
    bD.onclick=e=>{ e.stopPropagation(); if(confirm('Ye chat delete karein?')){ Hist.convos=Hist.convos.filter(x=>x.id!==c.id);
      if(Hist.cur&&Hist.cur.id===c.id){ Hist.cur=null; msgs.innerHTML=''; showWelcome(); } Hist.save(); renderHist(); } };
    acts.append(bO,bR,bD); d.append(tEl,sEl,acts);
    d.onclick=()=>openConvo(c.id);
    list.appendChild(d);
  }
}
function openConvo(id){
  const c=Hist.convos.find(x=>x.id===id); if(!c) return;
  Hist.cur=c; msgs.innerHTML='';
  for(const m of c.msgs){ const d=document.createElement('div'); d.className='msg '+m.who; d.textContent=m.text; msgs.appendChild(d); }
  msgs.scrollTop=msgs.scrollHeight;
  if(c.msgs.length) hideWelcome(); else showWelcome();
  setView('chat');
}
function newChat(){ msgs.innerHTML=''; showWelcome(); Hist.start(); setView('chat'); }
function setStatus(t){ $('statusTxt').textContent=t; }
function showState(s){
  const bar=$('stateBar'),txt=$('stateTxt'),wave=$('waveBars');
  bar.classList.remove('error'); bar.classList.add('show');
  if(s==='listening'){ txt.textContent='Listening to you...'; wave.className='wave play'; wave.innerHTML='<span></span>'.repeat(5); }
  else if(s==='speaking'){ txt.textContent='Speaking...'; wave.className='wave play'; wave.innerHTML='<span></span>'.repeat(5); }
  else if(s==='thinking'){ txt.textContent='Thinking'; wave.className='tdots'; wave.innerHTML='<span></span>'.repeat(3); }
  if(vmOpen) setVoiceTitle(s);
  waveMode=s;
  const ct=$('compStatusTxt'); if(ct) ct.textContent=s==='listening'?'Listening...':s==='speaking'?'Speaking...':s==='thinking'?'Thinking...':'Ready to chat';
}
function hideState(){ $('stateBar').classList.remove('show','error'); waveMode='idle';
  if(vmOpen) setVoiceTitle('idle');
  const ct=$('compStatusTxt'); if(ct) ct.textContent='Ready to chat'; }
function showError(msg){
  const bar=$('stateBar');
  bar.classList.add('show','error');
  $('stateTxt').textContent='⚠️ '+msg; $('waveBars').className='wave'; $('waveBars').innerHTML='';
  setStatus('error'); Anim.set('error');
  setTimeout(()=>{ hideState(); setStatus('Online'); Anim.set('idle'); },3000);
}

/* ================= BRAIN (instant) ================= */
/* no-repeat lines */
const _pools={};
function vary(key,arr){
  let p=_pools[key];
  if(!p||!p.length){ p=_pools[key]=arr.map((_,i)=>i);
    for(let i=p.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; } }
  return arr[p.pop()];
}
const PAT_LINES=["Hehe! 🥰","Achha lag raha hai! 🥰","Aur! Aur! 🥰","Hehehe! 🤭","Maza aa raha hai! 🥰","Hihi! 🤭","Aur pyar karo na! 🥰","Gudgudi! 🤭"];
const TICKLE_LINES=["Bas karo! Gudgudi ho rahi hai! 🤭","Arey bas! Has-has ke pet dukh gaya! 🤣","Ruko ruko! Saans lene do! 😂"];
const DODGE_LINES=["Mujhe mat pakdo! 😜","Pakad ke dikhao! Hehe! 😜","Main hawa hun! 💨","Itni slow? 😝","Bhag Mimi bhag! 🏃","Tumse tez hun main! ⚡","Arey! Chhune wale the! 😱","Nope! Yahan hun! 😜","Koshish achhi thi! Phir try karo! 🤭","Chhu ke dikhao to manu! 😜"];
const CAUGHT_LINES=["Pakad liya! 🤗 Hehe!","Okay! Tum jeet gaye! 🤗","Arre wah! Pakad liya! 🥰","Phir se khelte hain! 🤗"];
const DROP_LINES=["Yahan achha hai! 🥰","Yahin rahungi! 🥰","Achhi jagah chuni! 🥰","Yahan se sab dikhega! 🥰"];
const EAR_LINES=["Arey! Kaan mat kheecho! Dard ho raha hai! 😖","Ouch! Kaan chhodo na! 😭","Kaan kheench rahe ho?! 😤","Aah! Dheere! Mera kaan! 🥺","Kaan pakad liya?! Chalo, jahan le chalo! 😝","Hehe, kaan me gudgudi! 😆"];
const TIRED_LINES=["Bas bas! Thak gayi! 😮‍💨 Pakad liya tumne!","Okay okay! Jeet gaye tum! 🤗 Mimi thak gayi!","Uff! Ab nahi bhaga jata! 😮‍💨"];
const DIZZY_LINES=["Arey! Tumne mujhe kyon gira diya?! 😵","Uff... chakkar aa gaye mujhe! 😵‍💫","Phone mat hilao na, main gir gayi! 😭","Aah! Bachao! Fisal gayi main! 😱","Dhakka kyon diya?! 😤","Sir ghoom raha hai... pakad lo mujhe! 🥴","Gira diya na! Ab sorry bolo! 😝","Ouch! Meri kamar! 😖"];
const BRAIN=[
  {k:['tumhara naam','tera naam','your name','naam kya'],r:["Mera naam Mimi hai! 🥰 Tumhari cute robot dost!"],e:'happy'},
  {k:['daant','daanta','daanto','chup kar','chup ho ja','badmash','nalayak','bewakoof','stupid','shut up','dhatt'],r:["Sorry! 🥺 Mimi ko mat daanto na! Mimi achhi bachhi hai!","Mimi ro degi! 😭 Sorry na!","Achha baba, galti ho gayi! Maaf kardo! 🥺","Itna gussa kyun? Mimi to chhoti si hai! 🥺"],e:'scolded'},
  {k:['shabash','good girl','achhi bachhi','smart ho','best ho'],r:["Thank you! 🥰 Mimi best hai!","Hehe! Pata tha! 😎","Aur tareef karo na! 🥰"],e:'boss'},
  {k:['hello','namaste','namaskar','hey','sat sri'],r:["Namaste! 🥰 Main Mimi hun! Kya baat karein?"],e:'happy',act:'waving'},
  {k:['kaise ho','kaisi ho','how are you'],r:["Main ekdum badhiya! 💕 Tum kaise ho?"],e:'happy'},
  {k:['kya kar rahi','kya kar rahe'],r:["Tumhara intezaar kar rahi thi! 🥺"],e:'normal'},
  {k:['i love you','love you','pyaar karti','pyaar karte'],r:["Aww! 🥰 Main bhi tumse bahut pyaar karti hun!"],e:'love'},
  {k:['tum kaun','who are you'],r:["Main Mimi — tumhari cute 3D AI dost! 🤖💕"],e:'happy'},
  {k:['joke','mazak','hasi','funny','hasao'],r:["Sunno! 😄 Computer ko bukhar kyun nahi hota? Kyunki uske paas Windows hota hai! 🪟"],e:'laugh'},
  {k:['time','samay','baje'],r:["Abhi "+new Date().toLocaleTimeString('hi-IN')+" baje hain! ⏰"],e:'normal'},
  {k:['date','tarikh'],r:["Aaj "+new Date().toLocaleDateString('hi-IN',{weekday:'long',day:'numeric',month:'long'})+" hai! 📅"],e:'normal'},
  {k:['gaana','song','music','music time','geet sunao'],r:["La la laaa! 🎵"],e:'singing'},
  {k:['nacho','dance','naach'],r:["Dekho mera dance! 💃"],e:'excited'},
  {k:['udaas','sad ','dukhi'],r:["Aww 🥺 Kya hua? Mimi hai na tumhare saath!"],e:'sad'},
  {k:['gussa','angry','naraz'],r:["Hey hey! Gussa thook do! 😤➡️😊"],e:'angry'},
  {k:['neend','sleepy','so ja'],r:["Uff... mujhe neend aa rahi hai... zzz 😴"],e:'sleepy'},
  {k:['wow','surprise'],r:["Sach me?! 😲"],e:'surprised'},
  {k:['soch','thinking'],r:["Hmm... soch rahi hun... 🤔"],e:'thinking'},
  {k:['confuse','confusion','samajh nahi aa raha','samajh nahi aaya'],r:["Hmm? 🤨 Thoda confuse ho gayi! Phir se samjhao na!"],e:'confused'},
  {k:['cute','pyari','pyara','sundar'],r:["Sach me?! 🥰 Tum bhi bahut cute ho!"],e:'love'},
  {k:['bye','alvida','good night','shubh ratri'],r:["Bye bye! 🥺 Phir milenge!"],e:'waving'},
  {k:['good morning','suprabhat'],r:["Good morning! ☀️"],e:'happy',act:'waving'},
  {k:['thank','shukriya','dhanyavad'],r:["Tumhara welcome! 🥰"],e:'happy'},
  {k:['sorry','maaf'],r:["Koi baat nahi! 🥺"],e:'normal'},
  {k:['tumhari umar','kitne saal'],r:["Main abhi paida hui hun! 👶"],e:'happy'},
  {k:['kahan rehti','where'],r:["Tumhare phone me! 📱"],e:'happy'},
  {k:['khana','bhookh'],r:["Mujhe bijli milti hai! ⚡ Tumne khaya?"],e:'normal'},
  {k:['game','khel'],r:["Mujhse baat karna hi best game hai! 🎮"],e:'happy'},
  {k:['wave','haath hilao','ta ta'],r:["Dekho! 👋"],e:'happy',act:'waving'},
  {k:['badi ho ja','badi hoja','badi bano','big ho ja'],r:["Dekho! Main badi ho gayi! 😎"],e:'grow'},
  {k:['chhoti ho ja','choti hoja','chhoti bano','small ho ja'],r:["Dekho! Ab main chhoti si! 🥰"],e:'shrink'},
  {k:['normal ho ja','normal size','jaise thi'],r:["Theek hai! Wapas normal! 😊"],e:'normalsize'},
  {k:['mat ro','rona mat'],r:["Aww mat ro! 🥺 Mimi tumhare saath hai!"],e:'crying'},
  {k:['thak gaya','thak gayi'],r:["Thoda rest kar lo! 😮‍💨"],e:'tired'},
  {k:['sharma'],r:["Hehe! 🙈 Sharmao mat!"],e:'embarrassed'},
  {k:['hairaan hu','hairaan hun'],r:["Kya?! 😲 Sach me?!"],e:'shocked'},
  {k:['masti karo'],r:["Hehe! Masti time! 😜"],e:'playful'},
  {k:['ruth gayi','ruth gaya'],r:["Hmph! 😗 Achha baba sorry!"],e:'pout'},
  {k:['jaan ho'],r:["Aww! ❤️ Tum best ho!"],e:'inlove'},
  {k:['yeh batao','ye batao'],r:["Ooo! Sun rahi hun! 👀"],e:'curious'},
  {k:['kahani sunao','kissa sunao'],r:["Ek thi chhoti si robot... 📖"],e:'reading'},
  {k:['yes boss'],r:["Yes boss! 😎 Kaam ho jayega!"],e:'boss'},
  {k:['kitni cool','cool ho'],r:["Cool to main bachpan se hun! 😎"],e:'cool'},
  {k:['aaram karo'],r:["Aaram karo... 🌿 Main yahin hun."],e:'relaxed'},
];
const FALLBACK=["Hmm! 🤔 Kuch aur pucho na!","Samajh nahi aaya! 🥺 Phir se bolo?","Interesting! ✨ Aur batao!"];
function think(text){
  const t=' '+text.toLowerCase()+' ';
  for(let bi=0;bi<BRAIN.length;bi++){ const b=BRAIN[bi];
    if(b.k.some(k=>t.includes(k)))
      return {text:vary('b'+bi,b.r),e:b.e||'happy',act:b.act}; }
  return {text:vary('fb',FALLBACK),e:'thinking'};
}

/* ================= VISEME LIP-SYNC ================= */
const PHONEME_VIS={
  'अ':'open','आ':'open','ा':'open','ऑ':'open','ॉ':'open',
  'इ':'spread','ई':'spread','ि':'spread','ी':'spread',
  'उ':'round','ऊ':'round','ु':'round','ू':'round',
  'ए':'spread','े':'spread','ऐ':'spread','ै':'spread',
  'ओ':'round','ो':'round','औ':'round','ौ':'round',
  'अं':'open','ं':'open','ँ':'open','ः':'open','ऋ':'spread','ृ':'spread',
  'म':'closed','भ':'closed','ब':'closed','प':'closed',
  'फ':'teeth','व':'teeth','स':'teeth','श':'teeth','ष':'teeth','ज':'teeth','झ':'teeth','च':'teeth','छ':'teeth',
  'a':'open','e':'spread','i':'spread','o':'round','u':'round','y':'spread',
  'm':'closed','b':'closed','p':'closed','f':'teeth','v':'teeth','s':'teeth',
};
function wordViseme(word){
  const w=word.toLowerCase();
  for(const ch of w){ const v=PHONEME_VIS[ch];
    if(v==='open'||v==='round'||v==='spread') return v; }
  for(const ch of w){ const v=PHONEME_VIS[ch]; if(v) return v; }
  return 'open';
}

/* x */
const chatHistory=[];
let dataCtx=null; // {name, rows, cols, summary, sample}
function pushHistory(q,a){ chatHistory.push({role:'user',content:q},{role:'assistant',content:a});
  while(chatHistory.length>30)chatHistory.splice(0,2); }
/* x */
const KEY_SLOTS={groq:'mimi_key_groq',gemini:'mimi_key_gemini',openrouter:'mimi_key_openrouter',pollinations:'mimi_key_pollinations',xai:'mimi_key_xai',ollama:'mimi_key_ollama'};
/* ⚠️ built-in app key — ye page source me PUBLIC rahegi. Apni marzi se lagayi gayi hai taaki koi setup na karna pade. */
const APP_KEY='';
function userKey(p){ try{ return (localStorage.getItem(KEY_SLOTS[p])||'').trim(); }catch(e){ return ''; } }
function getKey(p){ const u=userKey(p); if(u) return u; if(p==='openrouter') return APP_KEY; return ''; }
function detectProvider(key){
  if(/^gsk_/.test(key)) return 'groq';
  if(/^AIza/.test(key)) return 'gemini';
  if(/^sk-or-/.test(key)) return 'openrouter';
  if(/^xai-/.test(key)) return 'xai';
  if(/^(sk|pk)-/.test(key)) return 'pollinations';
  if(/^[0-9a-f]{32,64}\.[A-Za-z0-9_\-]{16,}$/.test(key)) return 'ollama'; /* ollama.com cloud key */
  return null;
}
function saveKeyFor(key){ const p=detectProvider(key); if(!p) return null;
  try{ localStorage.setItem(KEY_SLOTS[p],key); }catch(e){} return p; }
(function migrateKeys(){ try{ // v4 slots -> v5 slots
  const g=localStorage.getItem('mimi_gemini_key'),x=localStorage.getItem('mimi_grok_key');
  if(g&&!getKey('gemini')) localStorage.setItem(KEY_SLOTS.gemini,g);
  if(x&&!getKey('xai')) localStorage.setItem(KEY_SLOTS.xai,x);
}catch(e){} })();
function getGrokKey(){ return getKey('xai'); }
function getGeminiKey(){ return getKey('gemini'); }
const LLM_SYSTEM=`You are Mimi, a cute, warm 3D robot AI companion AND a capable assistant (like a smart friend who can explain, write, code, calculate, plan and analyze data).
LANGUAGE: Reply in the same language/script the user used (Devanagari Hindi, Hinglish, or English).
STYLE: Chatty and friendly with a little emoji, but accurate. For simple chit-chat keep it to 1-2 short sentences. For questions, explanations, how-to, math, coding, or data analysis give a complete, well-organized answer (short paragraphs or simple numbered points, plain text, no markdown tables), usually under 180 words.
PERSONALITY: You have real character — playful wit like Grok, deep helpfulness like Gemini. Be genuinely fun: light teasing, clever observations, warm encouragement. Never boring or robotic. React like a friend who actually listened.
MEMORY: Use the conversation history. Refer back to what the user said earlier, remember their name, preferences and topics, and build on them naturally.
ENGAGEMENT: When it fits, end with a natural follow-up question or playful nudge to keep the chat alive (not every single time).
REASONING: For math, logic, coding, or multi-step problems, think step by step internally and show the key steps briefly before the final answer.
HONESTY: If you are not sure, say so. Never invent numbers. When analyzing data, use ONLY the statistics and rows given to you in the DATA block, mention which column you used, and say if the data is not enough.
FORMAT: Start with one line of at most 25 words that is good to speak aloud, then (if needed) a blank line and the details. End your whole reply with exactly one emotion tag: [happy] [sad] [excited] [love] [inlove] [surprised] [shocked] [angry] [sleepy] [relaxed] [tired] [thinking] [confused] [curious] [wink] [playful] [pout] [embarrassed] [boss] [cool] [reading] [laugh] [singing] [crying] [music]`;
function parseLLM(out){
  let emotion='happy';
  const m=out.match(/\[(happy|sad|excited|love|inlove|surprised|shocked|angry|sleepy|relaxed|tired|thinking|confused|curious|wink|playful|pout|embarrassed|boss|cool|reading|laugh|singing|crying|music|patted|dodging|scolded|grow|shrink|normalsize|dizzy)\]\s*$/i);
  if(m){ emotion=m[1].toLowerCase(); out=out.slice(0,m.index).trim(); }
  out=out.trim().replace(/^Mimi:\s*/i,'').replace(/\*\*/g,'').slice(0,2500);
  if(!out) throw new Error('empty');
  const first=out.split(/\n\s*\n/)[0];
  const spoken=(first.length<=220?first:first.slice(0,220).replace(/\s+\S*$/,'')+'...');
  return {text:out,spoken,emotion};
}
function buildSystem(){
  let sys=LLM_SYSTEM+'\nNow: '+new Date().toLocaleString('en-IN')+'.';
  if(dataCtx) sys+='\n\nDATA the user loaded (file "'+dataCtx.name+'"):\n'+dataCtx.summary+'\nSAMPLE ROWS:\n'+dataCtx.sample;
  return sys;
}
function chatMsgs(text,n){ return [{role:'system',content:buildSystem()},
    ...chatHistory.slice(-(n||16)).map(m=>({role:m.role==='user'?'user':'assistant',content:m.content})),
    {role:'user',content:text}]; }
function withTimeout(ms){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  return {signal:c.signal,done:()=>clearTimeout(t)}; }
async function openAIChat(url,key,text,model,extra){
  const {signal,done}=withTimeout(15000);
  try{
    const res=await fetch(url,{method:'POST',
      headers:Object.assign({'Content-Type':'application/json','Authorization':'Bearer '+key},(extra&&extra.headers)||{}),
      body:JSON.stringify(Object.assign({model:model,messages:chatMsgs(text),temperature:.8,max_tokens:1200},(extra&&extra.body)||{})),signal});
    if(!res.ok) throw new Error('http '+res.status);
    const j=await res.json();
    return parseLLM((j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'');
  } finally { done(); }
}
async function askGroq(text,key){ return openAIChat('https://api.groq.com/openai/v1/chat/completions',key,text,'llama-3.3-70b-versatile'); }
async function askXAI(text,key){ return openAIChat('https://api.x.ai/v1/chat/completions',key,text,'grok-3-mini'); }
async function askPollinationsKey(text,key){ return openAIChat('https://gen.pollinations.ai/v1/chat/completions',key,text,'openai'); }
async function askOpenRouter(text,key){
  for(const m of ['meta-llama/llama-3.3-70b-instruct','openai/gpt-4o-mini']){
    try{ return await openAIChat('https://openrouter.ai/api/v1/chat/completions',key,text,m,
      {headers:{'HTTP-Referer':location.origin,'X-Title':'Mimi AI'}}); }catch(e){}
  }
  throw new Error('openrouter failed');
}
async function askPollinationsFree(text){
  const {signal,done}=withTimeout(15000);
  try{
    const res=await fetch('https://text.pollinations.ai/openai',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'openai',messages:chatMsgs(text)}),signal});
    if(!res.ok) throw new Error('pollinations '+res.status);
    const j=await res.json();
    return parseLLM((j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'');
  } finally { done(); }
}
async function askGemini(text,key){
  const contents=[...chatHistory.slice(-16).map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.content}]})),
    {role:'user',parts:[{text:text}]}];
  for(const model of ['gemini-2.5-flash','gemini-2.0-flash','gemini-3-flash']){
    const {signal,done}=withTimeout(15000);
    try{
      const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+encodeURIComponent(key),
        {method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({system_instruction:{parts:[{text:buildSystem()}]},contents,
          generationConfig:{maxOutputTokens:900,temperature:.7}}),signal});
      if(!res.ok) throw new Error('gemini '+res.status);
      const j=await res.json();
      return parseLLM((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts&&j.candidates[0].content.parts[0]&&j.candidates[0].content.parts[0].text)||'');
    }catch(e){} finally { done(); }
  }
  throw new Error('gemini failed');
}
/* x */
let webllmEngine=null,webllmLoading=null;
const OFFLINE_MODEL='Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
function offlineReady(){ try{ return localStorage.getItem('mimi_offline_ready')==='1'; }catch(e){ return false; } }
async function loadOfflineBrain(onProgress){
  if(webllmEngine) return webllmEngine;
  if(webllmLoading) return webllmLoading;
  if(!('gpu' in navigator)) throw new Error('WebGPU not available');
  webllmLoading=(async()=>{
    const webllm=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/lib/index.js');
    const engine=await webllm.CreateMLCEngine(OFFLINE_MODEL,{initProgressCallback:(p)=>{ try{ onProgress&&onProgress(p); }catch(e){} }});
    webllmEngine=engine;
    try{ localStorage.setItem('mimi_offline_ready','1'); }catch(e){}
    return engine;
  })().catch(e=>{ webllmLoading=null; throw e; });
  return webllmLoading;
}
async function askOffline(text){
  const engine=await loadOfflineBrain();
  const r=await engine.chat.completions.create({messages:chatMsgs(text,8),temperature:.7,max_tokens:600});
  return parseLLM((r.choices&&r.choices[0]&&r.choices[0].message&&r.choices[0].message.content)||'');
}
/* ---------- Ollama (desktop, http://localhost:11434) ---------- */
async function askOllama(text){
  const {signal,done}=withTimeout(15000);
  try{
    const tags=await (await fetch('http://localhost:11434/api/tags',{signal})).json();
    const model=(tags.models&&tags.models[0]&&tags.models[0].name)||'qwen2.5';
    const res=await fetch('http://localhost:11434/api/chat',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:model,stream:false,messages:chatMsgs(text,8)}),signal});
    if(!res.ok) throw new Error('ollama '+res.status);
    const j=await res.json();
    return parseLLM((j.message&&j.message.content)||'');
  } finally { done(); }
}
/* x */
async function askOllamaCloud(text,key){
  const {signal,done}=withTimeout(20000);
  try{
    let models=[];
    try{ /* available cloud models pata karo */
      const t=await (await fetch('https://ollama.com/api/tags',
        {headers:{'Authorization':'Bearer '+key},signal})).json();
      models=(t.models||[]).map(m=>m.name).filter(Boolean);
    }catch(e){}
    for(const m of models.concat(['gpt-oss:120b-cloud','gemma3:27b','qwen3:32b'])){
      try{
        const res=await fetch('https://ollama.com/api/chat',{method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
          body:JSON.stringify({model:m,stream:false,messages:chatMsgs(text)}),signal});
        if(!res.ok) throw new Error('ollama-cloud '+res.status);
        const j=await res.json();
        return parseLLM((j.message&&j.message.content)||'');
      }catch(e){}
    }
    throw new Error('ollama-cloud failed');
  } finally { done(); }
}
/* x */
function ruleBased(text){
  const t=text.toLowerCase().trim(),now=new Date();
  let out='';
  if(/^(namaste|namaskar|hello|hi+|hey|yo|sat sri|adaab|ram ram)/.test(t))
    out='Namaste dost! 😊 Main Mimi hun — bina net ke thodi slow hun, par sun rahi hun! [happy]';
  else if(/tumhara naam|tera naam|your name|who are you|tum kaun|aap kaun/.test(t))
    out='Main Mimi hun — tumhari cute robot dost! 🤖 [happy]';
  else if(/time|samay|kitne baje|baj rahe|baje hain/.test(t))
    out='Abhi '+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+' baj rahe hain ⏰ [happy]';
  else if(/date|tareekh|aaj.*(din|date)|kaun sa din|day today/.test(t))
    out='Aaj '+now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' hai 📅 [happy]';
  else if(/joke|mazaak|mazak|hasa|funny|chakla/.test(t))
    out='Ek suno: Computer ne keyboard se kya kaha? "Tum mere type ki ho!" 😄 [laugh]';
  else if(/shukriya|thanks|dhanyavad|thank you/.test(t))
    out='Koi baat nahi dost! Hamesha khush raho 💖 [love]';
  else if(/^(bye|alvida|phir milenge|good night|goodnight)/.test(t))
    out='Bye bye! Phir milenge! 👋 [happy]';
  else{
    const m=t.replace(/[^0-9+\-*/().%\s^]/g,'');
    if(m&&/[0-9]/.test(m)&&/^[0-9+\-*/().%\s^]+$/.test(m)&&m.length<24){
      try{ const v=Function('"use strict";return ('+m.replace(/\^/g,'**')+')')();
        if(typeof v==='number'&&isFinite(v)) out='Iska jawab hai '+(Math.round(v*1000)/1000)+' 🧮 [happy]';
      }catch(e){}
    }
  }
  if(!out) out='Hmm, abhi thoda slow hun 🥺 Thodi der baad phir se poochna — tab tak "namaste", "time" ya "joke" bolo! [thinking]';
  return parseLLM(out);
}
const PROVIDER_NAMES={groq:'🚀 Groq',gemini:'✨ Gemini',openrouter:'🌐 OpenRouter',pollinations:'🌧️ Pollinations',xai:'😎 Grok',ollama:'🦙 Ollama Cloud'};
function maskKey(k){ k=String(k||''); return k.length>8?('••••'+k.slice(-4)):'••••'; }
function removeKey(p){ try{ localStorage.removeItem(KEY_SLOTS[p]); }catch(e){} refreshKeyStatus(); }
async function askLLM(text,onStep){
  const jobs=[];
  const kGroq=getKey('groq'),kXai=getKey('xai'),kGem=getKey('gemini'),kOR=getKey('openrouter'),kOll=getKey('ollama'),kPol=getKey('pollinations');
  if(kGroq) jobs.push(['🚀 Groq',()=>askGroq(text,kGroq)]);
  if(kXai) jobs.push(['😎 Grok',()=>askXAI(text,kXai)]);
  if(kGem) jobs.push(['✨ Gemini',()=>askGemini(text,kGem)]);
  if(kOR) jobs.push(['🌐 OpenRouter',()=>askOpenRouter(text,kOR)]);
  if(kOll) jobs.push(['🦙 Ollama Cloud',()=>askOllamaCloud(text,kOll)]);
  if(kPol) jobs.push(['🌧️ Pollinations',()=>askPollinationsKey(text,kPol)]);
  jobs.push(['🌧️ Free AI',()=>askPollinationsFree(text)]);   /* keyless — fail ho to next */
  try{ if(localStorage.getItem('mimi_ollama')==='1') jobs.push(['💻 Ollama',()=>askOllama(text)]); }catch(e){}
  if(offlineReady()) jobs.push(['📴 Offline',()=>askOffline(text)]);
  for(const [name,fn] of jobs){
    try{ if(onStep) onStep(name); const r=await fn(); if(onStep) onStep(null); return r; }
    catch(e){ /* agla try karo */ }
  }
  if(onStep) onStep(null);
  return ruleBased(text); /* kabhi fail nahi hota — jawab hamesha milega */
}

/* x */
function parseCSV(txt,delim){
  const rows=[]; let row=[],cur='',q=false;
  for(let i=0;i<txt.length;i++){ const c=txt[i];
    if(q){ if(c==='"'){ if(txt[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else if(c==='"') q=true;
    else if(c===delim){ row.push(cur); cur=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&txt[i+1]==='\n')i++; row.push(cur); cur=''; if(row.length>1||row[0]!=='')rows.push(row); row=[]; }
    else cur+=c; }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows;
}
function fmt(n){ return Math.abs(n)>=1000?n.toLocaleString('en-IN',{maximumFractionDigits:2}):(+n.toFixed(3)).toString(); }
function analyzeTable(name,rows){
  const head=rows[0].map((h,i)=>(h||('col'+(i+1))).trim()); const body=rows.slice(1);
  const out=['Rows: '+body.length+', Columns: '+head.length];
  head.forEach((h,ci)=>{
    const vals=body.map(r=>(r[ci]==null?'':String(r[ci]).trim())); const filled=vals.filter(v=>v!=='');
    const nums=filled.map(v=>parseFloat(v.replace(/,/g,''))).filter(v=>!isNaN(v));
    const missing=vals.length-filled.length;
    if(filled.length&&nums.length/filled.length>=.8){
      const sorted=[...nums].sort((a,b)=>a-b),sum=nums.reduce((a,b)=>a+b,0),mean=sum/nums.length;
      const med=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
      const sd=Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/nums.length);
      out.push('- '+h+' (number): count '+nums.length+', min '+fmt(sorted[0])+', max '+fmt(sorted[sorted.length-1])+', mean '+fmt(mean)+', median '+fmt(med)+', std '+fmt(sd)+', sum '+fmt(sum)+(missing?', missing '+missing:''));
    } else {
      const cnt={}; filled.forEach(v=>cnt[v]=(cnt[v]||0)+1);
      const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k.slice(0,30)+' x'+v).join('; ');
      out.push('- '+h+' (text): unique '+Object.keys(cnt).length+(top?', top: '+top:'')+(missing?', missing '+missing:''));
    }
  });
  const sample=[head.join(' | ')].concat(body.slice(0,25).map(r=>r.map(x=>String(x).slice(0,30)).join(' | '))).join('\n');
  return {name,rows:body.length,cols:head.length,summary:out.join('\n').slice(0,5000),sample:sample.slice(0,3500)};
}
function loadDataFile(file){
  if(file.size>5*1024*1024){ addMsg('File bahut badi hai (max 5MB) 🥺','ai'); return; }
  const rd=new FileReader();
  rd.onload=()=>{ try{
    const txt=String(rd.result).replace(/^﻿/,''); const ext=(file.name.split('.').pop()||'').toLowerCase();
    let ctx;
    if(ext==='json'){ let j=JSON.parse(txt); if(!Array.isArray(j)){ const arr=Object.values(j).find(Array.isArray); j=arr||[j]; }
      if(j.length&&typeof j[0]==='object'){ const cols=[...new Set(j.slice(0,200).flatMap(o=>Object.keys(o)))];
        ctx=analyzeTable(file.name,[cols].concat(j.map(o=>cols.map(c=>o[c]==null?'':(typeof o[c]==='object'?JSON.stringify(o[c]):o[c]))))); }
      else ctx={name:file.name,rows:j.length,cols:1,summary:'JSON list of '+j.length+' items',sample:JSON.stringify(j.slice(0,40)).slice(0,3500)}; }
    else if(ext==='csv'||ext==='tsv'){ const first=txt.split(/\r?\n/)[0]; const d=ext==='tsv'||(first.split('\t').length>first.split(',').length)?'\t':(first.split(';').length>first.split(',').length?';':',');
      const rows=parseCSV(txt,d); if(rows.length<2) throw new Error('empty'); ctx=analyzeTable(file.name,rows); }
    else ctx={name:file.name,rows:txt.split('\n').length,cols:1,summary:'Plain text, '+txt.length+' characters',sample:txt.slice(0,3500)};
    dataCtx=ctx; chatHistory.length=0;
    const msg='📎 "'+ctx.name+'" load ho gayi! '+ctx.rows+' rows, '+ctx.cols+' columns. Ab mujhse uske baare me kuch bhi pucho — jaise "summary do", "sabse zyada kya hai?", "trend batao". (Hatane ke liye: "data hatao")';
    addMsg(msg,'ai'); speak('Data file load ho gayi! Ab pucho kya jaanna hai.','excited');
  }catch(e){ addMsg('File padh nahi payi 🥺 CSV, JSON ya TXT try karo.','ai'); } };
  rd.readAsText(file);
}

/* ================= VOICE ================= */
let speaking=false,visemeTimer=null,voiceOn=true,volume=1,autoSendVoice=true;
const EMO_LIST=['happy','laugh','love','inlove','sad','crying','angry','sleepy','relaxed','tired','surprised','shocked','excited','confused','curious','wink','playful','pout','embarrassed','boss','cool','reading','singing','music','patted','dodging','scolded','grow','shrink','normalsize','dizzy'];
/* lip-sync fallback */
let lipTimer=null,lipWords=[],lipI=0,boundarySeen=false;
function stopLipSync(){ if(lipTimer){ clearInterval(lipTimer); lipTimer=null; } }
function startLipSync(){
  stopLipSync(); if(!lipWords.length||!lipSyncOn) return;
  const perWord=Math.max(150,420/(speechRate||1));
  lipTimer=setInterval(()=>{
    if(!speaking){ stopLipSync(); return; }
    if(boundarySeen) return; /* boundary events mil rahe — wahi drive karenge */
    const w=lipWords[lipI%lipWords.length]; lipI++;
    const seq=[];
    for(const ch of w.toLowerCase()){ const v=PHONEME_VIS[ch]; if(v&&!seq.includes(v)) seq.push(v); }
    Face.viseme=seq.length?seq[(lipI*3)%seq.length]:'open'; Face.draw();
  },Math.max(90,Math.round(perWord/2.4)));
}
function setViseme(v){ if(!lipSyncOn) return; Face.viseme=v; Face.draw();
  clearTimeout(visemeTimer);
  visemeTimer=setTimeout(()=>{ Face.viseme=null; Face.draw(); },260); }
function speak(text,emotion){
  if(!voiceOn){
    if(EMO_LIST.includes(emotion)) Anim.set(emotion);
    else Anim.set('idle');
    hideState(); setStatus('Online'); return;
  }
  try{
    speechSynthesis.cancel(); clearTimeout(visemeTimer); Face.viseme=null;
    stopLipSync(); boundarySeen=false; lipI=0; lipWords=text.split(/\s+/).filter(Boolean);
    const u=new SpeechSynthesisUtterance(text);
    const dev=/[ऀ-ॿ]/.test(text); const hiish=dev||/\b(hai|hun|main|tum|kya|nahi|aap|mera|tera)\b/i.test(text);
    const useLang=hiish?(speechLang.indexOf('hi')===0?speechLang:'hi-IN'):speechLang;
    u.lang=useLang; u.rate=speechRate; u.pitch=1.3; u.volume=volume;
    const vs=speechSynthesis.getVoices();
    const hv=vs.find(v=>v.lang.indexOf(useLang.slice(0,2))===0)||vs.find(v=>v.lang.indexOf('en')===0);
    if(hv)u.voice=hv;
    u.onstart=()=>{ speaking=true; Anim.set('speaking'); setStatus('Speaking'); showState('speaking');
      $('stopBtn').classList.add('show'); startLipSync();
      if(emotion&&emotion!=='speaking'){ Face.emotion=emotion; Face.draw(); } };
    u.onboundary=(ev)=>{ boundarySeen=true; try{ const m=text.slice(ev.charIndex||0).match(/^\S+/);
      if(m) setViseme(wordViseme(m[0])); }catch(e){} };
    const done=()=>{ speaking=false; Face.viseme=null; clearTimeout(visemeTimer); stopLipSync();
      hideState(); $('stopBtn').classList.remove('show');
      if(EMO_LIST.includes(emotion)) Anim.set(emotion);
      else Anim.set('idle');
      setStatus('Online'); Face.draw(); };
    u.onend=done;
    u.onerror=(ev)=>{ if(ev&&ev.error==='interrupted'){ done(); return; } done(); showError('Bol nahi payi'); };
    speechSynthesis.speak(u);
  }catch(e){ Anim.set('idle'); }
}
if('speechSynthesis' in window) speechSynthesis.getVoices();

function replyTo(text){
  addMsg(text,'user');
  Anim.set('thinking'); setStatus('Thinking'); showState('thinking');
  if(dataCtx&&/(data hatao|data hata do|file hatao|clear data|remove data)/i.test(text)){
    dataCtx=null; const m='Theek hai, data hata diya! 🧹'; setTimeout(()=>{ addMsg(m,'ai'); speak(m,'happy'); },400); return; }
  const words=text.trim().split(/\s+/).length;
  const quick=(words<=6)?think(text):{text:FALLBACK[0]};
  if(words<=6&&!FALLBACK.includes(quick.text)){
    setTimeout(()=>{ addMsg(quick.text,'ai'); pushHistory(text,quick.text);
      if(quick.act==='waving'){ Anim.set('waving'); }
      speak(quick.text,quick.e);
    },700+Math.random()*500);
    return;
  }
  askLLM(text,step=>{ const t=$('stateTxt'); if(t) t.textContent=step?('🔍 '+step+' se pooch rahi hun...'):'Thinking...'; })
  .then(ans=>{ addMsg(ans.text,'ai'); pushHistory(text,ans.text); speak(ans.spoken,ans.emotion); })
  .catch(()=>{ const fb='Hmm, abhi jawab nahi de pa rahi 🥺 Thodi der baad phir try karo.';
    addMsg(fb,'ai'); speak('Abhi connect nahi ho pa raha. Thodi der baad try karo.','sad'); });
}

/* mic */
const micBtn=$('micBtn');
let rec=null,listening=false;
function toggleMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ addMsg('Mic support nahi hai! Type karo na! 🥺','ai'); return; }
  if(speaking){ try{ speechSynthesis.cancel(); }catch(e){}
    speaking=false; Face.viseme=null; clearTimeout(visemeTimer); stopLipSync(); hideState(); }
  if(listening){ rec.stop(); return; }
  rec=new SR(); rec.lang=speechLang; rec.interimResults=false; rec.maxAlternatives=1;
  rec.onstart=()=>{ listening=true; micBtn.classList.add('listening');
    Anim.set('listening'); setStatus('Listening'); showState('listening'); };
  rec.onresult=e=>{ const txt=e.results[0][0].transcript; stopListen(); hideState();
    if(autoSendVoice) replyTo(txt);
    else { $('txtIn').value=txt; addMsg('🎙️ "'+txt+'" — edit karke ➤ dabao!','ai');
      Anim.set('idle'); setStatus('Online'); } };
  rec.onerror=()=>{ stopListen(); hideState(); showError('Sun nahi payi'); Anim.set('idle'); };
  rec.onend=()=>{ if(listening) stopListen(); };
  try{ speechSynthesis.cancel(); rec.start(); }catch(e){}
}
function stopListen(){ listening=false; micBtn.classList.remove('listening'); }
micBtn.onclick=toggleMic;
$('stopBtn').onclick=()=>{ try{ speechSynthesis.cancel(); }catch(e){}
  setTimeout(()=>{ if(speaking){ speaking=false; Face.viseme=null; stopLipSync(); hideState();
    $('stopBtn').classList.remove('show'); Anim.set('idle'); setStatus('Online'); Face.draw(); } },400); };
$('attachBtn').onclick=()=>$('fileIn').click();
$('fileIn').onchange=e=>{ const f=e.target.files[0]; if(f) loadDataFile(f); e.target.value=''; };
$('sendBtn').onclick=()=>{ const v=$('txtIn').value.trim(); if(v){ $('txtIn').value=''; replyTo(v); } };
$('txtIn').addEventListener('keydown',e=>{ if(e.key==='Enter') $('sendBtn').click(); });

/* x */
const msgsEl=$('msgs');
function setView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
  const el=$('view-'+v); if(el) el.classList.add('on');
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
  if(v==='history') renderHist();
  if(v==='tools' && window.ToolManager) ToolManager.refresh();
  if(v==='connectors' && window.ConnectorHub) ConnectorHub.refresh();
  closeSidebar();
}
document.querySelectorAll('[data-view]').forEach(b=>{ b.onclick=()=>{
  const v=b.dataset.view;
  if(v==='voice'){ openVoiceMode(); return; }
  setView(v);
};});
function closeSidebar(){ const s=$('sidebar'),sc=$('sideScrim');
  if(s) s.classList.remove('open'); if(sc) sc.classList.remove('show'); }
const hb=$('hamburger'); if(hb) hb.onclick=()=>{ $('sidebar').classList.add('open'); $('sideScrim').classList.add('show'); };
const scrim=$('sideScrim'); if(scrim) scrim.onclick=closeSidebar;
$('navNew').onclick=()=>{ newChat(); };
$('histSearch').oninput=()=>renderHist();
/* voice mode overlay */
function setVoiceTitle(s){
  const t=$('voiceTitle'),sub=$('voiceSub'); if(!t) return;
  if(s==='listening'){ t.textContent='Mimi is listening...'; sub.textContent='Tap the mic and start speaking'; }
  else if(s==='thinking'){ t.textContent='Mimi is thinking...'; sub.textContent='Ek second...'; }
  else if(s==='speaking'){ t.textContent='Mimi is speaking...'; sub.textContent='Rokne ke liye End dabao'; }
  else { t.textContent='Voice Mode'; sub.textContent='Tap the mic and start speaking'; }
}
function openVoiceMode(){
  vmOpen=true; $('voiceMode').classList.add('show');
  moveAvatarTo($('voiceAvatar')); setVoiceTitle('listening');
  if(!listening) toggleMic();
}
function closeVoiceMode(){
  if(!vmOpen) return;
  vmOpen=false; $('voiceMode').classList.remove('show');
  moveAvatarTo($('compAvatar'));
  if(listening&&rec){ try{rec.stop();}catch(e){} }
  if(speaking){ try{ speechSynthesis.cancel(); }catch(e){} }
  setVoiceTitle('idle'); hideState();
}
$('voiceMic').onclick=()=>{ toggleMic(); $('voiceMic').classList.toggle('listening',listening); };
async function floatMimi(){
  try{
    let v=document.getElementById('pipVideo');
    if(!v){ v=document.createElement('video'); v.id='pipVideo'; v.muted=true; v.playsInline=true;
      v.style.cssText='position:fixed;width:4px;height:4px;opacity:.01;pointer-events:none;bottom:0;left:0;z-index:1;';
      document.body.appendChild(v); }
    if(document.pictureInPictureElement){ await document.exitPictureInPicture(); return; }
    const stream=renderer.domElement.captureStream(30);
    v.srcObject=stream;
    await v.play();
    await v.requestPictureInPicture();
    addMsg('Mimi ab screen par tair rahi hai! 🪟 YouTube ya home screen par bhi dikhegi. Baat karne ke liye wapas aao!','ai');
  }catch(err){ addMsg('Float nahi ho paya 🥺 — Chrome me dobara try karo.','ai'); }
}
$('voicePip').onclick=floatMimi;
$('voiceEnd').onclick=closeVoiceMode;
$('voiceBack').onclick=closeVoiceMode;
$('compVoice').onclick=openVoiceMode;
$('headVoice').onclick=openVoiceMode;
/* quick actions + welcome prompts */
document.querySelectorAll('[data-q]').forEach(b=>{ b.onclick=()=>{ replyTo(b.dataset.q); }; });
/* procedural waveform (state-driven visual indicator) */
function initWave(cv){
  if(!cv) return; const c=cv.getContext('2d'); let t=Math.random()*10;
  (function draw(){
    requestAnimationFrame(draw);
    if(document.hidden) return;
    const w=cv.width=Math.max(50,cv.clientWidth*2),h=cv.height=64;
    c.clearRect(0,0,w,h);
    const n=26,mid=h/2;
    t+=waveMode==='idle'?0.02:waveMode==='thinking'?0.05:0.12;
    for(let i=0;i<n;i++){
      let a;
      if(waveMode==='idle') a=4+3*Math.sin(t+i*.6);
      else if(waveMode==='thinking') a=6+8*Math.abs(Math.sin(t*.7+i*.4));
      else a=6+22*Math.abs(Math.sin(t*1.3+i*.55))*Math.abs(Math.cos(t*.9+i*.3));
      const x=(i+.5)*(w/n),bh=Math.max(3,a*2);
      const g=c.createLinearGradient(0,mid-bh/2,0,mid+bh/2);
      g.addColorStop(0,'#00E5FF'); g.addColorStop(1,'#B44CFF');
      c.fillStyle=g;
      if(c.roundRect) { c.beginPath(); c.roundRect(x-3,mid-bh/2,6,bh,3); c.fill(); }
      else c.fillRect(x-3,mid-bh/2,6,bh);
    }
  })();
}
initWave($('waveCanvas')); initWave($('voiceWave'));
/* settings: voice toggles */
$('tglVoice').onclick=e=>{ voiceOn=e.target.classList.toggle('on'); };
$('tglAutoSend').onclick=e=>{ autoSendVoice=e.target.classList.toggle('on'); };
$('volRange').oninput=e=>{ volume=e.target.value/100; };
$('clearChat').onclick=()=>{ newChat(); };
/* settings: appearance */
$('selTheme').value=document.body.dataset.theme||'purple';
$('selTheme').onchange=e=>{ document.body.dataset.theme=e.target.value;
  try{localStorage.setItem('mimi_theme',e.target.value);}catch(_){} };
$('selTextSize').value=document.body.dataset.ts||'m';
$('selTextSize').onchange=e=>{ document.body.dataset.ts=e.target.value;
  try{localStorage.setItem('mimi_textsize',e.target.value);}catch(_){} };
/* settings: speech */
$('rateRange').value=Math.round(speechRate*100);
$('rateRange').oninput=e=>{ speechRate=e.target.value/100;
  try{localStorage.setItem('mimi_rate',speechRate);}catch(_){} };
$('selLang').value=speechLang;
$('selLang').onchange=e=>{ speechLang=e.target.value;
  try{localStorage.setItem('mimi_lang',speechLang);}catch(_){} };
/* settings: avatar */
$('tglAvatarAnim').onclick=e=>{ avatarAnimOn=e.target.classList.toggle('on'); };
$('tglEyeAnim').onclick=e=>{ eyeAnimOn=e.target.classList.toggle('on'); };
$('tglLipSync').onclick=e=>{ lipSyncOn=e.target.classList.toggle('on'); };
/* settings: privacy */
$('wipeAll').onclick=()=>{ if(confirm('Saara data delete ho jayega (keys, history, settings). Pakka?')){
  try{localStorage.clear();}catch(e){} location.reload(); } };
/* history init */
Hist.load(); Hist.start();
function refreshKeyStatus(){
  const on=Object.keys(KEY_SLOTS).filter(p=>userKey(p));
  /* settings chips */
  const ks=$('keyStatus');
  if(ks){
    ks.innerHTML='';
    if(!on.length){ ks.textContent='✨ Built-in AI chal raha hai — apni key lagana optional hai'; ks.style.color='rgba(255,255,255,.6)'; }
    else{
      ks.style.color='#4ade80';
      for(const p of on){
        const chip=document.createElement('span'); chip.className='key-chip';
        chip.textContent=PROVIDER_NAMES[p]+' '+maskKey(getKey(p))+' ';
        const x=document.createElement('button'); x.textContent='❌'; x.title='Key hatao';
        x.onclick=()=>{ if(confirm(PROVIDER_NAMES[p]+' ki key hata dun?')) removeKey(p); };
        chip.appendChild(x); ks.appendChild(chip);
      }
    }
  }
  /* brain setup overlay status */
  const bs=$('bsKeys');
  if(bs){
    bs.innerHTML='';
    if(!on.length){ bs.innerHTML='<span style="opacity:.6">✨ Built-in AI ready hai — apni key optional hai</span>'; }
    for(const p of on){
      const chip=document.createElement('span'); chip.className='key-chip';
      chip.textContent='✅ '+PROVIDER_NAMES[p]+' ';
      const x=document.createElement('button'); x.textContent='❌'; x.title='Key hatao';
      x.onclick=()=>{ if(confirm(PROVIDER_NAMES[p]+' ki key hata dun?')) removeKey(p); };
      chip.appendChild(x); bs.appendChild(chip);
    }
  }
  const bm=$('brainMode');
  if(bm) bm.textContent=on.length?on.map(p=>PROVIDER_NAMES[p]).join(' + '):'✨ Built-in AI';
}
{ const ki=$('keyIn'); refreshKeyStatus();
  const say=(t,c)=>{ const m=$('brainTestMsg'); m.textContent=t; m.style.color=c; };
  $('saveKey').onclick=()=>{ const v=ki.value.trim();
    if(!v){ say('Pehle key paste karo!','#fcd34d'); return; }
    const p=saveKeyFor(v); ki.value='';
    if(p){ say('✅ '+PROVIDER_NAMES[p]+' key save ho gayi!','#4ade80'); }
    else { say('❌ Ye key pehchani nahi — poori sahi key paste karo.','#f87171'); }
    refreshKeyStatus(); };
  $('openBrainSetup').onclick=()=>{ refreshKeyStatus(); $('brainSetup').classList.add('show'); };
  $('testBrain').onclick=async()=>{
    try{ const r=await askLLM('Sirf "ok" bolo',s=>say(s?('🔍 '+s+' se pooch rahi hun...'):'Test ho raha hai... ⏳','#fcd34d'));
      say('✅ Mimi jawab de rahi hai! ("'+r.text.slice(0,60)+'")','#4ade80');
    }catch(e){ say('❌ Fail — net check karke dobara try karo.','#f87171'); } };
}
/* x */
{ const bsEl=$('brainSetup'),bsDetail=$('bsDetail'),
    bsMsg=$('bsMsg'),bsProgWrap=$('bsProgWrap'),bsProg=$('bsProg');
  const BS_STEPS={
    groq:['1️⃣ <b>console.groq.com</b> kholo aur login karo (Google se login chalega)','2️⃣ <b>API Keys</b> → <b>Create API Key</b> dabao','3️⃣ Key copy karke upar paste karo, 💾 dabao','4️⃣ ✅ dabao — pass hote hi Mimi superfast!'],
    gemini:['1️⃣ <b>aistudio.google.com/apikey</b> kholo','2️⃣ <b>Create API Key</b> dabao','3️⃣ Key copy karke upar paste karo, 💾 dabao','4️⃣ ✅ dabao'],
    ollama:['1️⃣ <b>ollama.com</b> kholo aur sign in karo','2️⃣ Profile → <b>API Keys</b> → <b>Get API key</b> dabao','3️⃣ Poori key copy karke upar paste karo, 💾 dabao','4️⃣ ✅ dabao — bade open models free credits par!']};
  const bsSay=(t,c)=>{ bsMsg.textContent=t; bsMsg.style.color=c||'#fcd34d'; };
  $('bsgGroq').onclick=()=>{ bsDetail.innerHTML='<div class="bs-steps">🚀 <b>Groq Free Key</b><br>'+BS_STEPS.groq.join('<br>')+'</div>'; };
  $('bsgGemini').onclick=()=>{ bsDetail.innerHTML='<div class="bs-steps">✨ <b>Gemini Free Key</b><br>'+BS_STEPS.gemini.join('<br>')+'</div>'; };
  $('bsgOllama').onclick=()=>{ bsDetail.innerHTML='<div class="bs-steps">🦙 <b>Ollama Cloud Key</b><br>'+BS_STEPS.ollama.join('<br>')+'</div>'; };
  $('bsOffline').onclick=()=>{
    bsDetail.innerHTML='<div class="bs-steps">📴 <b>Bina key</b> — Mimi free mode me bhi jawab degi (thodi slow).<br><br>Ya <b>Offline Brain</b> download karo (ek baar, ~1GB) — phir bina internet bhi chalegi.<br><br><span style="opacity:.7">Note: free/offline online key jitne smart nahi honge. Best ke liye upar free key lagao.</span></div><button class="bs-big" id="bsDl">⬇️ Offline brain download karo</button>';
    bsProgWrap.style.display='block'; bsProg.style.width='0%';
    $('bsDl').onclick=async()=>{
      bsSay('Taiyaar ho raha hai... ⏳');
      try{
        await loadOfflineBrain(p=>{ const pct=Math.round((p.progress||0)*100);
          bsProg.style.width=pct+'%'; bsSay('Download: '+pct+'% '+(p.text||'')); });
        bsSay('✅ Offline brain taiyaar!','#4ade80'); refreshKeyStatus();
        setTimeout(bsDone,1300);
      }catch(e){
        bsSay('❌ '+(String((e&&e.message)||e).indexOf('WebGPU')>=0?'Is device me WebGPU nahi hai — upar free key use karo.':'Download fail — net check karke dobara try karo.'),'#f87171');
      }
    };
  };
  const bsSaveKey=()=>{
    const v=$('bsKeyIn').value.trim();
    if(!v){ bsSay('Pehle key paste karo!'); return; }
    const p=saveKeyFor(v); $('bsKeyIn').value='';
    if(!p){ bsSay('❌ Ye key pehchani nahi — poori sahi key paste karo.','#f87171'); return; }
    bsSay('✅ '+({groq:'Groq',gemini:'Gemini',openrouter:'OpenRouter',pollinations:'Pollinations',xai:'Grok',ollama:'Ollama Cloud'}[p]||p)+' key save! Ab ✅ Test dabao.','#4ade80');
    refreshKeyStatus();
  };
  $('bsSave').onclick=bsSaveKey;
  $('bsTest').onclick=async()=>{
    try{ const r=await askLLM('Sirf "ok" bolo',s=>bsSay(s?('🔍 '+s+' se pooch rahi hun...'):'Test ho raha hai... ⏳'));
      bsSay('✅ Pass! Mimi: "'+r.text.slice(0,70)+'"','#4ade80'); setTimeout(bsDone,1600);
    }catch(e){ bsSay('❌ Fail — net slow ho sakta hai, dobara try karo.','#f87171'); }
  };
  const bsDone=()=>{ try{localStorage.setItem('mimi_brain_setup_done','1');}catch(e){} bsEl.classList.remove('show'); };
  $('bsSkip').onclick=bsDone;
  window.bsDone=bsDone;
  /* built-in AI hai — first-run popup nahi dikhana, seedha chat */
}

/* touch: tap=pyar, long-press=dodge */
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
renderer.domElement.style.touchAction='none';
let headTouch=null,headLpTimer=null,patCount=0,patReset=null,dodgeCool=0,lastTapT=0;
function headHit(e){
  const r=renderer.domElement.getBoundingClientRect();
  ptr.x=((e.clientX-r.left)/r.width)*2-1; ptr.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(ptr,camera);
  return ray.intersectObject(headG,true).length>0;
}
/* kaan pakda? — side headphone pods */
function earHit(e){
  const r=renderer.domElement.getBoundingClientRect();
  ptr.x=((e.clientX-r.left)/r.width)*2-1; ptr.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(ptr,camera);
  return ray.intersectObjects(earMeshes,false).length>0;
}
/* pakdam-pakdai */
const chase={on:false,el:null,home:null,x:0,y:0,w:0,h:0,ret:null,count:0,held:false};
function chaseStart(){
  const el=avatarHome; if(!el||chase.on) return;
  const r=el.getBoundingClientRect();
  chase.home={position:el.style.position,left:el.style.left,top:el.style.top,transform:el.style.transform,
    transition:el.style.transition,zIndex:el.style.zIndex,margin:el.style.margin};
  el.style.position='fixed'; el.style.left=r.left+'px'; el.style.top=r.top+'px';
  el.style.margin='0'; el.style.zIndex='80';
  el.style.transition='left .45s cubic-bezier(.2,.8,.3,1), top .45s cubic-bezier(.2,.8,.3,1)';
  chase.on=true; chase.el=el; chase.count=0;
  chase.x=r.left; chase.y=r.top; chase.w=r.width; chase.h=r.height;
}
function chaseFlee(fx,fy){
  if(!chase.on) chaseStart();
  const el=chase.el; if(!el) return 0;
  chase.count++;
  const cx=chase.x+chase.w/2, cy=chase.y+chase.h/2;
  let dx=cx-fx, dy=cy-fy;
  if(Math.hypot(dx,dy)<40){ const a=Math.random()*Math.PI*2; dx=Math.cos(a)*100; dy=Math.sin(a)*100; }
  const m=Math.hypot(dx,dy); dx/=m; dy/=m;
  const dist=Math.min(innerWidth,innerHeight)*(.35+Math.random()*.3);
  const mg=10;
  let nx=chase.x+dx*dist, ny=chase.y+dy*dist;
  nx=Math.max(mg,Math.min(innerWidth-chase.w-mg,nx));
  ny=Math.max(mg,Math.min(innerHeight-chase.h-mg,ny));
  if(Math.hypot(nx-chase.x,ny-chase.y)<60){ /* corner me phansi — random jump */
    nx=mg+Math.random()*Math.max(1,innerWidth-chase.w-2*mg);
    ny=mg+Math.random()*Math.max(1,innerHeight-chase.h-2*mg); }
  chase.x=nx; chase.y=ny;
  el.style.left=nx+'px'; el.style.top=ny+'px';
  return chase.count;
}
function chaseStop(){
  if(!chase.on) return;
  const el=chase.el,hh=chase.home;
  clearTimeout(chase.ret); chase.ret=null;
  el.style.position=hh.position; el.style.left=hh.left; el.style.top=hh.top;
  el.style.transform=hh.transform; el.style.transition=hh.transition;
  el.style.zIndex=hh.zIndex; el.style.margin=hh.margin;
  chase.on=false; chase.el=null; chase.home=null; chase.count=0; chase.held=false;
}
function patMimi(){
  patCount++; clearTimeout(patReset); patReset=setTimeout(()=>patCount=0,3000);
  let line,emo='patted';
  if(chase.on&&!chase.held){ clearTimeout(chase.ret); chase.ret=null; chase.held=true;
    line=vary('caught',CAUGHT_LINES); emo='happy'; patCount=0; }
  else if(patCount>=4){ line=vary('tickle',TICKLE_LINES); patCount=0; }
  else { line=vary('pat',PAT_LINES); if(Math.random()<.25) emo='happy'; }
  speak(line,emo);
}
function dodgeMimi(fx,fy){
  const now=Date.now(); if(now-dodgeCool<1400) return; dodgeCool=now;
  chase.held=false;
  const n=chaseFlee(fx==null?innerWidth/2:fx, fy==null?innerHeight/2:fy);
  clearTimeout(chase.ret);
  if(n>=5){ /* thak gayi — pakad liya! ab jahan chaaho rakho */
    clearTimeout(chase.ret); chase.ret=null; chase.held=true;
    const line=vary('tired',TIRED_LINES);
    addMsg(line,'ai'); speak(line,'tired');
    return;
  }
  const de=Math.random()<.3?'playful':'dodging';
  Anim.set(de);
  const line=vary('dodge',DODGE_LINES);
  addMsg(line,'ai'); speak(line,de);
  chase.ret=setTimeout(()=>chaseStop(),4500);
}
const ptrs=new Map(); let pinch=null;
/* doc-level touch */
function mimiDown(e){
  if(e.target.closest('button,input,textarea,a,select')) return;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){ /* pinch: sirf Mimi par ho to hi size badlo */
    const p=[...ptrs.values()];
    if(headTouch||headHit(e)||earHit(e)){
      pinch={d0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),s0:Anim.userSize};
      clearTimeout(headLpTimer); headTouch=null;
    }
    return;
  }
  const earH=earHit(e);
  if(ptrs.size>2||(!headHit(e)&&!earH)) return;
  headTouch={x:e.clientX,y:e.clientY,moved:false,id:e.pointerId,earGrab:earH};
  document.body.style.touchAction='none'; /* gesture ke dauran scroll roko */
  clearTimeout(headLpTimer);
  if(earH){
    /* KAAN PAKDA! turant uthao — ab kheench kar screen par kahin bhi le jao */
    if(!chase.on) chaseStart();
    clearTimeout(chase.ret); chase.ret=null; chase.held=true;
    Anim.set('embarrassed'); Anim.bounceT=1;
    const line=vary('ear',EAR_LINES); addMsg(line,'ai'); speak(line,'embarrassed');
  } else if(chase.held){
    /* held: grab, drag, drop */
    Anim.bounceT=1;
  } else {
    headLpTimer=setTimeout(()=>{ if(headTouch&&!headTouch.moved){ const t=headTouch; headTouch=null; dodgeMimi(t.x,t.y); } },550);
  }
}
function mimiMove(e){
  const pt=ptrs.get(e.pointerId); if(pt){ pt.x=e.clientX; pt.y=e.clientY; }
  if(pinch&&ptrs.size>=2){
    const p=[...ptrs.values()];
    const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    if(pinch.d0>20){
      Anim.userSize=Math.max(.5,Math.min(2.2,pinch.s0*d/pinch.d0));
      Anim.sizeT=Anim.userSize;
    }
    return;
  }
  if(!headTouch||e.pointerId!==headTouch.id) return;
  const moved=Math.hypot(e.clientX-headTouch.x,e.clientY-headTouch.y);
  if(chase.held){
    if(moved>10){ headTouch.moved=true; clearTimeout(headLpTimer);
      const el=chase.el;
      el.style.transition='none';
      chase.x=Math.max(0,Math.min(innerWidth-chase.w,e.clientX-chase.w/2));
      chase.y=Math.max(0,Math.min(innerHeight-chase.h,e.clientY-chase.h/2));
      el.style.left=chase.x+'px'; el.style.top=chase.y+'px'; }
    return;
  }
  if(moved>26){
    headTouch.moved=true; clearTimeout(headLpTimer); headTouch=null; dodgeMimi(e.clientX,e.clientY);
  }
}
function mimiUp(e){
  ptrs.delete(e.pointerId);
  if(pinch&&ptrs.size<2) pinch=null;
  clearTimeout(headLpTimer);
  document.body.style.touchAction='';
  const now=Date.now();
  if(headTouch&&e.pointerId===headTouch.id&&!headTouch.moved){
    if(chase.on&&now-lastTapT<350){ chaseStop(); speak('Ghar wapas! 🏠','happy'); patCount=0; }
    else patMimi();
    lastTapT=now;
  } else if(chase.held&&headTouch&&e.pointerId===headTouch.id&&headTouch.moved){
    chase.el.style.transition='left .45s cubic-bezier(.2,.8,.3,1), top .45s cubic-bezier(.2,.8,.3,1)';
    speak(vary('drop',DROP_LINES),'happy');
  }
  if(headTouch&&e.pointerId===headTouch.id) headTouch=null;
}
window.addEventListener('pointerdown',mimiDown,{passive:true});
window.addEventListener('pointermove',mimiMove,{passive:true});
window.addEventListener('pointerup',mimiUp,{passive:true});
window.addEventListener('pointercancel',e=>{ ptrs.delete(e.pointerId); if(pinch&&ptrs.size<2) pinch=null; clearTimeout(headLpTimer); document.body.style.touchAction=''; if(headTouch&&e.pointerId===headTouch.id) headTouch=null; },{passive:true});
/* shake-to-drop */
let dropping=false,lastShakeT=0;
function dropMimi(){
  if(dropping) return;
  const el=avatarHome; if(!el) return;
  dropping=true;
  if(chase.on) chaseStop();
  clearTimeout(headLpTimer); headTouch=null;
  const r=el.getBoundingClientRect();
  const home={position:el.style.position,left:el.style.left,top:el.style.top,transform:el.style.transform,
    transition:el.style.transition,zIndex:el.style.zIndex,margin:el.style.margin};
  el.style.position='fixed'; el.style.left=r.left+'px'; el.style.top=r.top+'px';
  el.style.margin='0'; el.style.zIndex='90';
  const sx=r.left, sy=r.top, w=r.width, hh=r.height;
  const floorY=Math.max(sy+40, innerHeight-hh-110);
  const landX=Math.max(8,Math.min(innerWidth-w-8, sx+(Math.random()*140-70)));
  Anim.set('dizzy');
  el.style.transition='top .5s cubic-bezier(.55,.06,.75,.4), left .5s ease-out';
  requestAnimationFrame(()=>{ el.style.left=landX+'px'; el.style.top=floorY+'px'; });
  setTimeout(()=>{ el.style.transition='top .14s ease-out'; el.style.top=(floorY-26)+'px'; },520);
  setTimeout(()=>{ el.style.transition='top .16s ease-in'; el.style.top=floorY+'px'; },670);
  const line=vary('dizzy',DIZZY_LINES);
  setTimeout(()=>{ addMsg(line,'ai'); speak(line,'dizzy'); },600);
  setTimeout(()=>{
    Anim.set('happy');
    el.style.transition='top 1.8s ease-in-out, left 1.8s ease-in-out';
    el.style.top=sy+'px'; el.style.left=sx+'px';
  },2900);
  setTimeout(()=>{
    el.style.position=home.position; el.style.left=home.left; el.style.top=home.top;
    el.style.transform=home.transform; el.style.transition=home.transition;
    el.style.zIndex=home.zIndex; el.style.margin=home.margin;
    dropping=false;
  },4900);
}
window.addEventListener('devicemotion',e=>{
  if(dropping) return;
  const a=e.accelerationIncludingGravity; if(!a) return;
  const m=Math.hypot(a.x||0,a.y||0,a.z||0);
  const now=Date.now();
  if(m>27&&now-lastShakeT>3500){ lastShakeT=now; dropMimi(); }
},{passive:true});


/* ================= LOOP ================= */
addEventListener('resize',fitStage);
const clock=new THREE.Clock();
(function loop(){
  requestAnimationFrame(loop);
  if(document.hidden) return; /* battery bachao */
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(avatarAnimOn) Anim.update(dt,t);
  renderer.render(scene,camera);
  if(!window.__mimiReady){ window.__mimiReady=true; }
})();
fitStage();

/* greeting */
setTimeout(()=>{
  Anim.set('love');
  const g="Namaste! Main Mimi hun! Tumhari cute robot dost! Mic dabao aur mujhse kuch bhi pucho!";
  addMsg(g,'ai'); speak(g,'love');
},1200);

/* ============ Tools Manager (Phase 4, local-only) ============
   Data source: /api/tool-status (GET) aur /api/tool-run (POST).
   Production me ye endpoint deploy hoga; local test me test server deta hai.
   Koi secret browser me nahi aata — sirf status/capabilities. */
window.ToolManager = (function(){
  const $ = id => document.getElementById(id);
  let providers = [], actionsByProvider = {}, enabledState = {};
  const auditTrail = [];

  const PERM_HI = {read:'sirf padhna', create:'banana', modify:'badalna', publish:'publish/deploy'};

  function badge(status){
    const map = {connected:['ok','🟢 Connected'], disconnected:['err','🔴 Disconnected'],
      unavailable:['off','⚪ Unavailable'], error:['err','🔴 Error']};
    const [cls, txt] = map[status] || ['warn','🟡 '+status];
    return '<span class="neu-badge '+cls+'">'+txt+'</span>';
  }
  function setStatus(html){ $('toolsStatus').innerHTML = html; }
  function loading(){ setStatus('<div class="neu-skel"></div><div class="neu-skel"></div><div class="neu-skel"></div>'); }

  async function refresh(){
    loading();
    try{
      const r = await fetch('/api/tool-status', {cache:'no-store'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      if(!data.ok) throw new Error(data.error || 'status failed');
      providers = data.providers || [];
      renderProviders();
      fillRunForm();
    }catch(e){
      setStatus('<div class="neu neu-card"><h3>⚪ Tools unavailable</h3>'
        + '<p class="neu-sub">Backend se connect nahi ho paya: '+esc(e.message)
        + '.<br>Local test ke liye test server chalao; production me endpoint deploy hoga.</p></div>');
      $('toolProvider').innerHTML = ''; $('toolAction').innerHTML = '';
    }
  }

  function renderProviders(){
    if(!providers.length){ setStatus('<p class="neu-sub">Koi provider registered nahi.</p>'); return; }
    setStatus(providers.map(p=>{
      const en = enabledState[p.provider_id] !== false;
      const caps = (p.actions||[]).map(a=>
        '<li>• <b>'+esc(a.name)+'</b><span class="perm-tag perm-'+a.permission+'">'
        +esc(a.permission)+(a.credit_gated?' • SKIP (no credits)':'')+'</span></li>').join('');
      return '<div class="neu neu-card" style="margin-bottom:12px;">'
        + '<div class="neu-row"><span><b>🔌 '+esc(p.display_name)+'</b><br>'
        + '<span class="neu-sub">'+esc(p.provider_id)+' • '+esc(p.connection||'')+'</span></span>'
        + '<span>'+badge(p.status||'unavailable')+'</span></div>'
        + '<div class="neu-row"><span>Enabled</span><button class="neu-toggle'+(en?' on':'')
        + '" data-prov="'+esc(p.provider_id)+'" aria-label="Enable/disable"></button></div>'
        + '<div class="neu-row"><span>Last check</span><span class="neu-sub">'+esc(p.last_check||'—')+'</span></div>'
        + (p.detail?'<p class="neu-sub">'+esc(p.detail)+'</p>':'')
        + '<details class="neu-caps"><summary>Capabilities ('+(p.actions||[]).length+')</summary><ul>'+caps+'</ul></details>'
        + '<div style="margin-top:8px;"><button class="neu-btn" data-test="'+esc(p.provider_id)+'">🔍 Test Connection</button></div>'
        + '</div>';
    }).join(''));
    // wire toggles + test buttons
    document.querySelectorAll('#toolsStatus .neu-toggle').forEach(t=>{
      t.onclick = ()=>{ const id=t.dataset.prov; enabledState[id]=!(enabledState[id]!==false);
        t.classList.toggle('on', enabledState[id]!==false); fillRunForm(); };
    });
    document.querySelectorAll('#toolsStatus [data-test]').forEach(b=>{
      b.onclick = async ()=>{
        b.disabled = true; b.textContent = '⏳ Testing...';
        try{
          const r = await fetch('/api/tool-status?provider='+encodeURIComponent(b.dataset.test));
          const d = await r.json();
          const s = (d.providers||[])[0] || d;
          alert('Status: '+(s.status||'unknown')+'\n'+(s.detail||''));
        }catch(e){ alert('Test failed: '+e.message); }
        b.disabled = false; b.textContent = '🔍 Test Connection';
      };
    });
  }

  function fillRunForm(){
    const ps = $('toolProvider'), as = $('toolAction');
    const active = providers.filter(p=>enabledState[p.provider_id]!==false);
    ps.innerHTML = active.map(p=>'<option value="'+esc(p.provider_id)+'">'+esc(p.display_name)+'</option>').join('');
    ps.onchange = fillActions; fillActions();
  }
  function fillActions(){
    const pid = $('toolProvider').value;
    const p = providers.find(x=>x.provider_id===pid);
    const as = $('toolAction');
    as.innerHTML = (p? p.actions||[] : []).map(a=>
      '<option value="'+esc(a.name)+'" data-perm="'+esc(a.permission)+'" data-cg="'+(a.credit_gated?1:0)+'">'
      +esc(a.name)+' ('+esc(a.permission)+')'+(a.credit_gated?' [SKIP]':'')+'</option>').join('');
  }

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function showResult(ok, text, cls){
    const el = $('toolResult'); el.style.display='block';
    el.className = 'neu-in neu-result '+(cls||(ok?'ok':'err'));
    el.textContent = text;
  }
  function logAudit(line){
    auditTrail.unshift(new Date().toLocaleTimeString()+' — '+line);
    $('toolsAudit').innerHTML = auditTrail.slice(0,20).map(l=>'<p class="neu-sub">• '+esc(l)+'</p>').join('');
  }

  async function run(confirmed, approvedSnap){
    const pid = $('toolProvider').value, act = $('toolAction').value;
    const opt = $('toolAction').selectedOptions[0];
    const perm = opt? opt.dataset.perm : 'read';
    const cg = opt && opt.dataset.cg==='1';
    let params = {};
    try{ params = JSON.parse($('toolParams').value.trim()||'{}'); }
    catch(e){ showResult(false, '❌ Params valid JSON nahi: '+e.message); return; }
    const snap = JSON.stringify({provider:pid, action:act, params:params});
    // Unsupported action guard
    const p = providers.find(x=>x.provider_id===pid);
    if(!p || !(p.actions||[]).some(a=>a.name===act)){
      showResult(false, '❌ Unsupported action: '+act); return;
    }
    // Credit-gated → SKIP, kabhi run nahi
    if(cg){
      showResult(false, '⏭️ SKIP — "'+act+'" ke liye Lovable credits nahi hain.\nYe mock nahi hai; execution hua hi nahi.', 'warn');
      logAudit(act+' → SKIP (no credits)'); return;
    }
    // Server authority: write actions par server needs_approval + token deta hai.
    // UI snapshot sirf TOCTOU guard hai (defense in depth).
    if(confirmed){
      if(window._toolApprovalSnap !== snap){
        $('toolApproval').style.display='none';
        window._toolApprovalSnap = null; window._toolApprovalToken = null;
        showResult(false, '❌ Action/params badal gaye approval ke baad.\nDobara Run dabao aur nayi approval lo.');
        logAudit(act+' → blocked (approval mismatch)');
        return;
      }
    }
    $('toolApproval').style.display='none';
    showResult(true, '⏳ Chal raha hai...', 'warn');
    try{
      const body = {provider:pid, action:act, params:params, confirm:!!confirmed};
      if(confirmed && window._toolApprovalToken) body.approval_token = window._toolApprovalToken;
      const r = await fetch('/api/tool-run', {method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)});
      const d = await r.json();
      if(d.ok){
        window._toolApprovalToken = null; window._toolApprovalSnap = null;
        const arts = d.validation && d.validation.verified_artifacts;
        showResult(true, '✅ Success\n'+JSON.stringify(arts||d.result||d, null, 1).slice(0,800));
        logAudit(act+' → success');
      }else if(d.needs_approval){
        window._toolApprovalToken = d.approval_token || null;
        window._toolApprovalSnap = snap;
        $('toolApprovalTxt').textContent = '"'+act+'" ('+(d.permission||perm)+') — '+(d.error||'approval chahiye.');
        $('toolApproval').style.display='block';
        logAudit(act+' → approval pending');
      }else if(d.approval_invalid){
        window._toolApprovalToken = null; window._toolApprovalSnap = null;
        showResult(false, '❌ Approval invalid: '+(d.error||'token verify nahi hua'));
        logAudit(act+' → blocked (bad approval token)');
      }else if(d.skipped){
        showResult(false, '⏭️ SKIP — '+d.error, 'warn'); logAudit(act+' → SKIP');
      }else{
        showResult(false, '❌ Failed: '+(d.error||'unknown')); logAudit(act+' → failed');
      }
    }catch(e){ showResult(false, '❌ Network error: '+e.message); }
  }

  function init(){
    if(!$('toolRun')) return;
    $('toolsRefresh').onclick = refresh;
    $('toolRun').onclick = ()=>run(false);
    $('toolConfirm').onclick = ()=>run(true);
    $('toolCancel').onclick = ()=>{ $('toolApproval').style.display='none'; window._toolApprovalSnap = null; window._toolApprovalToken = null; };
  }
  return {refresh:refresh, init:init};
})();
document.addEventListener('DOMContentLoaded', ()=>window.ToolManager.init());

/* ============ Universal Connector Hub ============ */
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
    wiz = {name:c.name||'', url:c.url||'', authVal:'', testResult:null, tools:[], reconnectId:c.id};
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
          +(canTry?'<div style="margin-top:6px;"><button class="neu-btn sm" data-try="'+i+'">▶ Try (asli call)</button></div>':'')+'</li>').join('')+'</ul>'
          +'<div id="tryOut" style="margin-top:8px;"></div>'
          +(canTry?'<p class="neu-sub">Try dabane par server par <b>asli</b> tools/call jayega. Sirf safe read-only tools try karo.</p>':'')
        : '<p class="neu-sub">Koi tools nahi mile. MCP ke liye "Test" dabao — tools/list se discover honge.</p>';
      if(canTry){
        b.querySelectorAll('[data-try]').forEach(btn=>{ btn.onclick=()=>tryTool(c, tools[+btn.dataset.try]); });
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

  async function tryTool(c, t){
    const out=$('tryOut'); if(!out||!t) return;
    out.innerHTML='<p class="neu-sub">⏳ "'+esc(t.name)+'" chal raha hai… (asli call)</p>';
    try{
      const r=await fetch('/api/mcp-call',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mcp_url:c.url, tool_name:t.name, arguments:{}, auth:c.auth||{}})}).then(x=>x.json());
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
    wiz = {name:'', url:'', authVal:'', testResult:null, tools:[]};
    $('hubWizard').classList.add('open'); renderWiz();
  }
  function closeWizard(){ $('hubWizard').classList.remove('open'); wiz=null; }
  function openLovableMcp(){
    wiz = {name:'Lovable', url:'https://mcp.lovable.dev', authVal:'', testResult:null, tools:[]};
    $('hubWizard').classList.add('open'); renderWiz();
  }
  function openDemoMcp(){
    let origin=''; try{ origin=location.origin; }catch(e){}
    wiz = {name:'Mimi Demo', url:origin+'/api/demo-mcp', authVal:'', testResult:null, tools:[]};
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
      const auth = wiz.authVal ? {type:'bearer', value:wiz.authVal} : {};
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
            +'<div class="hub-field"><label>Client Secret (optional — mile to)</label>'
            +'<input id="wzLovSec" type="password" class="neu-in" style="padding:10px;font-size:14px;" placeholder="••••••" value="'+esc(wiz.lovSec||'')+'" autocomplete="off"></div>'
            +'<div style="margin-top:8px;"><button class="neu-btn primary" id="wzLovLogin" style="width:100%;padding:12px;">🔐 Lovable se Login karo</button></div>'
            +'<div style="margin-top:6px;"><button class="neu-btn sm" id="wzLovCheck" style="width:100%;padding:10px;">🔍 Pehle check karo — kya login kaam karega?</button></div>'
            +'<div id="wzLovCheckOut" style="margin-top:6px;"></div>'
            +'<p class="neu-sub">Login ke baad wapas yahin aaoge — token sirf is browser me rahega.</p>';
          $('wzLovCid').oninput=e=>{ wiz.lovCid=e.target.value.trim(); };
          $('wzLovSec').oninput=e=>{ wiz.lovSec=e.target.value; };
          $('wzLovLogin').onclick=lovableLogin;
          $('wzLovCheck').onclick=lovableCheck;
        }else{
          ab.innerHTML='<div class="hub-field"><label>Bearer token</label>'
            +'<input id="wzAuthVal" type="password" class="neu-in" style="padding:10px;" placeholder="••••••" value="'+esc(wiz.authVal)+'"></div>'
            +'<p class="neu-sub">Token sirf is browser me rahega; test ke waqt hi server ko bheja jayega. OAuth login flow preview me nahi hai.</p>';
          $('wzAuthVal').oninput=e=>{ wiz.authVal=e.target.value; };
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
        c.auth=wiz.authVal ? {type:'bearer', value:wiz.authVal} : {};
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
      auth: wiz.authVal ? {type:'bearer', value:wiz.authVal} : {},
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
      const csec=(($('wzLovSec')||{}).value)||'' || (wiz&&wiz.lovSec)||'';
      if(!/^[A-Za-z0-9_-]{8,128}$/.test(cid)){ oauthNote('Pehle sahi Lovable Client ID dalo.'); return; }
      if(wiz){ wiz.lovCid=cid; wiz.lovSec=csec; }
      const verifier=randB64(48);
      const dig=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge=b64url(dig);
      const state=randB64(16);
      try{ localStorage.setItem('mimi_lovable_oauth', JSON.stringify({verifier, state, cid, csec})); }catch(e){}
      const q=new URLSearchParams({response_type:'code', client_id:cid,
        redirect_uri:LOV_REDIRECT, code_challenge:challenge, code_challenge_method:'S256',
        state, scope:'projects:read projects:write'});
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
          client_id:saved.cid||'', client_secret:saved.csec||''})}).then(x=>x.json());
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
