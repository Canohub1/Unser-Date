// Invitation v2 – Countdown + Global Hearts Shower + Chocolates + Piano Melody
// ---- Countdown (to Nov 8, 2025) ----
const target = new Date('2025-11-08T00:00:00');
const elD = document.getElementById('cd-d');
const elH = document.getElementById('cd-h');
const elM = document.getElementById('cd-m');
const elS = document.getElementById('cd-s');
function tick(){
  const now = new Date();
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms/1000);
  const d = Math.floor(s/86400);
  const h = Math.floor((s%86400)/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  elD.textContent = String(d).padStart(2,'0');
  elH.textContent = String(h).padStart(2,'0');
  elM.textContent = String(m).padStart(2,'0');
  elS.textContent = String(sec).padStart(2,'0');
}
setInterval(tick, 1000); tick();

// ---- Particle FX: GLOBAL hearts + chocolate squares ----
const cvs = document.getElementById('fx');
const ctx = cvs.getContext('2d');
let W=0,H=0,DPR=1, parts=[];
function resize(){
  DPR = Math.min(2, window.devicePixelRatio||1);
  W = cvs.width = Math.floor(innerWidth*DPR);
  H = cvs.height = Math.floor(innerHeight*DPR);
  cvs.style.width = innerWidth+'px'; cvs.style.height = innerHeight+'px';
}
addEventListener('resize', resize); resize();

