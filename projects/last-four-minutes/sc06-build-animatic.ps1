$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $shots = @(
        @{name='01_birth';duration=2}, @{name='02_first_step';duration=1.5},
        @{name='03_water';duration=1}, @{name='04_bandage';duration=1.5},
        @{name='05_birthday';duration=1}, @{name='06_rejection';duration=1.5},
        @{name='07_friends';duration=1}, @{name='08_station';duration=1.5},
        @{name='09_blanket';duration=2}, @{name='10_today';duration=3}
    )
    New-Item -ItemType Directory -Force -Path clips | Out-Null
    foreach ($shot in $shots) {
        $imagePath = 'frames/' + $shot.name + '.png'
        $clipPath = 'clips/' + $shot.name + '.mp4'
        ffmpeg -hide_banner -loglevel error -loop 1 -framerate 24 -i $imagePath -t $shot.duration -vf 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1' -an -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -y $clipPath
        if ($LASTEXITCODE -ne 0) { throw ('Clip failed: ' + $shot.name) }
    }
    $lines = $shots | ForEach-Object { "file 'clips/" + $_.name + ".mp4'" }
    [IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'concat.txt'), $lines, [Text.UTF8Encoding]::new($false))
    ffmpeg -hide_banner -loglevel error -f concat -safe 0 -i concat.txt -c copy -y sc06-silent-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Concat failed' }
    ffmpeg -hide_banner -loglevel error -i sc06-silent-v01.mp4 -i audio/baby.mp3 -i audio/water.mp3 -i audio/train.mp3 -i ../SC01_OPENING_TEST/sc01-take01-480p.mp4 -filter_complex '[1:a]atrim=0:1.9,asetpts=PTS-STARTPTS,volume=1.5,afade=t=in:d=0.04,afade=t=out:st=1.4:d=0.5[a1];[2:a]atrim=2:3.7,asetpts=PTS-STARTPTS,volume=0.25,afade=t=in:d=0.08,afade=t=out:st=1.2:d=0.5,adelay=3400|3400[a2];[3:a]atrim=5:7,asetpts=PTS-STARTPTS,volume=0.2,afade=t=in:d=0.2,afade=t=out:st=1.5:d=0.5,adelay=9400|9400[a3];[4:a]atrim=0:2.65,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=2.55:d=0.1,adelay=13200|13200[a4];[a1][a2][a3][a4]amix=inputs=4:duration=longest:normalize=0,apad=whole_dur=16,atrim=duration=16,alimiter=limit=0.89:level=false[a]' -map 0:v -map '[a]' -t 16 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc06-animatic-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Audio mix failed' }
    ffmpeg -hide_banner -loglevel error -i ../SC05_DISHES_TEST/sc02-sc05-review-v01.mp4 -i sc06-animatic-v01.mp4 -filter_complex '[0:v]setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc02-sc06-review-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    ffmpeg -hide_banner -loglevel error -i sc06-animatic-v01.mp4 -f null NUL
    if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
    ffprobe -v error -show_entries format=duration -of json sc02-sc06-review-v01.mp4
} finally { Pop-Location }

