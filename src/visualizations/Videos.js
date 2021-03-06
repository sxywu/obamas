import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var duration = 250;
var formatTime = d3.timeFormat("%B %d, %Y");
var formatViews = d3.format(".2s");

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
      .attr('opacity', d => (props.selectedVideo && props.selectedVideo.key === d.key) ||
        !props.section.updateSelectedVideo ? 1 : 0.25);

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
        d.interpolateRadius(props.interpolateScroll) : d.radius) / 2)
      .style('cursor', 'pointer')
      .on('click', this.clickVideo);
    if (!this.props.isMobilePhone) {
      this.videos.select('.background')
        .on('mouseenter', d => this.hoverVideo(d))
        .on('mouseleave', d => this.hoverVideo());
    }

    this.videos.select('.caption')
      .datum(d => d)
      .attr('r', d => (d.interpolateCaption ?
        d.interpolateCaption(props.interpolateScroll) : d.captionRadius) / 2)
      .style('pointer-events', 'none');

    // denote when there is a happy face
    var happy = this.videos.select('.happy')
      .selectAll('circle').data(d => {
        return _.map(d.happy, happy => {
          // add parent x and y
          return Object.assign({video: d}, happy);
        });
      });

    happy.exit().remove();

    happy = happy.enter().append('circle')
      .attr('r', 3)
      .attr('opacity', 0.5)
      .attr('fill', d => props.colors[d.guest])
      .merge(happy)
      .attr('cx', d => d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x)
      .attr('cy', d => d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y)
      .style('cursor', 'pointer');
    if (!this.props.isMobilePhone) {
      happy.on('mouseenter', d => this.hoverEmoji(d))
        .on('mouseleave', d => this.hoverEmoji());
    }

    // add titles when appropriate
    var titles = this.videos.selectAll('.header')
      .data(d => {
        return d.title ? [{
          radius: d.captionRadius || d.radius,
          title: d.title,
        }] : [];
      }, d => d.key);

    titles.exit().remove();

    titles.enter().append('text')
      .classed('header', true)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .merge(titles)
      .attr('y', d => d.radius / 2 + 5)
      .style('pointer-events', 'none')
      .html(d => {
        var text = d.title.split(' ');
        var html = '';
        var perRow = 3;

        _.each(text, (t, i) => {
          // if it's the first in the row, add the start
          if (i % perRow === 0) {
            html += '<tspan x="0" dy="1.35em">' + t;
          } else if (i % perRow === (perRow - 1)) {
            // else if it's the last in the row, close it
            html += ' ' + t + '</tspan>';
          } else {
            // everything else, just append the word
            html += ' ' + t;
          }
        });
        return html;
      });

  },

  clickVideo(d) {
    if (this.props.section.updateSelectedVideo) {
      this.props.updateSelectedVideo(d);
    } else {
      window.open('http://www.youtube.com/watch?v=' + d.video.videoId, '_new');
    }
  },

  hoverVideo(video) {
    if (!video) {
      this.props.updateHover();
      return;
    }
    var hover = {
      type: 'video',
      x: video.interpolateX ? video.interpolateX(this.props.interpolateScroll) : video.x,
      y: (video.interpolateY ? video.interpolateY(this.props.interpolateScroll) : video.y) +
        (video.captionRadius || video.radius) / 2,
      content: (
        <div>
          <span className='header'>{video.video.title}</span><br />
          published on {video.video.channelTitle}, {formatTime(video.video.date)}<br />
          ({formatViews(video.video.statistics.viewCount)} views)
        </div>
      ),
    }
    this.props.updateHover(hover);
  },

  hoverEmoji(emoji) {
    if (!emoji) {
      this.props.updateHover();
      return;
    }
    var faces = _.map(emoji.data.faces, face => {
      var emoji = face.happy ? this.props.emojis.happy(face.confidence) : this.props.emojis.neutral;
      return (<img style={{paddingTop: 5}} src={emoji} width={20} role="presentation" />);
    });
    var hover = {
      type: 'video',
      x: emoji.video.interpolateX ? emoji.video.interpolateX(this.props.interpolateScroll) :
        emoji.video.x,
      y: (emoji.video.interpolateY ? emoji.video.interpolateY(this.props.interpolateScroll) :
        emoji.video.y) + (emoji.video.captionRadius || emoji.video.radius) / 2,
      content: (
        <div>
          <span className='header'>{emoji.video.video.title}</span><br />
          {faces}<br />
        </div>
      ),
    }
    this.props.updateHover(hover);
  },

  render() {

    return (
      <g ref='container' className='videos' />
    );
  }
});

export default Videos;
