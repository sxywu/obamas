import * as d3 from 'd3';
import _ from 'lodash';

var padding = {top: 20, left: 20};
var simulation = d3.forceSimulation()
  .force('charge', d3.forceCollide(d => d.radius))
  .force('x', d3.forceX(d => d.focusX))
  .force('y', d3.forceY(d => d.focusY));

export default function(data) {
  return [
    {
      id: 'all_hosts',
      position(width, top) {
        width *= 0.75;

        // position hosts first
        var perRow = 5;
        var perWidth = (width - (perRow - 1) * padding.left - 2 * padding.left) / (perRow + 1);
        var hosts = _.map(data.showsData, (show, i) => {
          var x = (i % perRow + 0.5) * perWidth + padding.left;
          var y = 2 * (Math.floor(i / perRow) + 0.5) * perWidth + top;

          return {
            x,
            y,
            radius: 30,
            host: show.host,
            image: show.image,
          };
        });

        return {hosts};
      },
      text: `

      `
    }
  ];
}
