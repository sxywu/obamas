import React from 'react';
import * as d3 from 'd3';

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

    this.videos = this.videos.enter().append('circle')
      .classed('video', true)
      .merge(this.videos)
      .attr('cx', d => d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x)
      .attr('cy', d => d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y)
      .attr('r', d => (d.interpolateRadius ?
        d.interpolateRadius(props.interpolateScroll) : d.radius) / 2)
      .attr('fill', d => props.colors[d.guest])
      .attr('opacity', 0.5);
  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
