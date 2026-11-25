$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    Copy-Item -LiteralPath '../SC08_MOTHER_UNDERSTANDS_TEST/ui-font.ttc' -Destination 'ui-font.ttc' -Force
    $vf="drawtext=fontfile=ui-font.ttc:textfile=line1.txt:fontsize=44:fontcolor=0xE8E5DF:x=(w-text_w)/2:y=292,drawtext=fontfile=ui-font.ttc:textfile=line2.txt:fontsize=44:fontcolor=0xE8E5DF:x=(w-text_w)/2:y=372,fade=t=in:st=0.5:d=1,fade=t=out:st=5:d=1,setsar=1"
    ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=black:s=1280x720:r=24:d=7' -f lavfi -i 'anullsrc=r=48000:cl=stereo' -vf $vf -t 7 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart message-card-v01.mp4
    if ($LASTEXITCODE -ne 0) { throw 'Message card render failed' }
    $pairs=@(
        @{first='../SC11_KEN_POV_ENDING/ken-pov-ending-v02.mp4';output='pov-message-ending-v01.mp4'},
        @{first='../SC11_KEN_POV_ENDING/sc10b-pov-ending-v02.mp4';output='sc10b-message-ending-v01.mp4'},
        @{first='../SC11_KEN_POV_ENDING/sc02-pov-ending-v02.mp4';output='sc02-message-ending-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i message-card-v01.mp4 -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
    }
    foreach ($file in @('message-card-v01.mp4','pov-message-ending-v01.mp4','sc10b-message-ending-v01.mp4','sc02-message-ending-v01.mp4')) {
        ffmpeg -hide_banner -loglevel error -i $file -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        Write-Output $file
        ffprobe -v error -show_entries format=duration -of json $file
    }
    ffmpeg -hide_banner -loglevel error -y -ss 3 -i message-card-v01.mp4 -frames:v 1 message-card.jpg
    ffmpeg -hide_banner -loglevel error -y -ss 7 -i pov-message-ending-v01.mp4 -vf 'fps=1,scale=426:240,tile=5x2' -frames:v 1 ending-contact.jpg
} finally { Pop-Location }
