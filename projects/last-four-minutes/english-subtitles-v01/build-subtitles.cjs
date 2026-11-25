const fs=require('fs');
process.chdir(__dirname);
const cues=[];
function add(scene,offset,start,end,ja,en,style='Dialogue') {cues.push({scene,start:offset+start,end:offset+end,ja,en,style});}
function scene(id,offset,rows){rows.forEach(r=>add(id,offset,...r));}
scene('SC01',0,[[1.32,3.05,'今日、どうだった？','How was your day?'],[3.88,5.05,'普通。','Fine.']]);
scene('SC02',6.625,[[1.07,4.55,'ケンさん、残された時間は4分です。','Ken, you have four minutes left.'],[4.98,6.08,'何これ？',"What's this?"],[6.17,7.13,'4分？','Four minutes?'],[7.14,9.23,'ご飯もちょうどそれくらい。',"Dinner will be ready by then."],[9.4,11.15,'いや、そっちじゃ……',"No, that's not..."]]);
scene('SC03',24.625,[[1.18,2.95,'これキャンセルして。','Cancel this.'],[3.02,5.43,'通知はオフにできます。','You can turn notifications off.'],[5.97,7.43,'通知じゃなくて。','Not the notification.']]);
scene('SC04',34.625,[[2.74,3.57,'母さん。','Mom.'],[3.61,4.5,'ん？','Hmm?'],[5.37,6.95,'俺、あと……','I... I only have...'],[7.37,8.9,'どうした？',"What's wrong?"],[11.69,13,'何でもない。','Nothing.']]);
scene('SC05',56.458333,[[0.2,2.8,'そこにいるなら、お皿出して。',"While you're there,\nget the plates."],[3.04,4.81,'今、時間ない。',"Not now. I don't have time."],[5,7.18,'いつもそうね.',"That's what you always say."],[7.75,8.92,'ケン？','Ken?']]);
scene('SC06_FIRST_STEP',70.458333,[[.27,1.47,'おいで。','Come here.']]);
scene('SC06_REJECTION',75.458333,[[.3,1.48,'もういいって。','Just leave it.']]);
scene('SC06_TODAY',81.458333,[[1.32,2.98,'今日、どうだった？','How was your day?']]);
// Repaired SC07 cue times will be finalized after the ADR word-time audit.
scene('SC07',84.458333,[[.55,1.7,'ケン？','Ken?'],[3,6,'母さん。これ、見て。','Mom. Look at this.']]);
scene('SC08',98.291667,[[3.73,6.05,'最終通知……','Final notice...'],[9.3,10.9,'あなたの？','Yours?']]);
scene('SC08B',112.125,[[.02,.95,'うん。','Yes.'],[4.45,6.65,'違う。だって、今……',"No. But... you're..."],[8.75,11.1,'これ、止められないの？',"Can't you stop it?"],[13.04,15,'変えられないって。',"It says I can't change it."]]);
scene('SC08C',134.125,[[6.75,9.6,'母さん。ここにいて。','Mom. Stay with me.']]);
scene('SC08DA',147.958333,[[.02,1.05,'うん。','Yes.'],[6.98,8.3,'……座ろう。',"Let's sit down."]]);
scene('SC09',169.958333,[[.52,3.05,'うん。聞いてる。',"Yes. I'm listening."],[5.1,9.45,'なんか、ちゃんと言わなきゃって。','I just... need to say this right.'],[11.7,14.8,'こういう時って、もっと……','At a time like this,\nI should...']]);
scene('SC09B',187.791667,[[2.09,4.8,'うまく言わなくていい。',"You don't have to find\nthe right words."],[8.67,10.15,'……怖い。',"I'm scared."]]);
scene('SC10',199.791667,[[.65,1.6,'うん。','Yes.'],[6.7,8.45,'ここにいるよ。',"I'm here."]]);
scene('SC10B',213.625,[[3.78,5.17,'……ありがとう。','Thank you.'],[8.08,9.12,'うん。','Yes.'],[9.42,11.55,'ちゃんと、聞こえた。','I heard you.']]);
scene('POV',238.625,[[7.7,8.63,'ケン？','Ken?']]);
add('PHONE_NOTICE',0,6.75,10.5,'最終通知／ケン／残りの寿命','FINAL NOTICE\nKEN\nTime left to live','Screen');
add('PHONE_MUTED',0,32.625,34.625,'通知 OFF／残り時間は変更できません','Muted.\nTime cannot be changed.','Screen');
add('PHONE_NOTICE_2',0,99.35,103.25,'最終通知／ケン／残りの寿命','FINAL NOTICE\nKEN\nTime left to live','Screen');
add('MESSAGE',0,249.125,254.625,'その想いを、伝えられるうちに。','Tell them how you feel\nwhile you still can.','Closing');
if(fs.existsSync('adr-cue.json')){const adr=JSON.parse(fs.readFileSync('adr-cue.json'));const c=cues.find(c=>c.scene==='SC07'&&c.en.startsWith('Mom.'));c.start=adr.start;c.end=adr.end;}
cues.sort((a,b)=>a.start-b.start);
const tc=(t,ass=false)=>{const n=Math.round(t*(ass?100:1000)),div=ass?100:1000;return `${String(Math.floor(n/div/3600)).padStart(ass?1:2,'0')}:${String(Math.floor(n/div/60)%60).padStart(2,'0')}:${String(Math.floor(n/div)%60).padStart(2,'0')}${ass?'.':','}${String(n%div).padStart(ass?2:3,'0')}`;};
const srt=rows=>rows.map((c,i)=>`${i+1}\n${tc(c.start)} --> ${tc(c.end)}\n${c.en}\n`).join('\n');
fs.writeFileSync('last-four-minutes.en.srt',srt(cues));
fs.writeFileSync('last-four-minutes.dialogue.en.srt',srt(cues.filter(c=>c.style==='Dialogue')));
fs.writeFileSync('last-four-minutes.screen-text.en.srt',srt(cues.filter(c=>c.style!=='Dialogue')));
const header=`[Script Info]
Title: Last Four Minutes — English subtitles
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Dialogue,Arial,34,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,0,0,0,0,100,100,0,0,1,1.8,0.5,2,75,75,44,1
Style: Screen,Arial,27,&H00F1F1F1,&H000000FF,&H00101010,&H90000000,0,0,0,0,100,100,0,0,1,1.5,0.5,5,60,60,40,1
Style: Closing,Arial,31,&H00DDDDE4,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,80,80,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
fs.writeFileSync('last-four-minutes.en.ass',header+cues.map(c=>{
let tag='';if(c.style==='Screen')tag='{\\pos(245,275)\\fad(100,100)}';
if(c.style==='Closing')tag='{\\pos(640,465)\\fad(1000,1000)}';
return `Dialogue: 0,${tc(c.start,true)},${tc(c.end,true)},${c.style},,0,0,0,,${tag}${c.en.replace(/\n/g,'\\N')}`;
}).join('\n')+'\n');
fs.writeFileSync('subtitle-cues.json',JSON.stringify(cues,null,2));
const warnings=[];for(const c of cues){const cps=c.en.replace(/\n/g,'').length/(c.end-c.start);if(cps>20)warnings.push({scene:c.scene,cps,text:c.en});if(c.start<0||c.end>255.625||c.end<=c.start)throw Error('Invalid cue');}
const dialog=cues.filter(c=>c.style==='Dialogue');for(let i=1;i<dialog.length;i++)if(dialog[i].start<dialog[i-1].end)throw Error('Overlapping dialogue '+dialog[i].scene);
fs.writeFileSync('subtitle-checks.json',JSON.stringify({totalCues:cues.length,dialogueCues:dialog.length,maxDialogueLines:Math.max(...dialog.map(c=>c.en.split('\n').length)),maxLineLength:Math.max(...dialog.flatMap(c=>c.en.split('\n').map(s=>s.length))),readingSpeedWarnings:warnings,overlapNote:'Screen text and dialogue intentionally use separate positions in ASS; separate SRT files supplied.'},null,2));
console.log('Built '+cues.length+' English cues.',warnings);
