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
      .attr('opacity', 0.5)
      .transition().duration(duration)
      .attr('r', d => d.radius / 2);
    enter.append('text')
      .attr('fill', props.colors.host)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', 12);

    this.videos = enter.merge(this.videos)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });

    this.videos.selectAll('circle')
      .attr('fill', d => props.colors[d.guest]);
  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
