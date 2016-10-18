var fs = require('fs');
var _ = require('lodash');
var ffmpeg = require('fluent-ffmpeg');
var vttToJson = require("vtt-to-json")

var allSubtitles = fs.readdirSync('subtitles/');
allSubtitles = _.filter(allSubtitles, function(subtitleUrl) {return subtitleUrl !== '.DS_Store'});
var remove = ['ziwYbVx_-qg', '2ihOXaU0I8o', '2TtdPbeKNFc',
  '8cKtijgcVJw', '95KTrtzOY-g', 'EYco1RQw66I',
  'L88H2HWEXrw' // try to figure out why this one doesn't work
];

function screenshotBySubtitle(subtitleUrl, subtitles) {
  if (!subtitleUrl) return;

  console.log(subtitleUrl);
  var videoName = subtitleUrl.match(/(.*).en.vtt/);
  videoName = videoName[1];

  if (_.includes(remove, videoName)) {
    subtitleUrl = subtitles.shift();
    screenshotBySubtitle(subtitleUrl, subtitles);
    return;
  };

  console.log('video name', videoName);
  var vtt = fs.readFileSync('subtitles/' + subtitleUrl, 'utf-8');
  var times = _.uniq(vtt.match(/(\d\d:\d\d:\d\d.\d\d\d)/g));
  console.log(times.length);

  var outputDir = 'screenshots/' + videoName;
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  }

  ffmpeg('videos/' + videoName + '.mp4')
    .on('filenames', function(filenames) {
      console.log('Will generate ' + filenames.length + ' files');
    })
    .on('end', function() {
      console.log('Screenshots taken');
      subtitleUrl = subtitles.shift();
      screenshotBySubtitle(subtitleUrl, subtitles);
    })
    .screenshots({
      timestamps: times,
      filename: '%f-at-%s.png',
      folder: outputDir
    });
}

var subtitleUrl = allSubtitles.shift();
screenshotBySubtitle(subtitleUrl, allSubtitles);
