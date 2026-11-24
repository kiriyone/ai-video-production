const fs=require('fs');
const sr=48000,dur=7,n=sr*dur,a=new Float64Array(n);
function tone(at,len,fn,gain){let begin=Math.round(at*sr);for(let j=0;j<Math.floor(len*sr)&&begin+j<n;j++){const t=j/sr;a[begin+j]+=fn(t,j/Math.max(1,len*sr-1))*gain;}}
const tau=2*Math.PI;
// Original designed vibration: brief physical buzz before the cut.
for(const at of [.24,.43])tone(at,.115,(t,u)=>Math.sin(tau*142*t)*(0.6+0.4*Math.sin(tau*31*t))*Math.sin(Math.PI*u)**2,.13);
// Initial restrained descending electronic notification, not a sampled TV sound.
tone(.625,.30,(t,u)=>Math.sin(tau*(820*t-290*t*t))*Math.exp(-t*13)*(1-Math.exp(-t*160)),.17);
// Countdown impacts follow the visible second transitions.
for(let k=0;k<7;k++){let at=.625+k;if(at>=dur)break;
tone(at,.30,(t,u)=>(Math.sin(tau*92*t)+.22*Math.sin(tau*184*t))*Math.exp(-t*18)*(1-Math.exp(-t*350)),.24);
tone(at,.075,(t,u)=>Math.sin(tau*1320*t)*Math.exp(-t*70)*(1-Math.exp(-t*600)),.06);}
tone(.72,6.28,(t,u)=>(Math.sin(tau*49*t)+.23*Math.sin(tau*74*t))*.5*(1-Math.exp(-t*1.4))*Math.min(1,(1-u)*7),.07);
const out=Buffer.alloc(44+n*4);out.write('RIFF');out.writeUInt32LE(36+n*4,4);out.write('WAVE',8);out.write('fmt ',12);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22);out.writeUInt32LE(sr,24);out.writeUInt32LE(sr*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(n*4,40);
let peak=0;for(let i=0;i<n;i++){peak=Math.max(peak,Math.abs(a[i]));const v=Math.round(Math.max(-.95,Math.min(.95,a[i]))*32767);out.writeInt16LE(v,44+i*4);out.writeInt16LE(v,46+i*4);}
fs.writeFileSync('notification-sound-v02.wav',out);console.log(JSON.stringify({duration:dur,peak_dbfs:20*Math.log10(peak),original_synthesis:true}));

