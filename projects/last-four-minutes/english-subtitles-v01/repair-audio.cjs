const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
process.chdir(__dirname);
const source=path.resolve('../full-review-v05/last-four-minutes-full-review-v05.mp4');
const run=(cmd,a)=>{const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;};
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...a]);
const rate=48000,channels=2,duration=255.625;
if(!fs.existsSync('original.f32'))ff(['-i',source,'-vn','-ar','48000','-ac','2','-f','f32le','original.f32']);
ff(['-i','ken-adr.mp4','-vn','-ar','48000','-ac','2','-f','f32le','ken-adr.f32']);
const b=fs.readFileSync('original.f32'),original=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);
const output=new Float32Array(original);const ab=fs.readFileSync('ken-adr.f32'),adr=new Float32Array(ab.buffer,ab.byteOffset,ab.byteLength/4);
const at=s=>Math.round(s*rate),index=s=>at(s)*channels;
const rms=(a,start,end)=>{let sum=0,n=0;for(let i=index(start);i<Math.min(index(end),a.length);i++){sum+=a[i]*a[i];n++;}return Math.sqrt(sum/n);};
const patches=[];
function roomPatch(start,end,roomStart,roomEnd){
 const n=at(end-start),rn=at(roomEnd-roomStart),cross=at(.04),fade=at(.07),step=rn-cross;
 const roomLevel=rms(original,roomStart,roomEnd),gain=Math.min(1,.0015/Math.max(.000001,roomLevel));
 for(let k=0;k<n;k++){
  const q=k%step;let mix=Math.min(1,k/fade,(n-1-k)/fade);mix=Math.max(0,mix);
  for(let c=0;c<2;c++){
   let value=original[index(roomStart)+q*2+c];
   if(q<cross){const w=q/cross;value=original[index(roomStart)+(step+q)*2+c]*(1-w)+value*w;}
   const o=index(start)+k*2+c;output[o]=original[o]*(1-mix)+value*gain*mix;
  }
 }
 patches.push({kind:'remove-unwanted-dialogue',start,end,roomSource:[roomStart,roomEnd],roomGain:gain,edgeFade:.07});
}
function insert(src,from,to,dest,gain,label){
 const n=at(to-from),fade=at(.035);
 for(let k=0;k<n;k++){const w=Math.max(0,Math.min(1,k/fade,(n-1-k)/fade));for(let c=0;c<2;c++){const o=index(dest)+k*2+c;output[o]=output[o]*(1-w)+src[index(from)+k*2+c]*gain*w;}}
 patches.push({kind:label,sourceStart:from,sourceEnd:to,start:dest,end:dest+to-from,gain,edgeFade:.035});
}
// Remove the erroneously repeated dishes exchange. Keep the approved late footsteps.
roomPatch(84.458333,93.658333,95.258333,96.758333);
// Reuse the existing mother's isolated 'Ken?' before Ken shows the phone.
insert(original,84.458333+7.55,84.458333+8.9,84.458333+.3,1,'reuse-mother-Ken');
const config=JSON.parse(fs.readFileSync('adr-placement.json'));
const match=rms(original,169.958333+5.2,169.958333+9.0)/rms(adr,config.voiceStart,config.voiceEnd);
const gain=Math.max(.5,Math.min(2,match));
insert(adr,config.trimStart,config.trimEnd,config.destination,gain,'new-Ken-Mom-look-at-this');
// Preserve 'Final notice...' and 'Yours?' but remove stray reference speech.
roomPatch(98.291667,98.291667+3.5,98.291667+11.15,98.291667+12.85);
roomPatch(98.291667+7.35,98.291667+8.95,98.291667+11.15,98.291667+12.85);
// Preserve stove action and 'Let's sit down'; remove the short trailing stray voice.
roomPatch(147.958333+8.03,147.958333+9.7,147.958333+4.5,147.958333+5.7);
let peak=0,changed=0,outside=0;
for(let i=0;i<output.length;i++){peak=Math.max(peak,Math.abs(output[i]));if(output[i]!==original[i]){changed++;const t=Math.floor(i/2)/rate;if(!patches.some(p=>t>=p.start-1/rate&&t<=p.end+1/rate))outside++;}}
if(peak>=1||outside)throw Error('Audio validation failed: '+JSON.stringify({peak,outside}));
fs.writeFileSync('repaired.f32',Buffer.from(output.buffer));
ff(['-f','f32le','-ar','48000','-ac','2','-i','repaired.f32','-t',String(duration),'-c:a','pcm_s24le','repaired-audio.wav']);
ff(['-i',source,'-i','repaired-audio.wav','-map','0:v:0','-map','1:a:0','-map_metadata','0','-map_chapters','0','-c:v','copy','-c:a','aac','-b:a','256k','-t',String(duration),'-metadata','title=最後の4分 — 日本語音声修正版 v06','-movflags','+faststart','last-four-minutes-audio-fixed-v06.mp4']);
fs.writeFileSync('audio-repair-manifest.json',JSON.stringify({source,approval:'User approved Japanese audio repairs with English subtitles',duration,patches,peak,changedSamples:changed,changedSamplesOutsidePatches:outside,visuals:'Original v05 video stream copied without alteration',levelMatch:gain},null,2));
console.log('Repaired Japanese audio; original video stream retained.',{peak,changed,outside,gain});
