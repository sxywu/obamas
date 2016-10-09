var YouTube = require('youtube-node');
var fs = require('fs');
var _ = require('lodash');

var youTube = new YouTube();
var key = fs.readFileSync('key.txt', 'utf-8');
youTube.setKey(key);

var allVideos = fs.readFileSync('data/filtered_videos.json', 'utf-8');
allVideos = JSON.parse(allVideos);
var final = [];

function getDetail(video, videos) {
  youTube.getById(video.videoId, function(error, result) {
    if (error) {
      console.log(error);
    } else {
      // if it comes back, add the result to the video
      video.duration = result.items[0].contentDetails.duration;
      video.caption = result.items[0].contentDetails.caption;
      video.statistics = result.items[0].statistics;

      final.push(video);

      // if videos is now empty, save and exit
      if (_.isEmpty(videos)) {
        fs.writeFile('data/final_videos.json', JSON.stringify(final));
        return;
      }

      // else loop through again
      video = videos.shift();
      console.log(video.videoId);
      getDetail(video, videos);
    }
  });
}

var video = allVideos.shift();
getDetail(video, allVideos);
