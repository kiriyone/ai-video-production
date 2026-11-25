$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    ffmpeg -hide_banner -loglevel error -i sc04-take01-480p.mp4 -t 16 -vf 'scale=1280:720:flags=lanczos,setsar=1' -r 24 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc04-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Standalone render failed' }
    ffmpeg -hide_banner -loglevel error -i ../SC03_CANCEL_TEST/sc02-sc03-review-v01.mp4 -i sc04-review-v01.mp4 -filter_complex '[0:v]setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc02-sc04-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    ffprobe -v error -show_entries format=duration -of json sc02-sc04-review-v01.mp4
} finally {
    Pop-Location
}

