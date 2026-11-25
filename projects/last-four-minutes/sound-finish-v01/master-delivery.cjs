const fs=require('fs'),{spawnSync}=require('child_process');process.chdir(__dirname);
function run(cmd,a){const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:32e6});if(r.status!==0)throw Error(r.stderr||r.stdout);return r;}
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...a]);
const masterFilter='volume=7.2dB,aresample=192000,alimiter=limit=0.831764:attack=5:release=100:level=false:latency=true,aresample=48000';
ff(['-i','mix-premaster.wav','-af',masterFilter,'-t','255.625','-c:a','pcm_s24le','last-four-minutes-final-mix-v01.wav']);
ff(['-i','dialogue-balanced.wav','-af',masterFilter,'-t','255.625','-c:a','pcm_s24le','last-four-minutes-no-bgm-mix-v01.wav']);
for(const [name,video,audio]of [
 ['last-four-minutes-submission-review-en-v01.mp4','../english-subtitles-v01/last-four-minutes-english-subtitles-v01.mp4','last-four-minutes-final-mix-v01.wav'],
 ['last-four-minutes-clean-picture-mix-v01.mp4','../english-subtitles-v01/last-four-minutes-audio-fixed-v06.mp4','last-four-minutes-final-mix-v01.wav'],
 ['last-four-minutes-dialogue-only-review-en-v01.mp4','../english-subtitles-v01/last-four-minutes-english-subtitles-v01.mp4','last-four-minutes-no-bgm-mix-v01.wav']
]){
 ff(['-i',video,'-i',audio,'-map','0:v:0','-map','1:a:0','-map_metadata','0','-map_chapters','0','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-t','255.625','-metadata','title=Last Four Minutes — sound finish v01','-metadata:s:a:0','language=jpn','-movflags','+faststart',name]);
}
// Short A/B review uses the same picture twice. Normal viewing level is retained.
const old='../english-subtitles-v01/last-four-minutes-english-subtitles-v01.mp4',now='last-four-minutes-submission-review-en-v01.mp4';
const windows=[[82,31],[188,38],[238,17.625]];
const parts=[];
for(let k=0;k<windows.length;k++)for(const [name,input,label]of [['before',old,'BEFORE - NO BGM'],['after',now,'AFTER - MIX + BGM']]){
 const [start,len]=windows[k],out=`ab-${k}-${name}.mp4`;
 ff(['-ss',String(start),'-i',input,'-t',String(len),'-vf',`drawbox=x=18:y=18:w=320:h=44:color=black@0.7:t=fill,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${label}':fontcolor=white:fontsize=22:x=30:y=28`,'-map','0:v:0','-map','0:a:0','-map_chapters','-1','-c:v','libx264','-crf','19','-preset','fast','-threads','4','-c:a','aac','-b:a','256k',out]);parts.push(out);
}
fs.writeFileSync('ab-concat.txt',parts.map(p=>`file '${p}'`).join('\n'));
ff(['-f','concat','-safe','0','-i','ab-concat.txt','-c','copy','-movflags','+faststart','sound-before-after-review-v01.mp4']);
ff(['-ss','66','-i',now,'-t','28','-map_chapters','-1','-c:v','libx264','-crf','19','-preset','fast','-threads','4','-c:a','aac','-b:a','256k','-movflags','+faststart','memory-to-present-mix-preview.mp4']);
const measure=file=>{const r=run('ffmpeg',['-hide_banner','-nostats','-i',file,'-vn','-af','loudnorm=I=-20:TP=-1.6:LRA=20:print_format=json','-f','null','NUL']);return JSON.parse(r.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);};
fs.writeFileSync('loudness-report.json',JSON.stringify({before:measure(old),after:measure(now),targetNote:'Creative web review target approximately -20 LUFS; peak ceiling -1.6 dBTP before AAC. Not a contest-mandated loudness.',constantGainDB:7.2,limiter:'4x oversampling, -1.6 dB ceiling, 5 ms lookahead, latency compensated',duration:255.625},null,2));
ff(['-i',now,'-f','null','NUL']);
console.log('Rendered audio-finished masters, comparison and loudness report.');
