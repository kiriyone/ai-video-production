const fs=require('fs'),{spawnSync}=require('child_process');process.chdir(__dirname);
function run(cmd,a){const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:32e6});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;}
const ff=a=>run('ffmpeg',['-v','error',...a]);
const old='../english-subtitles-v01/last-four-minutes-english-subtitles-v01.mp4',master='last-four-minutes-submission-review-en-v01.mp4';
const hash=p=>ff(['-i',p,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
const a=hash(old),b=hash(master);if(a!==b)throw Error('Picture changed');
const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,nb_frames,r_frame_rate,sample_rate,channels,duration:format=duration,size','-of','json',master]));
const v=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
if(+v.nb_frames!==6135||v.r_frame_rate!=='24/1'||+probe.format.duration!==255.625||audio.sample_rate!=='48000')throw Error('Timing or sample format changed');
const l=JSON.parse(fs.readFileSync('loudness-report.json'));
if(+l.after.input_tp>-.9)throw Error('True peak safety margin failed');
const decisions=JSON.parse(fs.readFileSync('mix-decisions.json')),buf=fs.readFileSync('music-stem.f32'),m=new Float32Array(buf.buffer,buf.byteOffset,buf.length/4);
const silence=decisions.musicSilenceWindows.map(([s,e])=>{let peak=0;for(let i=Math.ceil(s*48000)*2;i<Math.floor(e*48000)*2;i++)peak=Math.max(peak,Math.abs(m[i]));if(peak>1e-7)throw Error('Music inside intended silence');return {start:s,end:e,peak};});
const margins=JSON.parse(fs.readFileSync('music-dialogue-margins.json')).cues;const minimumMargin=Math.min(...margins.map(c=>c.marginDb));
if(minimumMargin<15.8)throw Error('Music too loud against dialogue');
const rows=decisions.dialogueOperations.filter(c=>c.sourceBandRms>-32&&!c.speaker.includes('memory'));
const range=xs=>Math.max(...xs)-Math.min(...xs);
const result={videoBitstreamIdentical:true,videoHash:a,totalFrames:6135,fps:24,duration:255.625,resolution:[1280,720],audio:{codec:audio.codec_name,sampleRate:48000,channels:audio.channels,integratedLUFS:+l.after.input_i,truePeakDBTP:+l.after.input_tp,loudnessRangeLU:+l.after.input_lra,beforeLUFS:+l.before.input_i,beforeTruePeakDBTP:+l.before.input_tp},spokenLineBandRmsRange:{beforeDB:range(rows.map(c=>c.sourceBandRms)),afterAutomationDB:range(rows.map(c=>c.sourceBandRms+c.gainDb)),method:'Active 20 ms speech-band RMS; excludes memory fragments and very quiet ambiguous acknowledgement.'},minimumDialogueToMusicRmsMarginDB:minimumMargin,musicSilenceWindows:silence,countdown:{firstFrame:159,zeroFrame:5919,seconds:240},reviewScope:'Complete-program technical audio measurements, automated speech checks of generated BGM, subtitle/picture preservation. Perceptual voice identity and musical preference require human playback.',submissionStatus:'Review master only; not published/submitted; official watermark/packshot not yet added by platform.'};
fs.writeFileSync('master-checks.json',JSON.stringify(result,null,2));fs.writeFileSync('master-probe.json',JSON.stringify(probe,null,2));console.log(result);
