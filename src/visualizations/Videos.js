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
      .transition().duration(duration);
    enter.filter(d => d.captionRadius)
      .append('g')
      .classed('happy', true);
    enter.filter(d => d.captionRadius)
      .append('circle')
      .classed('caption', true)
      .attr('fill', 'none')
      .attr('stroke', props.colors.host)
      .attr('opacity', 0.75);

    // ENTER+UPDATE
    this.videos = enter.merge(this.videos)
      .attr('opacity', d => props.selectedVideo && props.selectedVideo.key === d.key ||
        !props.section.updateSelectedVideo ? 1 : 0.25)
      .style('cursor', 'pointer')
      .on('click', this.clickVideo);

    this.videos.transition().duration(props.scrollDuration)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x, y] + ')';
      });
    this.videos.select('.background')
      .datum(d => d)
      .attr('fill', d => props.colors[d.guest])
      .attr('opacity', d => d.opacity)
      .attr('r', d => (d.interpolateRadius ?
        d.interpolateRadius(props.interpolateScroll) : d.radius) / 2);
    this.videos.select('.caption')
      .datum(d => d)
      .attr('r', d => (d.interpolateCaption ?
        d.interpolateCaption(props.interpolateScroll) : d.captionRadius) / 2);

    // denote when there is a happy face
    var happy = this.videos.select('.happy')
      .selectAll('circle').data(d => d.happy);

    happy.exit().remove();

    happy.enter().append('circle')
      .attr('r', 2.5)
      .attr('opacity', 0.5)
      .attr('fill', d => props.colors[d.guest])
      .merge(happy)
      .attr('cx', d => d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x)
      .attr('cy', d => d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y);

    // add titles when appropriate
    var titles = this.videos.selectAll('.title')
      .data(d => {
        return d.title ? [{
          radius: d.captionRadius || d.radius,
          title: d.title,
        }] : [];
      }, d => d.key);

    titles.exit().remove();

    titles.enter().append('text')
      .classed('title', true)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', 10)
      .merge(titles)
      .attr('x', d => -d.radius / 2 - 2)
      .text(d => d.title);

  },

  clickVideo(d) {
    if (this.props.section.updateSelectedVideo) {
      this.props.updateSelectedVideo(d);
    } else {
      window.open('http://www.youtube.com/watch?v=' + d.video.videoId, '_new');
    }
  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
