const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
process.chdir(__dirname);
const footage=path.resolve('../../04_FOOTAGE');
const run=(args,cwd=__dirname)=>{const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{cwd,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);};
const enc=['-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart'];
const sc03=path.join(footage,'SC03_CANCEL_TEST');
let filter=fs.readFileSync(path.join(sc03,'sc03-edit-v01.txt'),'utf8').replace('03\\:40','03\\:34').replace('03\\:39','03\\:33');
fs.writeFileSync('sc03-filter.txt',filter);
run(['-i','sc03-take01-480p.mp4','-loop','1','-framerate','24','-i','../SC02_NOTIFICATION_TEST/phone-insert-v02.png','-filter_complex_script',path.resolve('sc03-filter.txt'),'-map','[v]','-map','[a]','-t','10',...enc,path.resolve('parts/SC03.mp4')],sc03);
const deadlineFrame=5919; // 6.625 s + 240 s, at 24 fps.
const timerWindows=[];
function clockFilter(template,startFrame,frames){
 let graph=template.replace(/,drawtext=fontfile=timer-font\.ttf:[\s\S]*?(?=,drawbox=x=561)/,'');
 const runs=[];
 for(let n=0;n<frames;n++){
  const remaining=Math.max(0,Math.ceil((deadlineFrame-startFrame-n)/24));
  if(!runs.length||runs.at(-1).remaining!==remaining)runs.push({start:n,end:n+1,remaining});else runs.at(-1).end=n+1;
 }
 for(const r of runs){
  const value=String(Math.floor(r.remaining/60)).padStart(2,'0')+'\\:'+String(r.remaining%60).padStart(2,'0');
  graph+=`,drawtext=fontfile=timer-font.ttf:text='${value}':fontsize=60:fontcolor=0xF6F3ED:x=640-text_w/2:y=372:enable='gte(n,${r.start})*lt(n,${r.end})'`;
 }
 timerWindows.push({startFrame,frames,runs});return graph;
}
const sc08=path.join(footage,'SC08_MOTHER_UNDERSTANDS_TEST');
filter=clockFilter(fs.readFileSync(path.join(sc08,'phone-filter.txt'),'utf8').trim(),2383,96);
fs.writeFileSync('sc08-phone-filter.txt',filter);
run(['-loop','1','-framerate','24','-i','phone-blank.png','-filter_script:v',path.resolve('sc08-phone-filter.txt'),'-t','4','-r','24',...enc,path.resolve('sc08-phone-v03.mp4')],sc08);
run(['-i',path.join(sc08,'sc08-take01-480p.mp4'),'-i','sc08-phone-v03.mp4','-filter_complex','[0:v]scale=1280:720,setsar=1,fps=24,split=2[v0][v1];[v0]trim=start=0:end=1,setpts=PTS-STARTPTS[a];[1:v]setsar=1,setpts=PTS-STARTPTS[b];[v1]trim=start=5:end=14,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v];[0:a]atrim=end=14,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=13.97:d=0.03[s]','-map','[v]','-map','[s]','-t','14',...enc,'parts/SC08.mp4']);
const sc11=path.join(footage,'SC11_TIME_RUNS_OUT_TEST');
filter=clockFilter(fs.readFileSync(path.join(sc11,'phone-filter.txt'),'utf8').trim(),5631,96);
fs.writeFileSync('last-phone-filter.txt',filter);
run(['-loop','1','-framerate','24','-i','phone-blank.png','-f','lavfi','-i','anoisesrc=color=brown:amplitude=0.003:sample_rate=48000:seed=2411','-filter_script:v',path.resolve('last-phone-filter.txt'),'-t','4','-r','24',...enc,path.resolve('parts/PHONE.mp4')],sc11);
// The last image remains mother's face. Zero appears only once the eyelids are closed.
fs.writeFileSync('zero.txt','00:00');
run(['-i',path.join(footage,'SC11_KEN_POV_ENDING/ken-pov-ending-v02.mp4'),'-vf',"drawtext=fontfile=timer-font.ttf:textfile=zero.txt:fontsize=40:fontcolor=0xB8B5AD:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t,8),0,if(lt(t,8.5),0.7,if(lt(t,9),(9-t)*1.4,0)))'",'-t','10',...enc,'parts/POV.mp4']);
fs.writeFileSync('clock-audit.json',JSON.stringify({fps:24,clockStartFrame:159,deadlineFrame,countdownFrames:5760,countdownSeconds:240,sc03:{firstFrame:783,firstDisplay:'03:34',nextDisplay:'03:33'},timerWindows,zeroFrame:5919},null,2));
console.log('Prepared corrected clock inserts and closing zero.');
