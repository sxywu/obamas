import * as d3 from 'd3';
import _ from 'lodash';

// import positions
var positions = {
  videoCaptions: require('../positions/video_captions.json'),
  hostTime: require('../positions/host_time.json'),
};

var padding = {top: 20, left: 20};
var hostSize = 50;
var obamaSize = 40;
var videoSize = 40;

function getQuarterFromDate(date) {
  var quarter = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarter, 1);
}

export default function(data, images, colors, emojis, isMobilePhone) {
  // initialize all the scales
  var viewExtent = d3.extent(data.videosData, d => d.statistics.viewCount);
  var durationExtent = d3.extent(data.videosData, d => d.duration);

  var xScale = d3.scaleTime();
  var opacityScale = d3.scaleLinear()
    .domain([new Date('January 20, 2009'),
      new Date('January 1, 2016'), new Date('November 8, 2016')])
    .range([0.05, 0.25, 1]);
  var radiusScale = d3.scaleLog().domain(viewExtent).range([videoSize / 6, videoSize]);
  var captionRadiusScale = d3.scaleLog().domain(durationExtent)
    .range([videoSize / 4, videoSize * 1.5]);

  return [
    {
      id: 'choose_video',
      updateSelectedVideo: true,
      style: {
        textAlign: 'center',
        paddingTop: 150,
        minHeight: 1200,
        width: isMobilePhone ? '100%' : '80%',
        margin: 'auto',
      },
      position(width, top, hover) {
        // if something's been hovered, do nothing
        if (hover) return {};

        top += (isMobilePhone ? 400 : 250) + 2 * videoSize;
        var vizSide = isMobilePhone ? padding.left / 2 : 2 * padding.left + obamaSize;
        var vizWidth = width - 2 * vizSide;

        var filteredVideos = _.filter(data.videosData, d => d.caption &&
          _.some(d.annotations, annotation => _.some(annotation.faces, face => face.happy)));

        // calculate videos
        var perWidth = vizWidth / filteredVideos.length;
        var videos = _.chain(filteredVideos)
          .sortBy(d => d.date)
          .map((video, i) => {
            var radius = radiusScale(video.statistics.viewCount) / 2;
            var captionRadius = captionRadiusScale(video.duration) / 2;
            var happy = _.filter(video.annotations, annotation =>
              _.some(annotation.faces, face => face.happy));
            happy = _.map(happy, (annotation, i) => {
              var theta = annotation.start / (video.duration * 1000);
              theta = theta * 2 * Math.PI - Math.PI / 2;
              return {
                index: i,
                total: happy.length,
                key: annotation.filename,
                x: (captionRadius / 2) * Math.cos(theta),
                y: (captionRadius / 2) * Math.sin(theta),
                guest: video.guest,
                data: annotation,
              }
            });

            return {
              key: video.videoId,
              radius,
              captionRadius,
              opacity: 0.5,
              x: (i + 0.5) * perWidth + vizSide,
              y: top,
              host: video.host,
              guest: video.guest,
              annotations: video.annotations,
              duration: video.duration,
              happy,
              video,
            };
          }).value();

        return {videos, vizWidth, vizSide, obamas: [], hosts: [], links: []};
      },
      text() {
        var numCaptions = _.filter(data.videosData, video => video.caption);

        if (isMobilePhone) {
          return `
  And finally, the pick-me-up: below are circles representing the **${numCaptions.length}** videos, each with a screenshot for every time someone talked.  *Tap on a video* to see the images, and *scrub over the timeline* to read the corresponding captions.  *Let go* to see <img width='24' src=${emojis.happy(100)} />'s on the President's face, then *tap the image* to jump to that moment of the video.
          `;
        }
        return `
And finally, the pick-me-up: below are circles representing the **${numCaptions.length}** videos, each with a screenshot for every time someone talked.  *Select a video* to see the images, and *hover over the timeline* to read the corresponding captions.  *Click on the timeline* to see <img width='24' src=${emojis.happy(100)} />'s on the President's face.  Then, *click on the image* to jump to that moment of the video.
        `;
      }
    }
  ];
}
