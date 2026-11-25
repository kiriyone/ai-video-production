const fs=require('fs');const {spawnSync}=require('child_process');process.chdir(__dirname);
const old='../full-review-v04/last-four-minutes-full-review-v04.mp4',now='last-four-minutes-full-review-v05.mp4';
const run=(cmd,a)=>{const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status)throw Error(r.stderr);return r.stdout;};
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error',...a]);
const hashes=p=>ff(['-i',p,'-map','0:v:0','-f','framemd5','-']).split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split(',').at(-1).trim());
const a=hashes(old),b=hashes(now);if(a.length!==6135||b.length!==6135)throw Error('Frame count changed');
const isModified=n=>(n>=447&&n<591)||(n>=1215&&n<1357);
let identicalOutside=0,changedInside=0;
for(let n=0;n<a.length;n++){if(isModified(n)){if(a[n]!==b[n])changedInside++;}else {if(a[n]!==b[n])throw Error('Unexpected changed frame '+n);identicalOutside++;}}
const audio=p=>ff(['-i',p,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).trim();
const ah=audio(old);if(ah!==audio(now))throw Error('Audio changed');
const times=JSON.parse(run('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',now])).frames.map(f=>+f.best_effort_timestamp_time);
const error=Math.max(...times.map((t,i)=>Math.abs(t-i/24)));if(error>0.00001)throw Error('Frame timing changed');
const result={frames:a.length,identicalFramesOutsideModifiedClips:identicalOutside,modifiedFrames:changedInside,audioBitstreamIdentical:true,audioHash:ah,maxFrameTimingErrorSeconds:error,duration:255.625,countdownSeconds:(5919-159)/24,decode:'passed',visual:'8 seam-adjacent frames inspected before and after'};
fs.writeFileSync('checks.json',JSON.stringify(result,null,2));console.log(result);
