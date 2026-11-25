$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    # Keep the moving performance. Fade its last three seconds, then hold true black for two seconds.
    ffmpeg -hide_banner -loglevel error -y -i '../SC11_TIME_RUNS_OUT_TEST/sc11-review-v01.mp4' -vf 'fade=t=out:st=13:d=3:color=black,tpad=stop_mode=add:stop_duration=2:color=black,setsar=1,fps=24' -af 'afade=t=out:st=13:d=3,apad=pad_dur=2,atrim=duration=18' -t 18 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart sc11-ending-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Ending render failed' }
    $pairs=@(
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc10b-review-v01.mp4';output='sc10b-ending-v01.mp4'},
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc02-sc10b-review-v01.mp4';output='sc02-ending-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i sc11-ending-v01.mp4 -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    }
    foreach ($file in @('sc11-ending-v01.mp4','sc10b-ending-v01.mp4','sc02-ending-v01.mp4')) {
        ffmpeg -hide_banner -loglevel error -i $file -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        Write-Output $file
        ffprobe -v error -show_entries format=duration -of json $file
    }
    ffmpeg -hide_banner -loglevel error -y -ss 12 -i sc11-ending-v01.mp4 -vf 'fps=1,scale=426:240,tile=3x2' -frames:v 1 ending-contact.jpg
    if ($LASTEXITCODE -ne 0) { throw 'Review contact sheet failed' }
} finally { Pop-Location }
