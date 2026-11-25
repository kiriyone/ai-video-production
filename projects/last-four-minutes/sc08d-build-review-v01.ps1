$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    foreach ($s in @(@{name='B';duration=12})) {
        $outFade=$s.duration-0.03
        ffmpeg -hide_banner -loglevel error -y -i ('sc08d-'+$s.name+'-480p.mp4') -t $s.duration -vf 'scale=1280:720:flags=lanczos,setsar=1,fps=24' -af ('afade=t=in:d=0.02,afade=t=out:st='+$outFade+':d=0.03') -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 ('part-'+$s.name+'.mp4')
        if ($LASTEXITCODE -ne 0) { throw 'Part render failed' }
    }
    ffmpeg -hide_banner -loglevel error -y -i sc08d-A-480p.mp4 -filter_complex '[0:v]split=2[p][q];[p]trim=end=5,setpts=PTS-STARTPTS,scale=1280:720,setsar=1,fps=24[v0];[q]trim=start=5:end=10,setpts=PTS-STARTPTS,crop=420:236:410:50,scale=1280:720,setsar=1,fps=24[v1];[v0][v1]concat=n=2:v=1:a=0[v];[0:a]atrim=end=10,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=9.97:d=0.03[a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 part-A.mp4
    if ($LASTEXITCODE -ne 0) { throw 'A render failed' }
    $pairs=@(
        @{first='part-A.mp4';second='part-B.mp4';output='sc08d-review-v01.mp4'},
        @{first='../SC08C_STAY_WITH_ME_TEST/sc08c-review-v01.mp4';second='sc08d-review-v01.mp4';output='sc08c-sc08d-review-v01.mp4'},
        @{first='../SC08C_STAY_WITH_ME_TEST/sc02-sc08c-review-v01.mp4';second='sc08d-review-v01.mp4';output='sc02-sc08d-review-v01.mp4'}
    )
    foreach ($pair in $pairs) {
        ffmpeg -hide_banner -loglevel error -y -i $pair.first -i $pair.second -filter_complex '[0:v]setsar=1,setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setsar=1,setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $pair.output
        if ($LASTEXITCODE -ne 0) { throw 'Combined render failed' }
        ffmpeg -hide_banner -loglevel error -i $pair.output -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'Decode check failed' }
        ffprobe -v error -show_entries format=duration -of json $pair.output
    }
} finally { Pop-Location }
