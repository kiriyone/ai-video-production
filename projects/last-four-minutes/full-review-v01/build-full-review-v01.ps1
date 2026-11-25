$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $opening='../../04_FOOTAGE/SC01_OPENING_TEST/sc01-take01-480p.mp4'
    $body='../../04_FOOTAGE/SC12_VIEWER_MESSAGE/sc02-message-ending-v01.mp4'
    # Use six seconds of the opening, preserving both dialogue turns. Pad only its tiny audio tail.
    $filter='[0:v]trim=duration=6,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,setsar=1,fps=24[v0];[0:a]atrim=duration=6,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=6,afade=t=in:d=0.02,afade=t=out:st=5.98:d=0.02[a0];[1:v]setpts=PTS-STARTPTS,setsar=1,fps=24[v1];[1:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
    ffmpeg -hide_banner -loglevel error -y -i $opening -i $body -f ffmetadata -i chapters.ffmeta -filter_complex $filter -map '[v]' -map '[a]' -map_metadata 2 -map_chapters 2 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart last-four-minutes-full-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Full review render failed' }
    ffmpeg -hide_banner -loglevel error -i last-four-minutes-full-review-v01.mp4 -f null NUL
    if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
    ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate:chapter=start_time,end_time,tags -of json last-four-minutes-full-review-v01.mp4 | Set-Content -Encoding utf8 verification.json
    ffmpeg -hide_banner -loglevel error -y -ss 4.5 -t 4 -i last-four-minutes-full-review-v01.mp4 -vf 'fps=2,scale=426:240,tile=4x2' -frames:v 1 opening-transition.jpg
    ffmpeg -hide_banner -loglevel error -y -i last-four-minutes-full-review-v01.mp4 -vf 'fps=1/15,scale=426:240,tile=4x4' -frames:v 1 full-contact.jpg
    if ($LASTEXITCODE -ne 0) { throw 'Review frames failed' }
    Get-Content -Raw verification.json
} finally { Pop-Location }
