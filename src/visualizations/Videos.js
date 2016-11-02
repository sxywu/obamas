import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var duration = 250;

var Videos = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderVideos(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderVideos(nextProps);
    return false;
  },

  renderVideos(props) {
    this.videos = this.container.selectAll('.video')
      .data(props.videos, d => d.key);

    this.videos.exit().remove();

    var enter = this.videos.enter().append('g')
      .classed('video', true);

    enter.append('circle')
      .classed('background', true)
      .attr('opacity', 0.5)
      .transition().duration(duration)
      .attr('r', d => d.radius / 2);
    enter.filter(d => d.caption)
      .append('circle')
      .classed('caption', true)
      .attr('opacity', 0.75)
      .attr('fill', 'none')
      .attr('stroke', props.colors.host);

    this.videos = enter.merge(this.videos)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });

    this.videos.selectAll('.background')
      .attr('fill', d => props.colors[d.guest])
      .attr('r', d => d.radius / 2);
    this.videos.selectAll('.caption')
      .attr('r', d => d.radius / 2 + 2);
  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
