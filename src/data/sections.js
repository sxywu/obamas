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

export default function(data, images) {
  // initialize all the scales
  var viewExtent = d3.extent(data.videosData, d => d.statistics.viewCount);
  var durationExtent = d3.extent(data.videosData, d => d.duration);

  var xScale = d3.scaleTime();
  var yScale = d3.scaleLog().domain(viewExtent);
  var opacityScale = d3.scaleLinear()
    .domain([new Date('January 20, 2009'),
      new Date('January 1, 2016'), new Date('November 8, 2016')])
    .range([0.05, 0.25, 1]);
  var radiusScale = d3.scaleLog().domain(viewExtent).range([videoSize / 8, videoSize]);
  var captionRadiusScale = d3.scaleLog().domain(durationExtent)
    .range([videoSize / 4, videoSize * 2]);

  return [
    {
      id: 'by_hosts',
      position(width, top) {
        width *= 2 / 3;
        top += window.innerHeight * 0.25;

        // position hosts first
        var perRow = 4;
        var perWidth = width / perRow;
        var length = data.showsData.length;
        var rows = Math.floor(length / perRow);
        var extras = length - rows * perRow;

        var hosts = _.chain(data.showsData)
          .sortBy(show => -show.dates.length)
          .map((show, i) => {
            var row = Math.floor(i / perRow);
            var x = (i % perRow + 0.5) * perWidth;
            var y = 1.5 * row * perWidth + top;

            if (row === rows) {
              // if it's the last row
              x += (perRow * perWidth - extras * perWidth) / 2;
            }

            return {
              key: show.host,
              x,
              y,
              radius: hostSize,
              host: show.host,
              image: show.image,
            };
          }).value();
        var hostsByKey = _.keyBy(hosts, 'host');

        perRow = 3;
        var obamas = _.chain(data.showsData)
          .map(show => {
            var host = hostsByKey[show.host];
            length = show.dates.length;
            rows = Math.floor(length / perRow);
            extras = length - rows * perRow;

            return _.chain(show.dates)
              .sortBy(date => date[1])
              .map((data, i) => {
                var [date, guest] = data;
                var y = Math.floor(i / perRow);
                var x = (i % perRow + 0.5) * obamaSize;

                if (y === rows) {
                  // if it's the last row
                  x -= (extras * obamaSize) / 2;
                } else {
                  x -= (perRow * obamaSize) / 2;
                }
                y *= obamaSize;

                return {
                  key: date + guest,
                  x: host.x + x,
                  y: host.y + 1.5 * host.radius + y,
                  image: images[guest],
                  date,
                  guest,
                  radius: obamaSize * 0.85,
                };
              }).value();
          }).flatten().value()

        return {hosts, obamas, links: [], videos: []};
      },
      text: `
1.
      `
    },
    {
      id: 'by_time',
      half: 200,
      style: {
        minHeight: 500,
      },
      position(width, top) {
        top += this.half + 2 * hostSize;
        var bottom = top + 4 * hostSize + 6 * obamaSize;

        xScale.domain([new Date('January 1, 2009'), new Date('November 8, 2016')])
          .range([padding.left + obamaSize, width - padding.left - obamaSize]);

        var hosts = _.map(data.showsData, (show, i) => {
          var position = positions.hostTime[show.host];

          return {
            key: show.host,
            x: position.x * width,
            y: (i % 2 === 0) ? top : top + 2 * hostSize,
            radius: hostSize,
            host: show.host,
            image: show.image,
          };
        });

        var links = [];
        // group obama interviews by quarter, and then position them
        var obamas = _.chain(data.showsData)
          .map(show => {
            var host = _.find(hosts, d => d.key === show.host);

            return _.map(show.dates, data => {
              var [date, guest] = data;
              var interview = {
                key: date + guest,
                image: images[guest],
                date,
                guest,
                radius: obamaSize * 0.85,
              };

              // add this to the links
              links.push({
                source: host,
                target: interview,
                opacity: opacityScale(date),
              });

              return interview;
            });
          }).flatten()
          .groupBy(data => {
            var {date} = data;
            // group by quarter
            return data.quarter = getQuarterFromDate(date);
          }).map(dates => {
            return _.chain(dates)
              .sortBy(date => date.guest)
              .map((data, i) => {
                var {quarter} = data;
                var x = xScale(quarter);
                var y = bottom - (i + 1.25) * obamaSize;

                return Object.assign(data, {
                  x, y,
                  // fx: x,
                  // fy: y,
                });
              }).value();
          }).flatten().value();

        // videos
        // calculate videos
        var videos = _.chain(data.videosData)
          .sortBy(d => d.date)
          .groupBy(d => d.quarter = getQuarterFromDate(d.date))
          .map((data, key) => {
            var x = xScale(data[0].quarter);
            return _.map(data, video => {
              var radius = radiusScale(video.statistics.viewCount);
              return {
                key: video.videoId,
                x,
                y: bottom,
                radius,
                captionRadius: video.caption ? radius + 4 : 0,
                opacity: 0.5,
                guest: video.guest,
              }
            });
          }).flatten().value();

        // // use force layout to lay out the hosts/obamas and the links
        // var simulation = d3.forceSimulation(_.union(obamas, hosts))
        //   .force('charge', d3.forceCollide(d => d.radius))
        //   .force("link", d3.forceLink(links))
        //   .stop();
        //
        // _.times(1000, i => {
        //   simulation.tick();
        // });

        // var positions = _.reduce(hosts, (obj, host) => {
        //   obj[host.key] = {
        //     x: host.x / width,
        //   };
        //   return obj;
        // }, {});
        // console.log(JSON.stringify(positions));

        var axes = {
          x: {
            transform: 'translate(' + [0, bottom] + ')',
            scale: xScale,
          },
        };

        return {hosts, obamas, links, axes, videos};
      },
      text: `
2.
      `,
    },
    {
      id: 'show_videos',
      position(width, top) {
        var obamaHeight = 2 * hostSize + 5 * obamaSize;
        top += obamaHeight;
        var left = width - padding.left - obamaSize;

        xScale.domain([new Date('January 1, 2009'), new Date('November 8, 2016')])
          .range([padding.left + obamaSize, left]);
        yScale.range([top + window.innerHeight * 0.9 - obamaHeight, top]);

        // calculate videos
        var videos = _.chain(data.videosData)
          .sortBy(d => d.date)
          .groupBy(d => d.quarter = getQuarterFromDate(d.date))
          .map((data, key) => {
            var x = xScale(data[0].quarter);
            return _.map(data, video => {
              var radius = radiusScale(video.statistics.viewCount);
              return {
                key: video.videoId,
                radius,
                captionRadius: video.caption ? radius + 4 : 0,
                opacity: 0.5,
                x,
                y: yScale(video.statistics.viewCount),
                host: video.host,
                guest: video.guest,
                video,
              }
            });
          }).flatten().value();

        var axes = {
          y: {
            transform: 'translate(' + [left, 0] + ')',
            scale: yScale,
            format: (d, i) => {
              if (d >= 10000000) {
                // 10 million
                return d / 1000000 + 'm';
              } else if ((d > 1000000 && d % 2000000 === 0) || d === 1000000) {
                // million and evens
                return d / 1000000 + 'm';
              } else if (d >= 1000 && d < 1000000 && (d % 200000 === 0)) {
                // thousands and evens
                return d / 1000 + 'k';
              }
            },
          },
        };

        return {videos, axes};
      },
      text: `
3.
      `
    },
    {
      id: 'show_captions',
      position(width, top) {
        var vizHeight = window.innerHeight * 0.85;
        var vizSide = 2 * padding.left + obamaSize;
        var vizWidth = width - 2 * vizSide;

        var filteredDates = _.filter(data.videosData, d => d.caption);
        var dateExtent = d3.extent(filteredDates, d => d.date);
        xScale.domain(dateExtent)
          .range([vizSide, width - vizSide]);
        // yScale.range([top + vizHeight, top]);

        // calculate videos
        var videos = _.chain(data.videosData)
          .sortBy(d => d.date)
          .map(video => {
            var position = positions.videoCaptions[video.videoId];
            return {
              key: video.videoId,
              radius: radiusScale(video.statistics.viewCount),
              captionRadius: video.caption ? captionRadiusScale(video.duration) : 0,
              opacity: video.caption ? 0.5 : 0.15,
              x: position.x * vizWidth + vizSide,
              y: position.y * vizHeight + top,
              // focusX: xScale(video.date),
              // focusY: yScale(video.statistics.viewCount),
              host: video.host,
              guest: video.guest,
              video,
            };
          }).value();

        // // use force layout to lay out the hosts/obamas and the links
        // var simulation = d3.forceSimulation(videos)
        //   .force('charge', d3.forceCollide(d => d.captionRadius * 0.5))
        //   .force('x', d3.forceX(d => d.focusX))
        //   .force('y', d3.forceY(d => d.focusY))
        //   .stop();
        //
        // _.times(1000, i => {
        //   simulation.tick();
        // });
        //
        // var positions = _.reduce(videos, (obj, video) => {
        //   obj[video.key] = {
        //     x: (video.x - vizSide) / vizWidth,
        //     y: (video.y - top) / vizHeight,
        //   };
        //   return obj;
        // }, {});
        // console.log(JSON.stringify(positions));

        var axes = {
          x: {
            scale: xScale,
            transform: 'translate(' + [0, top + vizHeight + 2 * padding.top] + ')',
          }
        };

        return {videos, axes};
      },
      text: `

      `
    }
  ];
}
