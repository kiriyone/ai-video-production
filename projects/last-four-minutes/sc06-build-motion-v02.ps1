$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $shots = @(
        @{name='01_birth';start=0;duration=2},
        @{name='02_first_step';start=0;duration=1.5},
        @{name='03_water';start=0.25;duration=1},
        @{name='04_bandage';start=0.5;duration=1.5},
        @{name='05_birthday';start=0.25;duration=1},
        @{name='06_rejection';start=0;duration=1.5},
        @{name='07_friends';start=0.25;duration=1},
        @{name='08_station';start=0.25;duration=1.5},
        @{name='09_blanket';start=1;duration=2},
        @{name='10_today';start=0;duration=3}
    )
    New-Item -ItemType Directory -Force -Path clips | Out-Null
    foreach ($shot in $shots) {
        $sourcePath = 'source/' + $shot.name + '.mp4'
        $clipPath = 'clips/' + $shot.name + '.mp4'
        $fadeOut = $shot.duration - 0.03
        $audioFilter = 'afade=t=in:d=0.03,afade=t=out:st=' + $fadeOut + ':d=0.03,alimiter=limit=0.89:level=false'
        ffmpeg -hide_banner -loglevel error -ss $shot.start -i $sourcePath -t $shot.duration -vf 'scale=1280:720:flags=lanczos,setsar=1' -r 24 -af $audioFilter -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -y $clipPath
        if ($LASTEXITCODE -ne 0) { throw ('Clip failed: ' + $shot.name) }
    }
    $lines = $shots | ForEach-Object { "file 'clips/" + $_.name + ".mp4'" }
    [IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'concat.txt'), $lines, [Text.UTF8Encoding]::new($false))
    ffmpeg -hide_banner -loglevel error -f concat -safe 0 -i concat.txt -t 16 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc06-motion-v02.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Montage render failed' }
    ffmpeg -hide_banner -loglevel error -i ../SC05_DISHES_TEST/sc02-sc05-review-v01.mp4 -i sc06-motion-v02.mp4 -filter_complex '[0:v]setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -y sc02-sc06-motion-v02.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    ffmpeg -hide_banner -loglevel error -i sc02-sc06-motion-v02.mp4 -f null NUL
    if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
    ffprobe -v error -show_entries format=duration -of json sc06-motion-v02.mp4
    ffprobe -v error -show_entries format=duration -of json sc02-sc06-motion-v02.mp4
} finally { Pop-Location }

