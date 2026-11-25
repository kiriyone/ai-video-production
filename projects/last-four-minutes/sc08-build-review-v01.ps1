$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    ffmpeg -hide_banner -loglevel error -y -loop 1 -i phone-blank.png -filter_script:v phone-filter.txt -t 4 -r 24 -c:v libx264 -crf 18 -pix_fmt yuv420p phone-insert-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Phone render failed' }
    ffmpeg -hide_banner -loglevel error -y -i sc08-take01-480p.mp4 -i phone-insert-v01.mp4 -filter_complex '[0:v]scale=1280:720,setsar=1,fps=24,split=2[v0][v1];[v0]trim=start=0:end=1,setpts=PTS-STARTPTS[a];[1:v]setsar=1,setpts=PTS-STARTPTS[b];[v1]trim=start=5:end=14,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v];[0:a]atrim=end=14,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=13.97:d=0.03[s]' -map '[v]' -map '[s]' -t 14 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart sc08-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'SC08 render failed' }
    $pairs=@(
        @{input='../SC07_SHOW_PHONE_TEST/sc07-review-v01.mp4';output='sc07-sc08-review-v01.mp4'},
        @{input='../SC07_SHOW_PHONE_TEST/sc02-sc07-review-v01.mp4';output='sc02-sc08-review-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.input -i sc08-review-v01.mp4 -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
        ffmpeg -hide_banner -loglevel error -i $pair.output -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        ffprobe -v error -show_entries format=duration -of json $pair.output
    }
} finally { Pop-Location }
