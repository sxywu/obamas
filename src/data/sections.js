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
            var y = 1.5 * row * perWidth + top;

            if (row === rows) {
              // if it's the last row
              x = x + (perRow * perWidth - extras * perWidth) / 2;
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
                  x = x - (extras * obamaSize) / 2;
                } else {
                  x = x - (perRow * obamaSize) / 2;
                }
                y = y * obamaSize;

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

        return {hosts, obamas, links: []};
      },
      text: `
Bloop.
      `
    },
    {
      id: 'by_time',
      position(width, top) {
        top += window.innerHeight * 0.25 + 2 * hostSize;

        var xScale = d3.scaleLinear()
          .domain([new Date('January 20, 2009'), new Date('November 8, 2016')])
          .range([padding.left + obamaSize, width - padding.left - obamaSize]);
        var opacityScale = d3.scaleLinear()
          .domain([new Date('January 20, 2009'),
            new Date('January 1, 2016'), new Date('November 8, 2016')])
          .range([0.05, 0.35, 1]);

        var perWidth = width / data.showsData.length;
        var hosts = _.map(data.showsData, (show, i) => {
          return {
            key: show.host,
            fy: (i % 2 === 0) ? top : top + 2 * hostSize,
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
            var quarter = Math.floor(date.getMonth() / 3) * 3;
            data.quarter = new Date(date.getFullYear(), quarter, 1);

            return data.quarter;
          }).map(dates => {
            return _.chain(dates)
              .sortBy(date => date.guest)
              .map((data, i) => {
                var {date, quarter} = data;
                return Object.assign(data, {
                  fx: xScale(quarter),
                  fy: top + 4 * hostSize + 4 * obamaSize - i * obamaSize,
                });
              }).value();
          }).flatten().value()

        // use force layout to lay out the hosts/obamas and the links
        var simulation = d3.forceSimulation(_.union(obamas, hosts))
          .force('charge', d3.forceCollide(d => d.radius))
          .force("link", d3.forceLink(links))
          .stop();

        _.times(1000, i => {
          simulation.tick();
        });

        return {hosts, obamas, links};
      },
      text: `
Bloop.
      `,
    }
  ];
}
