import React from 'react';
import * as d3 from 'd3';

var duration = 1500;
function link(d) {
  return "M" + d.source.x + "," + d.source.y
      + "C" + d.source.x +  "," + (d.source.y + d.target.y) / 2
      + " " + d.target.x + "," + (d.source.y + d.target.y) / 2
      + " " + d.target.x + "," + d.target.y;
}

var Links = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderLinks(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderLinks(nextProps);
    return false;
  },

  renderLinks(props) {
    this.links = this.container.selectAll('.link')
      .data(props.links, d => d.source.key + d.target.key);

    this.links.exit().remove();

    this.links = this.links.enter().append('path')
      .classed('link', true)
      .attr('d', link)
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('opacity', d => d.opacity)
      .attr('stroke', d => props.colors[d.target.guest])
      .attr('stroke-dasharray', function(d) {
        d.length = this.getTotalLength();
        return d.length;
      }).attr('stroke-dashoffset', d => d.length)
      .transition().duration(duration)
      .attr('stroke-dashoffset', 0);
  },

  render() {

    return (
      <g ref='container' className='links' />
    );
  }
});

export default Links;
