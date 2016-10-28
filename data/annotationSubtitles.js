var fs = require('fs');
var _ = require('lodash');

var subtitlesData = fs.readFileSync('../src/data/all_subtitles.json');
subtitlesData = JSON.parse(subtitlesData);
console.log(subtitlesData)
var annotationsData = _.mapValues(subtitlesData, (subtitle, videoKey) => {
  var data = fs.readFileSync('./annotations/' + videoKey + '.json');
  return JSON.parse(data);
});

var annotationsSubtitles = [];
_.each(annotationsData, (annotations, videoId) => {
  var subtitleByStart = _.groupBy(subtitlesData[videoId], 'start');
  _.each(annotations, (annotation, filename) => {
    var time = filename.match(/at-([\d\.]+).png/);
    time = parseFloat(time[1]) * 1000;
    var subtitle = subtitleByStart[time];
    if (!subtitle) {
      // if there's no subtitle delete the corresponding photo
      fs.unlinkSync('../public/' + filename);
      return;
    }

    annotationsSubtitles.push(Object.assign({
      start: subtitle[0].start,
      end: subtitle[0].end,
      words: _.map(subtitle, 'words').join(' '),
      videoId: videoId,
      filename: filename,
    }, annotation));
  });
});

fs.writeFile('../src/data/annotation_subtitles.json', JSON.stringify(annotationsSubtitles));
