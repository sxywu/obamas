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
      .classed('video', true)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });

    enter.append('circle')
      .classed('background', true)
      .transition().duration(duration)
      .attr('r', d => d.radius / 2);
    enter.filter(d => d.captionRadius)
      .append('g')
      .classed('happy', true);
    enter.filter(d => d.captionRadius)
      .append('circle')
      .classed('caption', true)
      .attr('opacity', 0.75)
      .attr('fill', 'none')
      .attr('stroke', props.colors.host);

    this.videos = enter.merge(this.videos);

    this.videos.transition().duration(props.scrollDuration)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });
    this.videos.select('.background')
      .datum(d => d)
      .attr('fill', d => props.colors[d.guest])
      .attr('opacity', d => d.opacity);
    this.videos.select('.caption')
      .datum(d => d)
      .transition().duration(props.scrollDuration)
      .attr('r', d => (d.interpolateCaption ?
        d.interpolateCaption(props.interpolateScroll) : d.captionRadius) / 2);

    // denote when there is a happy face
    var happy = this.videos.select('.happy')
      .selectAll('circle').data(d => d.happy);

    happy.exit().remove();

    happy.enter().append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 2.5)
      .attr('fill', d => props.colors[d.guest]);

  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
