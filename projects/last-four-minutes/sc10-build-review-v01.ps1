$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    ffmpeg -hide_banner -loglevel error -y -i sc10-take01-480p.mp4 -t 14 -vf 'scale=1280:720:flags=lanczos,setsar=1,fps=24' -af 'afade=t=in:d=0.02,afade=t=out:st=13.97:d=0.03' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart sc10-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Scene render failed' }
    $pairs=@(
        @{first='../SC09B_IM_SCARED_TEST/sc09b-review-v01.mp4';output='sc09b-sc10-review-v01.mp4'},
        @{first='../SC09B_IM_SCARED_TEST/sc02-sc09b-review-v01.mp4';output='sc02-sc10-review-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i sc10-review-v01.mp4 -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
        ffmpeg -hide_banner -loglevel error -i $pair.output -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        ffprobe -v error -show_entries format=duration -of json $pair.output
    }
} finally { Pop-Location }
