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
      id: 'by_hosts',
      half: isMobilePhone ? 900 : 0,
      style: {
        width: isMobilePhone ? window.innerWidth : '33%',
        paddingTop: 150,
        minHeight: isMobilePhone ? 1400 : 800,
      },
      position(width, top, hover) {
        // if something's been hovered, do nothing
        if (hover) return {};

        var left = isMobilePhone ? padding.left : width * 0.36;
        width = isMobilePhone ? width - 2 * padding.left : width * 0.64;
        top += isMobilePhone ? 700 : 200;

        // position hosts first
        var perRow = isMobilePhone ? 3 : 4;
        var perWidth = width / perRow;
        var length = data.showsData.length;
        var rows = Math.floor(length / perRow);
        var extras = length - rows * perRow;

        var hosts = _.chain(data.showsData)
          .sortBy(show => -show.dates.length)
          .map((show, i) => {
            var row = Math.floor(i / perRow);
            var x = (i % perRow + 0.5) * perWidth + left;
            var ySpacing = 3;
            if (row === 2) {
              ySpacing = 2.5;
            } else if (row > 2) {
              ySpacing = 2;
            };
            var y = (2 * hostSize + ySpacing * obamaSize) * row + top;

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
              shows: show.shows,
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
                var [date, guest, show] = data;
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
                  y: host.y + 1 * host.radius + y,
                  image: images[guest],
                  date,
                  guest,
                  show,
                  radius: obamaSize * 0.85,
                };
              }).value();
          }).flatten().value()

        return {hosts, obamas, links: [], videos: []};
      },
      text() {
        var barackHosts = _.filter(data.showsData, show => _.some(show.dates, date => date[1] === 'B'));
        var barackShows = _.chain(data.showsData)
          .map(show => _.chain(show.dates)
              .filter(date => date[1] === 'B').map(2).value())
          .flatten().uniq().value();
        var michelleHosts = _.filter(data.showsData, show => _.some(show.dates, date => date[1] === 'M'));
        var michelleShows = _.chain(data.showsData)
          .map(show => _.chain(show.dates)
              .filter(date => date[1] === 'M').map(2).value())
          .flatten().uniq().value();
        var numTimes = _.chain(data.showsData)
          .map(show => _.map(show.dates, date => date[1])).flatten().countBy().value();
        return `
Since his first time on *The Tonight Show with Jay Leno*, the <span style='color: ${colors.B}'>President</span> has made **${numTimes.B}** late-night appearances on ${barackShows.length} shows with ${barackHosts.length} different hosts.  Impressively, the <span style='color: ${colors.M}'>First Lady</span> has very similar numbers despite a three-year late start: **${numTimes.M}** appearances across ${michelleShows.length} shows, also with ${michelleHosts.length} hosts.

They seem to favor hosts David Letterman and Stephen Colbert over the years, appearing four times each on both shows.  Over the past half year however, the <span style='color: ${colors.B}'>POTUS</span> and <span style='color: ${colors.M}'>FLOTUS</span> have both appeared on newer shows hosted by Seth Meyers, James Corden and Samantha Bee.

<p style='line-height: 1.5'>
  <sup>(<em>${isMobilePhone ? 'Tap' : 'Hover over'} the images</em> for more detail on the host or appearance.)</sup>
</p>
        `;
      },
    },
    {
      id: 'by_time',
      half: isMobilePhone ? 500 : 250,
      style: {
        width: isMobilePhone ? '100%' : '33%',
        minHeight: isMobilePhone ? 900 : 500,
        paddingTop: isMobilePhone ? 150 : 175,
      },
      position(width, top, hover) {
        // if something's been hovered, we only want to change
        // opacity for things if it's host that's been hovered
        if (!_.isEmpty(hover) && hover.type !== 'host') return {};

        top += this.half + 2 * hostSize;
        var bottom = top + 4 * hostSize + 6 * obamaSize;
        var vizSide = padding.left + (isMobilePhone ? 10 : obamaSize);

        xScale.domain([new Date('January 1, 2009'), new Date('November 8, 2016')])
          .range([vizSide, width - vizSide]);

        var hosts = _.map(data.showsData, (show, i) => {
          var position = positions.hostTime[show.host];
          return {
            key: show.host,
            x: position.x * width,
            // fy: (i % 2 === 0) ? top : top + 1.75 * hostSize,
            y: (i % 2 === 0) ? top : top + 2 * hostSize,
            radius: hostSize,
            host: show.host,
            image: show.image,
            shows: show.shows,
          };
        });

        var links = [];
        // group obama interviews by quarter, and then position them
        var obamas = _.chain(data.showsData)
          .map(show => {
            var host = _.find(hosts, d => d.key === show.host);
            var opacity = 1;
            if (!_.isEmpty(hover) && hover.key !== host.key) {
              opacity = 0.05;
            }

            return _.map(show.dates, data => {
              var [date, guest, show] = data;
              var interview = {
                key: date + guest,
                image: images[guest],
                date,
                guest,
                show,
                radius: obamaSize * 0.85,
                opacity,
              };

              // add this to the links
              links.push({
                source: host,
                target: interview,
                opacity: !_.isEmpty(hover) ? opacity : opacityScale(date),
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
              .sortBy(date => date.date)
              .map((data, i) => {
                var {quarter} = data;
                var x = xScale(quarter);
                var y = bottom - (i + 1) * obamaSize;

                return Object.assign(data, {
                  x, y,
                  // fx: x,
                  // fy: y,
                });
              }).value();
          }).flatten().value();

        // if it's been hovered, return here bc i don't want to change videos
        if (hover) {
          return {hosts, obamas, links};
        }

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
                happy: [],
                guest: video.guest,
                video,
              }
            });
          }).flatten().value();

        // // use force layout to lay out the hosts/obamas and the links
        // var simulation = d3.forceSimulation(_.union(obamas, hosts))
        //   .force('collide', d3.forceCollide(d => d.radius))
        //   .force("link", d3.forceLink(links))
        //   .stop();
        //
        // _.times(1000, i => {
        //   simulation.tick();
        //   // go through each node and make sure it's in the bounds
        //   _.each(hosts, host => {
        //     if (host.x > width - padding.left - obamaSize) {
        //       console.log(host)
        //       host.x = width - padding.left - obamaSize - 2 * hostSize;
        //     }
        //   });
        // });
        //
        // var positions = _.reduce(hosts, (obj, host) => {
        //   obj[host.key] = {
        //     x: _.round(host.x / width, 5),
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
      text() {
        return `
The <span style='color: ${colors.M}'>FLOTUS</span> has made many appearances since 2012 for [Let's Move!](http://www.letsmove.gov/), [Reach Higher](https://www.whitehouse.gov/reach-higher), and [Let Girls Learn](https://www.whitehouse.gov/letgirlslearn) to promote healthy living and girls' education around the world.

The <span style='color: ${colors.B}'>POTUS</span>'s appearances, on the other hand, peaked in 2012 (presumably for the election) and again in the last year to [reflect on his presidency](https://www.youtube.com/watch?v=ziwYbVx_-qg) and promote Hillary Clinton's run for presidency.

<p style='line-height: 1.5'>
  <sup>(<em>${isMobilePhone ? 'Tap' : 'Hover over'} the hosts</em> to see the corresponding guest appearances.)</sup>
</p>
        `;
      }
    },
    {
      id: 'show_videos',
      half: isMobilePhone ? 550 : 0,
      style: {
        width: isMobilePhone ? '100%' : '33%',
        paddingTop: 150,
        height: isMobilePhone ? 1100 : '100vh',
      },
      position(width, top, hover) {
        // if something's been hovered, do nothing
        if (hover) return {};

        var obamaHeight = isMobilePhone ? 0 : 4 * obamaSize;
        top += this.half + obamaHeight;
        var vizSize = padding.left + (isMobilePhone ? padding.left : obamaSize);

        var startDate = new Date(isMobilePhone ? 'January 1, 2013' : 'January 1, 2009');
        var xScale = d3.scaleTime().domain([startDate, new Date('November 8, 2016')])
          .range([padding.left + obamaSize, width - (vizSize / 2)]);
        var yScale = d3.scaleLog().domain(viewExtent)
          .range([top + window.innerHeight * 0.95 - obamaHeight, top]);

        var includeTitles = ["ln3wAdRAim4", "RDocnbkHjhI", "95KTrtzOY-g", "Hq-URl9F17Y"];
        if (isMobilePhone) {
          // only show 2 instead of all 4
          includeTitles = ["RDocnbkHjhI", "Hq-URl9F17Y"];
        }
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
                annotations: video.annotations,
                happy: [],
                title: _.includes(includeTitles, video.videoId) ? video.title : '',
                video,
              }
            });
          }).flatten().value();

        var axes = {
          y: {
            transform: 'translate(' + [width - vizSize, 0] + ')',
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

        return {videos, axes, obamas: [], hosts: [], links: []};
      },
      text() {
        // calculate total appearances
        var numAppearances = _.chain(data.showsData).map('dates').flatten().value();

        return `
Out of the <span style='color: ${colors.B}'>POTUS</span> and <span style='color: ${colors.M}'>FLOTUS</span>'s **${numAppearances.length}** appearances on late-night, **${data.videosData.length}** video clips have made it on to the hosts' official Youtube channels.  The earliest uploaded video was the [Evolution of Mom Dancing](https://www.youtube.com/watch?v=Hq-URl9F17Y) (<span style='color: ${colors.M}'>FLOTUS</span>) on *Late Night with Jimmy Fallon* in 2013, and the most viewed were [Mean Tweets](https://www.youtube.com/watch?v=RDocnbkHjhI) (<span style='color: ${colors.B}'>POTUS</span>) on *Jimmy Kimmel Live* with 46M views and [Carpool Karaoke](https://www.youtube.com/watch?v=ln3wAdRAim4) (<span style='color: ${colors.M}'>FLOTUS</span>) with 45M views on the *Late Late Show with James Corden*.

<p style='line-height: 1.5'>
  <sup>(<em>${isMobilePhone ? 'Tap' : 'Click'} any circle</em> to watch the video on Youtube.  If nothing else, watch <a href='https://www.youtube.com/watch?v=ln3wAdRAim4' target='_new'>Carpool Karaoke</a> because <span style='color: ${colors.M}'>FLOTUS</span> is the coolest.)</sup>
</p>
        `;
      }
    },
    {
      id: 'show_captions',
      half: isMobilePhone ? 600 : 0,
      style: {
        width: isMobilePhone ? '100%' : '75%',
        paddingTop: 50,
        height: isMobilePhone ? 1250 : '100vh',
      },
      position(width, top, hover) {
        // if something's been hovered, do nothing
        if (hover) return {};

        var paddingTop = isMobilePhone ? 600 : 150;
        top += paddingTop;
        var vizHeight = window.innerHeight * 0.95 - (isMobilePhone ? 0 : paddingTop);
        var vizSide = 2 * padding.left + (isMobilePhone ? 0 : obamaSize);
        var vizWidth = width - 2 * vizSide;

        var filteredDates = _.filter(data.videosData, d => d.caption);
        var dateExtent = d3.extent(filteredDates, d => d.date);
        xScale.domain(dateExtent)
          .range([vizSide, width - vizSide]);

        // calculate videos
        var includeTitles = ['ln3wAdRAim4'];
        var videos = _.chain(data.videosData)
          .sortBy(d => d.date)
          .map(video => {
            var position = positions.videoCaptions[video.videoId];
            var captionRadius = video.caption ? captionRadiusScale(video.duration) : 0;
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
              radius: radiusScale(video.statistics.viewCount),
              captionRadius,
              opacity: video.caption ? 0.5 : 0.05,
              x: position.x * vizWidth + vizSide,
              y: position.y * vizHeight + top,
              // focusX: xScale(video.date),
              // focusY: yScale(video.statistics.viewCount),
              host: video.host,
              guest: video.guest,
              annotations: video.annotations,
              title: _.includes(includeTitles, video.videoId) ? video.title : '',
              happy,
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
          },
        };

        return {videos, axes, obamas: [], hosts: [], links: []};
      },
      text() {
        var numCaptions = _.filter(data.videosData, video => video.caption);

        var michelleVideos = _.filter(data.videosData, video => video.caption && video.guest === 'M');
        var michelleMax = 0;
        var michelleHappy = _.reduce(michelleVideos, (total, video) => {
          var sum = _.reduce(video.annotations, (sum, annotation) => {
            return sum + _.filter(annotation.faces, face => face.happy).length;
          }, 0);
          michelleMax = Math.max(sum, michelleMax);
          return total + sum;
        }, 0);
        var michelleAverage = michelleHappy / michelleVideos.length;

        var barackVideos = _.filter(data.videosData, video => video.caption && video.guest === 'B');
        var barackMax = 0;
        var barackHappy = _.reduce(barackVideos, (total, video) => {
          var sum = _.reduce(video.annotations, (sum, annotation) => {
            return sum + _.filter(annotation.faces, face => face.happy).length;
          }, 0);
          barackMax = Math.max(sum, barackMax);
          return total + sum;
        }, 0);
        var barackAverage = _.round(barackHappy / barackVideos.length, 2);

        return `
Here's the fun part: out of the **${data.videosData.length}** videos, **${numCaptions.length}** of them had captions.  So I took the liberty of taking a screenshot of the video every time someone talked, and fed the images into Google's [fancy facial recognition software](https://cloud.google.com/vision/).

The result is that videos with the First Lady have significantly more smiles than those with the President.  Out of ${michelleVideos.length} videos, those with <span style='color: ${colors.M}'>FLOTUS</span> had **${michelleHappy}** expressions of joy, with [as many as ${michelleMax} in a video](https://www.youtube.com/watch?v=ln3wAdRAim4).  Those with <span style='color: ${colors.B}'>POTUS</span>, on the other hand, only had **${barackHappy}** across ${barackVideos.length} videos, with a [high of ${barackMax}](https://www.youtube.com/watch?v=2TtdPbeKNFc).  That's an average of **${michelleAverage}** smiles per video for the First Lady, and **${barackAverage}** for the President; in other words, <span style='color: ${colors.M}'>FLOTUS</span> had **${_.round((michelleAverage - barackAverage) / barackAverage * 100, 2)}%** more smiles than <span style='color: ${colors.B}'>POTUS</span>.

<p style='line-height: 1.5'>
  <sup>(The smaller dots are every time someone smiled in a video.  <em>${isMobilePhone ? 'Tap' : 'Hover'}</em> for more details.)</sup>
</p>
        `;
      }
    },
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
And finally, the pick-me-up: below are circles representing the **${numCaptions.length}** videos, each with a screenshot for every time someone talked.  *Select a video* to see the images, and *hover over the timeline* to read the corresponding captions.  *Click on the timeline* while hovering to see <img width='24' src=${emojis.happy(100)} />'s on the President's face.  Then, *click on the image* to jump to that moment of the video.
        `;
      }
    }
  ];
}
