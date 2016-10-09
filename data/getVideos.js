var YouTube = require('youtube-node');
var fs = require('fs');
var _ = require('lodash');
var moment = require('moment')

var youTube = new YouTube();
var key = fs.readFileSync('key.txt', 'utf-8');
youTube.setKey(key);

var allShows = fs.readFileSync('data/shows.json', 'utf-8');
allShows = JSON.parse(allShows);
var final = [];

// get videos for a specific date for the show
function getShowForDate(show, shows, date, dates) {
  // if there are still dates left, keep going
  youTube.addParam('channelId', show.id);
  youTube.addParam('publishedAfter', moment(date).toISOString());
  youTube.addParam('publishedBefore', moment(date).add(5, 'day').toISOString());
  youTube.search('obama', 15, function(error, result) {
    if (error) {
      console.log(error);
    } else {
      // go through the results
      _.each(result.items, function(item) {
        item.snippet.videoId = item.id.videoId;
        // console.log(item.snippet.channelTitle + ': ' + item.snippet.title)
        final.push(item.snippet);
      });

      // now that we've finished getting the date, see if there's any more dates
      if (_.isEmpty(dates)) {
        // if we've gotten all the dates, save the file
        fs.writeFile('data/videos.json', JSON.stringify(final));
        // then get the next show if there are any left
        if (_.isEmpty(shows)) return;
        show = shows.shift();
        getShow(show, shows);
        return;
      }

      date = dates.shift();
      console.log(show.name, date)
      getShowForDate(show, shows, date, dates);
    }
  });
}

// go through all shows
function getShow(show, shows) {
  // if there's still shows left, then get each date
  var dates = show.dates;
  var date = dates.shift();
  getShowForDate(show, shows, date, dates);
}

 var show = allShows.shift();
 getShow(show, allShows);
