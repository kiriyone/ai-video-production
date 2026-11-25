const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
process.chdir(__dirname);
const run=(cmd,a)=>{const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;};
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...a]);
const source=path.resolve('../full-review-v05/last-four-minutes-full-review-v05.mp4');
if(process.argv.includes('--picture')){
 ff(['-i',source,'-map','0:v:0','-vf','ass=last-four-minutes.en.ass','-an','-c:v','libx264','-crf','18','-preset','fast','-threads','4','-pix_fmt','yuv420p','-frames:v','6135','english-picture.mp4']);
 console.log('Rendered English subtitle picture.');process.exit(0);
}
const output='last-four-minutes-english-subtitles-v01.mp4';
ff(['-i','english-picture.mp4','-i','last-four-minutes-audio-fixed-v06.mp4','-map','0:v:0','-map','1:a:0','-map_metadata','1','-map_chapters','1','-c','copy','-metadata','title=Last Four Minutes — English subtitles','-metadata:s:a:0','language=jpn','-t','255.625','-movflags','+faststart',output]);
ff(['-ss','82','-i',output,'-t','31','-c:v','libx264','-crf','18','-preset','fast','-threads','4','-c:a','aac','-b:a','192k','-map_chapters','-1','-movflags','+faststart','repaired-sc07-sc08-english-review.mp4']);
fs.writeFileSync('verification.json',run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,start_time','-of','json',output]));
ff(['-i',output,'-f','null','NUL']);
console.log('Finished English-subtitled full film.');
