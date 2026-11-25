$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    ffmpeg -hide_banner -loglevel error -y -i pov-take01-480p.mp4 -filter_complex_script eyelid-filter.txt -map '[outv]' -map '[outa]' -t 10 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart ken-pov-ending-v02.mp4
    if ($LASTEXITCODE -ne 0) { throw 'POV render failed' }
    $pairs=@(
        @{first='../SC11_TIME_RUNS_OUT_TEST/phone-zero-v01.mp4';second='ken-pov-ending-v02.mp4';output='sc11-pov-ending-v02.mp4'},
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc10b-review-v01.mp4';second='sc11-pov-ending-v02.mp4';output='sc10b-pov-ending-v02.mp4'},
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc02-sc10b-review-v01.mp4';second='sc11-pov-ending-v02.mp4';output='sc02-pov-ending-v02.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i $pair.second -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    }
    foreach ($file in @('ken-pov-ending-v02.mp4','sc11-pov-ending-v02.mp4','sc10b-pov-ending-v02.mp4','sc02-pov-ending-v02.mp4')) {
        ffmpeg -hide_banner -loglevel error -i $file -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        Write-Output $file
        ffprobe -v error -show_entries format=duration -of json $file
    }
    ffmpeg -hide_banner -loglevel error -y -i ken-pov-ending-v02.mp4 -vf 'fps=1,scale=426:240,tile=5x2' -frames:v 1 closing-contact.jpg
} finally { Pop-Location }
