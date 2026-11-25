const fs=require('fs'),{spawnSync}=require('child_process');process.chdir(__dirname);
const R=48000,C=2,D=255.625,N=Math.round(R*D),db=x=>Math.pow(10,x/20);
function ff(a){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...a],{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr);}
function read(file){const b=fs.readFileSync(file);return new Float32Array(b.buffer,b.byteOffset,b.length/4);}
const cues=JSON.parse(fs.readFileSync('audio-audit-before.json')).dialogue;
const operations=cues.map(c=>{
 let target=c.start<134?-21.5:-23;
 if(c.speaker==='notice')target=-23;
 if(c.speaker.includes('memory'))target=-23;
 let gain=Math.max(-7,Math.min(3,(target-c.activeRmsDB)*.85));
 if(c.activeRmsDB<-32)gain=0; // Do not turn ambiguous breaths / room noise into words.
 if(c.scene==='SC07'&&c.speaker==='ken')gain=-6;
 return {...c,targetBandRms:target,gainDb:gain,startGain:c.start-.16,endGain:c.end+.08};
});
ff(['-i','../english-subtitles-v01/repaired-audio.wav','-af','highpass=f=55','-ar','48000','-ac','2','-f','f32le','base.f32']);
// Remove only the brightest edge of the added ADR, not its pitch or timing.
ff(['-i','../english-subtitles-v01/repaired-audio.wav','-af','highpass=f=55,equalizer=f=3200:t=q:w=0.8:g=-1.5','-ar','48000','-ac','2','-f','f32le','adr-eq.f32']);
ff(['-i','tension.mp3','-af','highpass=f=65,lowpass=f=6500','-ar','48000','-ac','2','-f','f32le','tension.f32']);
ff(['-i','connection.mp3','-af','highpass=f=85,lowpass=f=7000,acompressor=threshold=0.07:ratio=3:attack=15:release=400:knee=2.8:makeup=1','-ar','48000','-ac','2','-f','f32le','connection.f32']);
ff(['-f','lavfi','-i','anoisesrc=color=pink:amplitude=0.02:sample_rate=48000:seed=241125','-af','highpass=f=80,lowpass=f=3000','-t',String(D),'-ac','2','-f','f32le','room.f32']);
const base=read('base.f32'),eq=read('adr-eq.f32'),tension=read('tension.f32'),connection=read('connection.f32'),room=read('room.f32');
const voice=new Float32Array(N*C),music=new Float32Array(N*C),mixed=new Float32Array(N*C);
const ramp=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a))),smooth=x=>x*x*(3-2*x);
function points(t,ps){if(t<ps[0][0]||t>ps.at(-1)[0])return 0;for(let i=1;i<ps.length;i++)if(t<=ps[i][0]){const u=smooth(ramp(t,ps[i-1][0],ps[i][0]));return ps[i-1][1]*(1-u)+ps[i][1]*u;}return 0;}
const tensionEnv=[[18.625,0],[23,db(-18)],[65,db(-18)],[69,db(-13)],[77.5,db(-13)],[81,db(-18)],[84.458333,0]];
const pianoEnv=[[134.125,0],[140,db(-16)],[170,db(-16)],[186,db(-18)],[194,0],[199.79,0],[204,db(-21)],[210,db(-21)],[215.5,0],[225.3,0],[228,db(-16)],[233,db(-16)],[237,0]];
// Reuse the same motif for the final text; no music beneath the last 'Ken?'.
const codaEnv=[[249.1,0],[250.4,db(-17)],[252.5,db(-17)],[255.1,0]];
let sum=0;for(let i=R*C;i<6*R*C;i++)sum+=room[i]*room[i];const roomRms=Math.sqrt(sum/(5*R*C)),roomGain=db(-54)/roomRms;
function at(src,s,c){const i=Math.floor(s*R)*2+c;return i>=0&&i<src.length?src[i]:0;}
let peak=0,stemPeak=0;
for(let n=0;n<N;n++){
 const t=n/R;let weight=0,weighted=0,duck=1;
 for(const o of operations){if(t<o.startGain||t>o.endGain)continue;const w=Math.min(smooth(ramp(t,o.startGain,o.start)),1-smooth(ramp(t,o.end,o.endGain)));weight+=w;weighted+=w*o.gainDb;duck=Math.min(duck,1-.5*w);}
 const gain=db(weight?weighted/Math.max(1,weight):0);
 const eqW=t>=86.458333&&t<=90.458333?Math.min(smooth(ramp(t,86.458333,86.568333)),1-smooth(ramp(t,90.348333,90.458333))):0;
 const roomW=t<246.625?smooth(ramp(t,0,1))*(1-smooth(ramp(t,239,246.625))):0;
 const tend=points(t,tensionEnv)*duck,p=points(t,pianoEnv)*duck,end=points(t,codaEnv);
 for(let c=0;c<C;c++){
  const i=n*C+c;const source=(base[i]||0)*(1-eqW)+(eq[i]||0)*eqW;
  voice[i]=source*gain+(room[i]||0)*roomGain*roomW;
  // The 100 s cue begins at 134.125; its last 3 s are naturally silent before 237.
  music[i]=at(tension,t-18.625,c)*tend+at(connection,t-134.125,c)*p+at(connection,81+t-249.1,c)*end;
  mixed[i]=voice[i]+music[i];peak=Math.max(peak,Math.abs(mixed[i]));stemPeak=Math.max(stemPeak,Math.abs(music[i]));
 }
}
const rms=(a,s,e)=>{let q=0,n=0;for(let i=Math.round(s*R)*2;i<Math.round(e*R)*2;i++){q+=a[i]*a[i];n++;}return Math.sqrt(q/n);};
const extraDucks=[];
for(const c of cues){
 const margin=20*Math.log10((rms(voice,c.start,c.end)||1e-12)/(rms(music,c.start,c.end)||1e-12));
 if(margin>=16)continue;
 const gainDb=margin-16;extraDucks.push({start:c.start,end:c.end,text:c.ja,gainDb});
 for(let n=Math.round((c.start-.16)*R);n<Math.round((c.end+.25)*R);n++){
  const t=n/R,w=Math.min(smooth(ramp(t,c.start-.16,c.start)),1-smooth(ramp(t,c.end,c.end+.25))),g=db(gainDb*w);
  music[n*2]*=g;music[n*2+1]*=g;
 }
}
peak=0;stemPeak=0;for(let i=0;i<mixed.length;i++){mixed[i]=voice[i]+music[i];peak=Math.max(peak,Math.abs(mixed[i]));stemPeak=Math.max(stemPeak,Math.abs(music[i]));}
fs.writeFileSync('music-dialogue-margins.json',JSON.stringify({extraDucks,cues:cues.map(c=>({start:c.start,end:c.end,text:c.ja,marginDb:20*Math.log10((rms(voice,c.start,c.end)||1e-12)/(rms(music,c.start,c.end)||1e-12))}))},null,2));
for(const [name,a]of [['dialogue-balanced',voice],['music-stem',music],['mix-premaster',mixed]]){
 fs.writeFileSync(name+'.f32',Buffer.from(a.buffer));ff(['-f','f32le','-ar',String(R),'-ac','2','-i',name+'.f32','-t',String(D),'-c:a','pcm_s24le',name+'.wav']);
}
fs.writeFileSync('mix-decisions.json',JSON.stringify({duration:D,original:'../english-subtitles-v01/repaired-audio.wav',visuals:'Unchanged; original English-subtitled picture stream will be copied',dialogueOperations:operations.map(c=>({scene:c.scene,speaker:c.speaker,text:c.ja,start:c.start,end:c.end,sourceBandRms:c.activeRmsDB,gainDb:c.gainDb})),adrEq:'-1.5 dB broad cut centered 3.2 kHz, original pitch/time retained',tensionEnv,pianoEnv,codaEnv,duckingDb:-6.02,roomTone:{type:'original synthesized filtered pink noise',rmsDbFS:-54,fadeOut:[239,246.625]},musicSilenceWindows:[[84.458333,134.125],[194,199.79],[215.5,225.3],[237,249.1]],premasterPeak:peak,musicPeak:stemPeak,voiceIdentityReview:'Objective level/continuity audit; perceptual identity is not certified by measurements.'},null,2));
console.log('Built mix and separate stems.',{peak,stemPeak,roomGain});
