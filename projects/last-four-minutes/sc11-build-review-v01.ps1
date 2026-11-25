param([switch]$PhoneOnly)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $phoneSource = '../SC08_MOTHER_UNDERSTANDS_TEST'
    foreach ($name in @('phone-blank.png','ui-font.ttc','timer-font.ttf','phone-title.txt','phone-name.txt','phone-label.txt')) {
        Copy-Item -LiteralPath (Join-Path $phoneSource $name) -Destination $name -Force
    }
    $filter = Get-Content -Raw (Join-Path $phoneSource 'phone-filter.txt')
    $filter = $filter.Replace('02\:38','00\:03').Replace('02\:37','00\:02').Replace('02\:36','00\:01').Replace('02\:35','00\:00')
    Set-Content -LiteralPath phone-filter.txt -Value $filter -Encoding utf8
    # Three original quiet pulses; zero receives no alarm. No borrowed TV audio.
    $ticks = 'aevalsrc=0.035*sin(2*PI*660*t)*exp(-55*mod(t\,1))*lt(mod(t\,1)\,0.13)*lt(t\,3):s=48000:d=4'
    ffmpeg -hide_banner -loglevel error -y -loop 1 -i phone-blank.png -f lavfi -i $ticks -filter_script:v phone-filter.txt -t 4 -r 24 -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart phone-zero-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Phone render failed' }
    if ($PhoneOnly) { return }
    # Remove the initial two seconds of unchanged posture so the loss of strength follows zero promptly.
    ffmpeg -hide_banner -loglevel error -y -ss 2 -i sc11-take01-480p.mp4 -t 12 -vf 'scale=1280:720:flags=lanczos,setsar=1,fps=24' -af 'afade=t=in:d=0.02,afade=t=out:st=11.97:d=0.03' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart sc11-acting-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Acting render failed' }
    $pairs=@(
        @{first='phone-zero-v01.mp4';second='sc11-acting-v01.mp4';output='sc11-review-v01.mp4'},
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc10b-review-v01.mp4';second='sc11-review-v01.mp4';output='sc10b-sc11-review-v01.mp4'},
        @{first='../SC10B_WORDS_REACH_HER_TEST/sc02-sc10b-review-v01.mp4';second='sc11-review-v01.mp4';output='sc02-sc11-review-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i $pair.second -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
        ffmpeg -hide_banner -loglevel error -i $pair.output -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        ffprobe -v error -show_entries format=duration -of json $pair.output
    }
} finally { Pop-Location }
