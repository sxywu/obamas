import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var Hosts = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderHosts(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderHosts(nextProps);
    return false;
  },

  renderHosts(props) {
    this.hosts = this.container.selectAll('.host')
      .data(props.hosts, d => d.host);

    this.hosts.exit().remove();

    var enter = this.hosts.enter().append('g')
      .classed('host', true)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });

    enter.append('circle')
      .classed('stroke', true)
      .attr('fill', props.colors.host);
    enter.append('image')
      .classed('image', true);

    this.hosts = enter.merge(this.hosts)
      .on('mouseenter', (d) => this.hoverHost(d))
      .on('mouseleave', (d) => this.hoverHost());

    this.hosts.transition().duration(props.scrollDuration)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });

    this.hosts.selectAll('.stroke')
      .attr('r', d => d.radius / 2);
    var padding = 3;
    this.hosts.selectAll('.image')
      .attr('x', d => -(d.radius - padding) / 2)
      .attr('y', d => -(d.radius - padding) / 2)
      .attr('width', d => (d.radius - padding))
      .attr('height', d => (d.radius - padding))
      .attr('xlink:href', d => d.image);
  },

  hoverHost(host) {
    if (!host) {
      this.props.updateHover();
      return;
    }
    var hover = {
      x: host.x,
      y: host.y + host.radius / 2,
      content: (
        <div>
          <span className='header'>{host.host}</span>,
          host of {host.shows.join(' and ')}
        </div>
      ),
    }
    this.props.updateHover(hover);
  },

  render() {

    return (
      <g ref='container' className='hosts' />
    );
  }
});

export default Hosts;
