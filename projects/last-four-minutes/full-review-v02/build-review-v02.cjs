const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
process.chdir(__dirname);
const root = path.resolve('../../04_FOOTAGE');
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;}
const ff=(args)=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...args]);
const enc=['-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart'];
// Duration is explicitly normalized to frames; no cumulative AAC padding freezes.
const scenes=[
 ['SC01','SC01_OPENING_TEST/sc01-take01-480p.mp4',6],
 ['SC02','SC02_NOTIFICATION_TEST/sc02-dialogue-review-v01.mp4',12.625],
 ['SC03','SC03_CANCEL_TEST/sc03-review-v01.mp4',10],
 ['SC04','SC04_UNSPOKEN_TEST/sc04-review-v01.mp4',16],
 ['SC05','SC05_DISHES_TEST/sc05-review-v01.mp4',12],
 ['SC06','SC06_MEMORY_MOTION/sc06-motion-v02.mp4',16],
 ['SC07','SC07_SHOW_PHONE_TEST/sc07-review-v01.mp4',14],
 ['SC08','SC08_MOTHER_UNDERSTANDS_TEST/sc08-review-v01.mp4',14],
 ['SC08B','SC08B_MOTHER_DENIAL_TEST/sc08b-review-v01.mp4',16],
 ['SC08C','SC08C_STAY_WITH_ME_TEST/sc08c-review-v01.mp4',14],
 ['SC08DA','SC08D_STOVE_TO_SOFA_TEST/part-A.mp4',10],
 ['SC08DB','SC08D_STOVE_TO_SOFA_TEST/part-B.mp4',12],
 ['SC09','SC09_FINDING_WORDS_TEST/sc09-review-v01.mp4',18],
 ['SC09B','SC09B_IM_SCARED_TEST/sc09b-review-v01.mp4',12],
 ['SC10','SC10_HOLDING_HANDS_TEST/sc10-review-v01.mp4',14],
 ['SC10B','SC10B_WORDS_REACH_HER_TEST/sc10b-review-v01.mp4',14],
 ['PHONE','SC11_TIME_RUNS_OUT_TEST/phone-zero-v01.mp4',4],
 ['POV','SC11_KEN_POV_ENDING/ken-pov-ending-v02.mp4',10],
 ['MESSAGE','SC12_VIEWER_MESSAGE/message-card-v01.mp4',7]
];
for(const [id,file,d]of scenes){if(!fs.existsSync(path.join(root,file)))throw Error('Missing '+file);}
const dissolveBefore=new Set(['SC05','SC08','SC08B','SC08C','SC08DA','SC09B','SC10B']);
const overlap=4/24;
let cursor=0;
const timeline=[];
fs.mkdirSync('parts',{recursive:true});
for(const [id,file,d]of scenes){
 const out='parts/'+id+'.mp4';
 const args=['-i',path.join(root,file)];
 if(id==='SC08DB')args.push('-f','lavfi','-i','anoisesrc=color=brown:amplitude=0.003:sample_rate=48000:seed=2411');
 const audio=id==='SC08DB'?'1:a':'0:a';
 const filter=`[0:v]trim=duration=${d},setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,setsar=1,fps=24,settb=1/24[v];[${audio}]atrim=duration=${d},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=${d},afade=t=in:d=0.025,afade=t=out:st=${d-0.025}:d=0.025[a]`;
 ff([...args,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(d),...enc,out]);
 if(dissolveBefore.has(id))cursor-=overlap;
 timeline.push({id,source:file,start:cursor,end:cursor+d,duration:d,transition:dissolveBefore.has(id)?'4-frame dissolve':'cut',audio:id==='SC08DB'?'original removed; quiet synthetic room-tone placeholder':'original reviewed clip'});
 cursor+=d; console.log('Normalized '+id);
}
// Render short dissolve groups, preserving ordinary cuts between different viewpoints.
const groups=[];
for(let i=0;i<scenes.length;i++){
 if(i===0||!dissolveBefore.has(scenes[i][0]))groups.push([]);
 groups.at(-1).push(scenes[i]);
}
const groupFiles=[];
for(let i=0;i<groups.length;i++){
 const g=groups[i]; if(g.length===1){groupFiles.push('parts/'+g[0][0]+'.mp4');continue;}
 const args=[]; for(const s of g)args.push('-i','parts/'+s[0]+'.mp4');
 const filters=[]; for(let n=0;n<g.length;n++)filters.push(`[${n}:v]settb=1/24,setpts=PTS-STARTPTS[v${n}];[${n}:a]asetpts=PTS-STARTPTS[a${n}]`);
 let length=g[0][2],v='v0',a='a0';
 for(let n=1;n<g.length;n++){
  filters.push(`[${v}][v${n}]xfade=transition=fade:duration=${overlap}:offset=${length-overlap}[x${n}];[${a}][a${n}]acrossfade=d=${overlap}:c1=tri:c2=tri[y${n}]`);
  v='x'+n;a='y'+n;length+=g[n][2]-overlap;
 }
 const out=`parts/group-${i}.mp4`;
 ff([...args,'-filter_complex_threads','2','-filter_complex',filters.join(';'),'-map',`[${v}]`,'-map',`[${a}]`,'-t',String(length),...enc,out]);groupFiles.push(out);console.log('Joined group '+i);
}
// Explicit concat durations prevent encoder padding from adding delays at every join.
fs.writeFileSync('concat.txt',groupFiles.map((f,i)=>`file '${f}'\nduration ${groups[i].reduce((n,s)=>n+s[2],0)-(groups[i].length-1)*overlap}`).join('\n')+'\n');
const chapters=[['いつもの返事','SC01'],['最終通知・言い出せない','SC02'],['走馬灯','SC06'],['母に通知を見せる・そばにいて','SC07'],['本音を伝える・ここにいるよ','SC09'],['ありがとう・ちゃんと聞こえた','SC10B'],['00:00・ケンの目線・閉眼','PHONE'],['視聴者へのメッセージ','MESSAGE']];
fs.writeFileSync('chapters.ffmeta',';FFMETADATA1\ntitle=最後の4分 — 全編通し確認版 v02\n'+chapters.map(([title,id],i)=>`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(timeline.find(t=>t.id===id).start*1000)}\nEND=${Math.round((i+1<chapters.length?timeline.find(t=>t.id===chapters[i+1][1]).start:cursor)*1000)}\ntitle=${title}\n`).join(''));
ff(['-f','concat','-safe','0','-i','concat.txt','-f','ffmetadata','-i','chapters.ffmeta','-map','0:v','-map','0:a','-map_metadata','1','-map_chapters','1','-vf','fps=24','-af','aresample=48000:async=1:first_pts=0','-t',String(cursor),...enc,'last-four-minutes-full-review-v02.mp4']);
fs.writeFileSync('timeline.json',JSON.stringify({duration:cursor,overlap,scenes:timeline},null,2));
ff(['-i','last-four-minutes-full-review-v02.mp4','-f','null','NUL']);
const probe=run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate:chapter=start_time,end_time,tags','-of','json','last-four-minutes-full-review-v02.mp4']);
fs.writeFileSync('verification.json',probe);console.log(probe);
