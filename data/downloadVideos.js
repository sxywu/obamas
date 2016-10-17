var fs = require('fs');
var youtubedl = require('youtube-dl');

var allVideos = fs.readFileSync('filtered_videos.json', 'utf-8');
allVideos = JSON.parse(allVideos);

function downloadVideos(video, videos) {
  var url = 'http://www.youtube.com/watch?v=' + video.videoId;
  var options = {
    // Write automatic subtitle file (youtube only)
    auto: true,
    // Downloads all the available subtitles.
    all: false,
    // Languages of subtitles to download, separated by commas.
    lang: 'en',
    // The directory to save the downloaded files in.
    cwd: 'subtitles',
  };

  //
  youtubedl.getSubs(url, options, function(err, files) {
    if (err) throw err;
    console.log('subtitle files downloaded:', files);

    var download = youtubedl(url, ['--format=18']);
    download.on('info', function(info) {
      console.log('Download started');
      console.log('filename: ' + info.filename);
      console.log('size: ' + info.size);
    });
    download.pipe(fs.createWriteStream('videos/' + video.videoId + '.mp4'));
    download.on('end', function complete() {
      // after video finishes, download next one
      console.log(video.videoId);
      video = videos.shift();
      downloadVideos(video, videos);
    });

  });
}

var video = allVideos.shift();
downloadVideos(video, allVideos);
