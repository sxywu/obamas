import React from 'react';
// import _ from 'lodash';
import * as d3 from 'd3';

var duration = 500;

var Hosts = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderHosts();
  },

  componentDidUpdate() {
    this.renderHosts();
  },

  renderHosts() {
    this.hosts = this.container.selectAll('.host')
      .data(this.props.hosts, d => d.host);

    this.hosts.exit().remove();

    var enter = this.hosts.enter().append('g')
      .classed('host', true);

    enter.append('circle')
      .classed('stroke', true)
      .attr('fill', this.props.colors.host);
    enter.append('image')
      .classed('image', true);
    enter.append('text')
      .classed('name', true)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .attr('fill', this.props.colors.host);

    this.hosts = enter.merge(this.hosts)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    this.hosts.selectAll('.stroke')
      .attr('r', d => d.radius);
    var padding = 3;
    this.hosts.selectAll('.image')
      .attr('x', d => -(d.radius - padding))
      .attr('y', d => -(d.radius - padding))
      .attr('width', d => (d.radius - padding) * 2)
      .attr('height', d => (d.radius - padding) * 2)
      .attr('xlink:href', d => d.image);

    this.hosts.selectAll('.name')
      .attr('y', d => d.radius + 15)
      .text(d => d.host);
  },

  render() {

    return (
      <g ref='container' className='hosts' />
    );
  }
});

export default Hosts;