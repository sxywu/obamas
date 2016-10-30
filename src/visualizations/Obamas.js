import React from 'react';
import * as d3 from 'd3';

var duration = 500;

var Obamas = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderObamas();
  },

  componentDidUpdate() {
    this.renderObamas();
  },

  renderObamas() {
    this.obamas = this.container.selectAll('.obama')
      .data(this.props.obamas, d => d.date + d.guest);

    this.obamas.exit().remove();

    this.obamas = this.obamas.enter().append('image')
      .classed('obama', true)
      .merge(this.obamas)
      .attr('x', d => d.x - d.radius / 2)
      .attr('y', d => d.y - d.radius / 2)
      .attr('width', d => d.radius)
      .attr('height', d => d.radius)
      .attr('xlink:href', d => d.image);
  },

  render() {

    return (
      <g ref='container' className='obamas' />
    );
  }
});

export default Obamas;
