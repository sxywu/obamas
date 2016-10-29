import * as d3 from 'd3';

var simulation = d3.forceSimulation()
  .force('charge', d3.forceCollide(d => d.radius))
  .force('x', d3.forceX(d => d.focusX))
  .force('y', d3.forceY(d => d.focusY));

export default function(data) {
  return [
    {
      id: 'all_hosts',
      position() {
        // position
      },
      text: `

      `
    }
  ];
}
