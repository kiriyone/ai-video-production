const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');process.chdir(__dirname);
const src='../english-subtitles-v01/repaired-audio.wav';
function ff(a){const r=spawnSync('ffmpeg',['-v','error','-y',...a],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
ff(['-i',src,'-ac','1','-ar','16000','-af','highpass=f=120,lowpass=f=6500','-f','f32le','dialogue-analysis.f32']);
const b=fs.readFileSync('dialogue-analysis.f32'),a=new Float32Array(b.buffer,b.byteOffset,b.length/4),R=16000;
const db=x=>20*Math.log10(Math.max(1e-9,x));
function measure(start,end){
 const levels=[];let peak=0;
 for(let s=Math.round(start*R);s<Math.min(a.length,Math.round(end*R));s+=320){let sum=0,n=0;for(let i=s;i<Math.min(s+320,Math.round(end*R),a.length);i++){sum+=a[i]*a[i];peak=Math.max(peak,Math.abs(a[i]));n++;}levels.push(Math.sqrt(sum/n));}
 levels.sort((x,y)=>x-y);const p95=levels[Math.floor(levels.length*.95)]||1e-9;const active=levels.filter(v=>v>p95*Math.pow(10,-18/20));
 return {activeRmsDB:db(Math.sqrt(active.reduce((s,v)=>s+v*v,0)/active.length)),peakDB:db(peak),floorDB:db(levels[Math.floor(levels.length*.1)]||1e-9),activeFraction:active.length/levels.length};
}
const cues=JSON.parse(fs.readFileSync('../english-subtitles-v01/subtitle-cues.json')).filter(c=>c.style==='Dialogue');
const speakers=['mother','ken','notice','ken','mother','mother','ken','ken','notice','ken','ken','mother','ken','mother','ken','mother','ken','mother','mother','mother-memory','ken-memory','mother-memory','mother','ken','mother','mother','ken','mother','mother','ken','ken','mother','mother','mother','ken','ken','mother','ken','mother','mother','ken','mother','mother','mother'];
if(speakers.length!==cues.length)throw Error('Speaker mapping length');
const rows=cues.map((c,i)=>({...c,speaker:speakers[i],...measure(c.start,c.end)}));
const scenes=JSON.parse(fs.readFileSync('../full-review-v03/timeline.json')).scenes.map(c=>({id:c.id,start:c.start,end:c.end,...measure(c.start,c.end)}));
fs.writeFileSync('audio-audit-before.json',JSON.stringify({method:'20 ms RMS, 120–6500 Hz analysis only; active bins above 95th percentile minus 18 dB. Does not certify perceived voice identity.',dialogue:rows,scenes},null,2));
console.log(rows.map(c=>`${c.start.toFixed(2)} ${c.scene} ${c.speaker} RMS ${c.activeRmsDB.toFixed(1)} peak ${c.peakDB.toFixed(1)} ${c.ja}`).join('\n'));
