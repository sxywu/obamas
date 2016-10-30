import * as d3 from 'd3';
import _ from 'lodash';

var padding = {top: 20, left: 20};
var simulation = d3.forceSimulation()
  .force('charge', d3.forceCollide(d => d.radius))
  .force('x', d3.forceX(d => d.focusX))
  .force('y', d3.forceY(d => d.focusY))
  .stop();

export default function(data, images) {
  return [
    {
      id: 'all_hosts',
      position(width, top) {
        width *= 0.8;

        // position hosts first
        var perRow = 5;
        var perWidth = width / (perRow + 1);
        var hosts = _.chain(data.showsData)
          .sortBy(show => -show.dates.length)
          .map((show, i) => {
            var x = (i % perRow + 0.5) * perWidth + padding.left;
            var y = 2 * (Math.floor(i / perRow) + 0.5) * perWidth + top;

            return {
              x,
              y,
              radius: 30,
              host: show.host,
              image: show.image,
            };
          }).value();
        var hostsByKey = _.keyBy(hosts, 'host');

        var obamas = _.chain(data.showsData)
          .map(show => {
            var host = hostsByKey[show.host];
            return _.map(show.dates, data => {
              var [date, guest] = data;
              return {
                focusX: host.x,
                focusY: host.y + perWidth,
                image: images[guest],
                guest,
                radius: 10,
              };
            });
          }).flatten().value()

        simulation.nodes(obamas);
        _.times(1000, i => {
          simulation.tick();
        });

        return {hosts, obamas};
      },
      text: `

      `
    }
  ];
}
