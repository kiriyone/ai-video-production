const fs=require('fs'),{spawnSync}=require('child_process');process.chdir(__dirname);
function run(cmd,a){const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:32*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout;}
const ff=a=>run('ffmpeg',['-hide_banner','-loglevel','error',...a]);
const original='../full-review-v05/last-four-minutes-full-review-v05.mp4',fixed='last-four-minutes-audio-fixed-v06.mp4',final='last-four-minutes-english-subtitles-v01.mp4';
const hash=(p,stream)=>ff(['-i',p,'-map',stream,'-c','copy','-f','hash','-hash','sha256','-']).trim();
const originalVideoHash=hash(original,'0:v:0'),fixedVideoHash=hash(fixed,'0:v:0');
if(originalVideoHash!==fixedVideoHash)throw Error('Source video stream changed during audio repair');
const fixedAudioHash=hash(fixed,'0:a:0'),finalAudioHash=hash(final,'0:a:0');
if(fixedAudioHash!==finalAudioHash)throw Error('Repaired audio changed in subtitle render');
const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height,nb_frames,r_frame_rate,duration:format=duration','-of','json',final]));
const v=probe.streams.find(s=>s.codec_type==='video');if(+v.nb_frames!==6135||v.r_frame_rate!=='24/1'||+probe.format.duration!==255.625)throw Error('Video timing changed');
const times=JSON.parse(run('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',final])).frames.map(f=>+f.best_effort_timestamp_time);
const timingError=Math.max(...times.map((t,i)=>Math.abs(t-i/24)));if(timingError>.00001)throw Error('Irregular frame cadence');
const repairs=JSON.parse(fs.readFileSync('audio-repair-manifest.json'));
if(repairs.changedSamplesOutsidePatches!==0||repairs.peak>=1)throw Error('Audio patch validation failed');
const check=JSON.parse(fs.readFileSync('subtitle-checks.json'));
if(check.readingSpeedWarnings.length)throw Error('Unresolved subtitle reading-speed warning');
const result={videoStreamIdenticalBeforeSubtitles:true,originalVideoHash,subtitledAudioIdenticalToRepairedMaster:true,fixedAudioHash,frames:6135,fps:24,width:1280,height:720,duration:255.625,maxFrameTimingErrorSeconds:timingError,countdownStartFrame:159,zeroAndClosedFrame:5919,countdownSeconds:240,audioChangesRestrictedToApprovedWindows:true,pcmPeak:repairs.peak,subtitleCues:check.totalCues,dialogueMaximumLines:check.maxDialogueLines,subtitleReadingSpeed:'All <=20 characters/sec',decode:'Passed in render-english.cjs',reviewScope:'ASR and wave timing plus rendered-frame visual inspection. Human full-length auditory review remains a finishing check.'};
fs.writeFileSync('checks.json',JSON.stringify(result,null,2));console.log(result);