function spawnParticle(x,y,type){
  const a = Math.random()*Math.PI*2;
  const speed = Math.random()*1.6 + 0.6;
  parts.push({
    t: type,
    x, y,
    vx: Math.cos(a)*speed*DPR,
    vy: Math.sin(a)*speed*DPR - 0.7*DPR,
    r: Math.random()*10 + 10,
    rot: Math.random()*Math.PI,
    life: 1.0
  });
}
function spawnBurst(x,y,count=28){
  for(let i=0;i<count;i++){
    // bias to hearts (~70%) over chocolates
    const t = Math.random()<0.7 ? 'heart' : 'choco';
    spawnParticle(x,y,t);
  }
}
function spawnGlobalShower(durationMs=5000){
  const start = performance.now();
  function loop(now){
    const t = now - start;
    if(t < durationMs){
      // emit from across the width near the bottom area
      for(let i=0;i<6;i++){
        const x = Math.random()*W;
        const y = H - Math.random()*H*0.2; // bottom 20%
        const kind = Math.random()<0.8 ? 'heart' : 'choco';
        spawnParticle(x,y,kind);
      }
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
}
function drawHeart(x,y,s,rot,alpha){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(s/16,s/16);
  // soft gradient heart
  const grd = ctx.createLinearGradient(-8,-8,8,8);
  grd.addColorStop(0, `rgba(255,182,193,${alpha})`); // light pink
  grd.addColorStop(1, `rgba(216,138,162,${alpha})`); // rose
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(0,-4);
  ctx.bezierCurveTo(-6,-10, -16,-2, 0, 12);
  ctx.bezierCurveTo(16,-2, 6,-10, 0,-4);
  ctx.fill();
  // glow
  ctx.shadowColor = `rgba(217,179,111,${alpha*0.5})`;
  ctx.shadowBlur = 12;
  ctx.restore();
}
function drawChoco(x,y,s,rot,alpha){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  const grd = ctx.createLinearGradient(-s/2,-s/2, s/2,s/2);
  grd.addColorStop(0, `rgba(139,94,60,${alpha})`);
  grd.addColorStop(1, `rgba(90,59,39,${alpha})`);
  ctx.fillStyle = grd; ctx.strokeStyle = `rgba(249,234,210,${alpha*0.5})`;
  ctx.lineWidth = Math.max(1, s*0.08);
  ctx.fillRect(-s/2,-s/2,s,s);
  ctx.strokeRect(-s/2,-s/2,s,s);
  // little shine
  ctx.fillStyle = `rgba(249,234,210,${alpha*0.18})`;
  ctx.fillRect(-s*0.3,-s*0.35,s*0.6,s*0.12);
  ctx.restore();
}
function frame(){
  ctx.clearRect(0,0,W,H);
  for(const p of parts){
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.012*DPR;
    p.rot += 0.02;
    p.life -= 0.008;
    const a = Math.max(0, p.life);
    if(p.t==='heart') drawHeart(p.x,p.y,p.r,p.rot,a);
    else drawChoco(p.x,p.y,p.r,p.rot,a);
  }
  parts = parts.filter(p=> p.life>0 && p.y < H+50*DPR);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Button interaction => global shower for a few seconds
document.getElementById('love').addEventListener('click', ()=>{
  spawnGlobalShower(5200); // ~5.2s
  startAudio(true);
});

// ---- Piano-like melody (WebAudio) ----
let AC, master, playing=false, melodyTimer=null;
function initAudio(){
  AC = new (window.AudioContext||window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = 0.0; master.connect(AC.destination);
  return true;
}
function pianoNote(freq, dur=1.2, vel=0.25){
  const o = AC.createOscillator(); o.type='sine'; o.frequency.value=freq;
  const g = AC.createGain(); g.gain.value=0.0;
  const o2 = AC.createOscillator(); o2.type='triangle'; o2.frequency.value = freq*2;
  const o3 = AC.createOscillator(); o3.type='triangle'; o3.frequency.value = freq*3;
  const mix = AC.createGain(); mix.gain.value = 0.5;
  const lp = AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 3000;
  o.connect(mix); o2.connect(mix); o3.connect(mix); mix.connect(lp).connect(g).connect(master);
  const nB = AC.createBuffer(1, Math.floor(AC.sampleRate*0.02), AC.sampleRate);
  const d = nB.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
  const n = AC.createBufferSource(); n.buffer=nB; const ng=AC.createGain(); ng.gain.value=0.08; n.connect(ng).connect(g);
  const t = AC.currentTime;
  g.gain.linearRampToValueAtTime(vel, t+0.01);
  g.gain.linearRampToValueAtTime(vel*0.6, t+0.12);
  g.gain.linearRampToValueAtTime(0.0001, t+dur);
  o.start(); o2.start(); o3.start(); n.start();
  o.stop(t+dur+0.05); o2.stop(t+dur+0.05); o3.stop(t+dur+0.05);
}
function startMelody(){
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
  let i=0;
  function step(){
    if(!playing) return;
    pianoNote(notes[i], 1.2, 0.22);
    i = (i+1)%notes.length;
    melodyTimer = setTimeout(step, 900);
  }
  step();
}
function startAudio(boost=false){
  try{
    if(!AC) initAudio();
    AC.resume();
    if(!playing){
      playing=true;
      master.gain.linearRampToValueAtTime(0.18, AC.currentTime+0.5);
      startMelody();
    }else if(boost){
      master.gain.linearRampToValueAtTime(0.22, AC.currentTime+0.2);
    }
  }catch(e){}
}
function stopAudio(){
  playing=false;
  if(AC){ master.gain.linearRampToValueAtTime(0.0, AC.currentTime+0.4); }
  clearTimeout(melodyTimer);
}
document.addEventListener('DOMContentLoaded', ()=> startAudio());
document.body.addEventListener('pointerdown', ()=> startAudio(), { once:true });

// Mute toggle
const muteBtn = document.getElementById('mute');
let muted=false;
muteBtn.addEventListener('click', ()=>{
  if(!AC){ initAudio(); }
  if(!playing){ startAudio(); }
  muted = !muted;
  master.gain.linearRampToValueAtTime(muted?0.0:0.18, AC.currentTime+0.2);
  muteBtn.textContent = muted ? '🎹 Musik: aus' : '🎹 Musik: an';
});
