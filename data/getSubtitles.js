var fs = require('fs');
var _ = require('lodash');
var vttToJson = require("vtt-to-json");

var allSubtitles = fs.readdirSync('subtitles');
allSubtitles = _.filter(allSubtitles, function(s) {return s !== '.DS_Store'});

var allResults = {};

function getSubtitles(subtitle, subtitles) {
  if (!subtitle) {
    fs.writeFile('all_subtitles.json', JSON.stringify(allResults));
    return;
  }

  var subString = fs.readFileSync('subtitles/' + subtitle, 'utf-8');
  var videoName = subtitle.match(/(.*).en.vtt/);
  videoName = videoName[1];

  vttToJson(subString)
    .then((results) => {
      allResults[videoName] = _.map(results, result => {
        return {
          start: result.start,
          end: result.end,
          words: result.part
        };
      });

      subtitle = subtitles.shift();
      getSubtitles(subtitle, subtitles);
    });
}

var subtitle = allSubtitles.shift();
getSubtitles(subtitle, allSubtitles);
