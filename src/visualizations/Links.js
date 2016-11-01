import React from 'react';
import * as d3 from 'd3';

var duration = 500;
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
      .merge(this.links)
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('d', link)
      .attr('opacity', d => d.opacity)
      .attr('stroke', d => props.colors[d.target.guest]);
  },

  render() {

    return (
      <g ref='container' className='links' />
    );
  }
});

export default Links;
