import * as d3 from 'd3';
import _ from 'lodash';

var padding = {top: 20, left: 20};

export default function(data, images) {
  return [
    {
      id: 'all_hosts',
      position(width, top) {
        width *= 2 / 3;

        var hostSize = 50;
        var obamaSize = 40;

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

      `
    }
  ];
}
