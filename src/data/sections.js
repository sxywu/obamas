import * as d3 from 'd3';
import _ from 'lodash';

var padding = {top: 20, left: 20};
var hostSize = 50;
var obamaSize = 40;

export default function(data, images) {
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
            var y = row * perWidth + top;

            if (row === rows) {
              // if it's the last row
              x = x + (perRow * perWidth - extras * perWidth) / 2;
            }

            if (row !== 0) {
              y += 0.25 * perWidth;
            }

            return {
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
                  x = x - (extras * obamaSize) / 2;
                } else {
                  x = x - (perRow * obamaSize) / 2;
                }
                y = y * obamaSize;

                return {
                  key: show.channelId + date + guest,
                  x: host.x + x,
                  y: host.y + 1.5 * host.radius + y,
                  image: images[guest],
                  date,
                  guest,
                  radius: obamaSize * 0.85,
                };
              }).value();
          }).flatten().value()

        return {hosts, obamas};
      },
      text: `
Bloop.
      `
    },
    {
      id: 'by_time',
      position(width, top, bottom) {
        var xScale = d3.scaleLinear()
          .domain([new Date('January 20, 2009'), new Date('November 8, 2016')])
          .range([padding.left, width - padding.left]);

        var hosts = [];

        var obamas = _.chain(data.showsData)
          .map(show => {
            return _.map(show.dates, data => {
              var [date, guest] = data;
              return {
                key: show.channelId + date + guest,
                image: images[guest],
                date,
                guest,
                radius: obamaSize * 0.85,
              };
            });
          }).flatten()
          .groupBy(data => {
            var {date} = data;
            // group by quarter
            var quarter = Math.floor(date.getMonth() / 3) * 3;
            data.quarter = new Date(date.getFullYear(), quarter, 1);

            return data.quarter;
          }).map(dates => {
            return _.chain(dates)
              .sortBy(date => date.guest)
              .map((data, i) => {
                var {date, quarter} = data;
                return Object.assign(data, {
                  x: xScale(quarter),
                  y: bottom - padding.top - obamaSize - i * obamaSize,
                });
              }).value();
          }).flatten().value()
        return {hosts, obamas};
      },
      text: `
Bloop.
      `,
    }
  ];
}
