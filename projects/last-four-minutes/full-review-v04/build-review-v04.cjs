const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
process.chdir(__dirname);
const prior=path.resolve('../full-review-v03');
const timeline=JSON.parse(fs.readFileSync(path.join(prior,'timeline.json')));
const overlapBefore=new Set(['SC05','SC08','SC08B','SC08DA','SC09B','SC10B']);
const run=(cmd,args)=>{let r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;};
const ff=args=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...args]);
const enc=['-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-threads','4'];
fs.mkdirSync('parts',{recursive:true});
const changes={};
function piecewise(segments){
 let out=`[0:v]split=${segments.length}`+segments.map((_,i)=>`[s${i}]`).join('')+';';
 for(let i=0;i<segments.length;i++){
  const [start,end,filter]=segments[i];
  out+=`[s${i}]trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS${filter?','+filter:''},setsar=1[v${i}];`;
 }
 return out+segments.map((_,i)=>`[v${i}]`).join('')+`concat=n=${segments.length}:v=1:a=0[framed];`;
}
const mother='crop=1064:600:98:0,scale=1280:720:flags=lanczos';
const sofa='crop=1016:572:174:0,scale=1280:720:flags=lanczos';
const hands='crop=640:360:400:360,scale=1280:720:flags=lanczos';
let frameCursor=0;
const cuts=[];
for(let i=0;i<timeline.scenes.length;i++){
 const s=timeline.scenes[i],n=Math.round(s.duration*24);
 const start=overlapBefore.has(s.id)?2:0;
 const end=n-(overlapBefore.has(timeline.scenes[i+1]?.id)?2:0);
 let f='[0:v]null[framed];';
 if(s.id==='SC08')f=piecewise([[0,120,''],[120,n,mother]]);
 if(s.id==='SC08B')f=`[0:v]${mother}[framed];`;
 // R08B was already cropped to the same composition in v03.
 if(s.id==='SC08C')f=piecewise([[0,41,mother],[41,n,'']]);
 if(s.id==='SC08DA')f=piecewise([[0,120,'tpad=stop_mode=clone:stop_duration=0.041666667'],[121,n,'']]);
 if(s.id==='SC10')f=piecewise([[0,72,sofa],[72,156,hands],[156,n,sofa]]);
 if(s.id==='SC10B')f='[0:v]crop=1002:564:166:0,scale=1280:720:flags=lanczos[framed];';
 if(s.id==='R10B')f=`[0:v]${hands}[framed];`;
 changes[s.id]=f;
 f+=`[framed]fps=24,tpad=stop_mode=clone:stop_duration=0.125,trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS,setsar=1[v]`;
 const target=`parts/${s.id}.mp4`;
 if(!fs.existsSync(target))ff(['-i',path.join(prior,'parts',s.id+'.mp4'),'-filter_complex_threads','2','-filter_complex',f,'-map','[v]','-an',...enc,target]);
 cuts.push({id:s.id,startFrame:frameCursor,endFrame:frameCursor+end-start,sourceStartFrame:start,sourceEndFrame:end});
 frameCursor+=end-start;
 console.log('Prepared '+s.id+' '+frameCursor);
}
if(frameCursor!==6135)throw Error('Frame count changed: '+frameCursor);
fs.writeFileSync('concat.txt',cuts.map(s=>`file 'parts/${s.id}.mp4'\nduration ${(s.endFrame-s.startFrame)/24}`).join('\n')+'\n');
ff(['-f','concat','-safe','0','-i','concat.txt','-i',path.join(prior,'last-four-minutes-full-review-v03.mp4'),'-map','0:v:0','-map','1:a:0','-map_metadata','1','-map_chapters','1','-c','copy','-metadata','title=最後の4分 — 画角とつなぎ修正版 v04','-movflags','+faststart','last-four-minutes-full-review-v04.mp4']);
fs.writeFileSync('edit-audit.json',JSON.stringify({totalFrames:frameCursor,fps:24,duration:frameCursor/24,audio:'bitstream copied unchanged from full review v03',clockStartFrame:159,closedFrame:5919,countdownFrames:5760,transition:'All six 4-frame dissolves replaced with hard cuts at overlap midpoint; 2 frames trimmed on either side.',cuts,changes},null,2));
ff(['-i','last-four-minutes-full-review-v04.mp4','-f','null','NUL']);
fs.writeFileSync('verification.json',run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,start_time,duration','-of','json','last-four-minutes-full-review-v04.mp4']));
console.log('Finished v04');
