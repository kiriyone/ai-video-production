const fs=require('fs');const path=require('path');const {spawnSync}=require('child_process');
process.chdir(__dirname);
const prev=path.resolve('../full-review-v04');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;};
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error','-y',...a]);
const audit=JSON.parse(fs.readFileSync(path.join(prev,'edit-audit.json')));
const fixed=new Set(['R02','R04']);fs.mkdirSync('parts',{recursive:true});
// The generated continuation references were reduced vertically (~3.3%) and
// horizontally (~1.2%) relative to their preceding shots. A single fixed
// transform restores registration without animated zoom or dissolves.
const registration='scale=1296:744:flags=lanczos,pad=1300:744:4:0,fillborders=left=4:mode=smear,crop=1280:720:0:0,setsar=1';
for(const id of fixed){
 ff(['-i',path.join(prev,'parts',id+'.mp4'),'-vf',registration,'-an','-c:v','libx264','-crf','18','-preset','fast','-threads','4','-pix_fmt','yuv420p','parts/'+id+'.mp4']);
}
fs.writeFileSync('concat.txt',audit.cuts.map(s=>`file '${fixed.has(s.id)?'parts/':'../full-review-v04/parts/'}${s.id}.mp4'\nduration ${(s.endFrame-s.startFrame)/24}`).join('\n')+'\n');
const output='last-four-minutes-full-review-v05.mp4';
ff(['-f','concat','-safe','0','-i','concat.txt','-i',path.join(prev,'last-four-minutes-full-review-v04.mp4'),'-map','0:v:0','-map','1:a:0','-map_metadata','1','-map_chapters','1','-c','copy','-metadata','title=最後の4分 — 冒頭2か所の画角補正 v05','-movflags','+faststart',output]);
ff(['-i',output,'-f','null','NUL']);
fs.writeFileSync('verification.json',run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,width,height,r_frame_rate,nb_frames,start_time,duration','-of','json',output]));
fs.writeFileSync('edit-audit.json',JSON.stringify({base:'full-review-v04',modifiedParts:['R02','R04'],registration,intervals:audit.cuts.filter(s=>fixed.has(s.id)),audio:'v04 stream copied unchanged',allOtherParts:'original v04 encoded video packets reused',creditsSpent:0,clockStartFrame:159,zeroFrame:5919,totalFrames:6135},null,2));
const select=[446,447,590,591,1214,1215,1356,1357].map(n=>`eq(n\\,${n})`).join('+');
for(const [label,input]of [['before',path.join(prev,'last-four-minutes-full-review-v04.mp4')],['after',output]])ff(['-i',input,'-vf',`select='${select}',scale=480:270,tile=2x4`,'-frames:v','1','seams-'+label+'.jpg']);
ff(['-i',output,'-filter_complex','[0:v]split=2[va][vb];[va]trim=start=16:end=25.5,setpts=PTS-STARTPTS[a];[vb]trim=start=48:end=57.5,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v];[0:a]asplit=2[aa][ab];[aa]atrim=start=16:end=25.5,asetpts=PTS-STARTPTS[c];[ab]atrim=start=48:end=57.5,asetpts=PTS-STARTPTS[d];[c][d]concat=n=2:v=0:a=1[audio]','-map','[v]','-map','[audio]','-c:v','libx264','-crf','18','-preset','fast','-threads','4','-c:a','aac','-b:a','192k','-movflags','+faststart','two-fixes-review-v05.mp4']);
console.log('Rendered v05');
