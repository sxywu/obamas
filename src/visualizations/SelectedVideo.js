import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var xScale = d3.scaleLinear();
var xAxis = d3.axisBottom().scale(xScale)
  .tickFormat(d => {
    var min = d / 1000 / 60;
    if (min % 0.25 === 0) {
      return min + 'min';
    }
    return;
  });
var heightScale = d3.scaleLinear();
var wordsHeight = 100;
var top = 220;

var SelectedVideo = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.annotationsContainer = d3.select(this.refs.annotations);
    this.annotationsContainer.append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(' + [0, wordsHeight] + ')');

    this.renderSelectedVideo(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderSelectedVideo(nextProps);
    return false;
  },

  renderSelectedVideo(props) {
    if (!props.section.updateSelectedVideo) return;
    this.container.attr('transform', 'translate(' + [0, props.section.top + top] + ')')

    this.calculateAnnotation(props, props.selectedVideo);
    this.renderAnnotation();
  },

  calculateAnnotation(props, video) {
    xScale.domain([0, video.duration * 1000])
      .range([props.vizSide, props.vizWidth + props.vizSide]);
    // y scale is frequency of words in the annotation
    var wordsExtent = d3.extent(video.annotations, d => d.words.length);
    heightScale.domain(wordsExtent).range([wordsHeight, 0]);

    this.annotationsData = _.map(video.annotations, d => {
      return {
        x: xScale(d.start),
        y: wordsHeight - heightScale(d.words.length),
        height: heightScale(d.words.length),
        width: 3,
        fill: props.colors[video.guest],
      };
    });
  },

  renderAnnotation() {
    this.annotationsContainer.select('.axis')
      .call(xAxis);

    this.annotations = this.annotationsContainer
      .selectAll('rect').data(this.annotationsData, d => d.filename);

    this.annotations.exit().remove();

    this.annotations.enter().append('rect')
      .merge(this.annotations)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.fill)
      .attr('opacity', 0.5);
  },

  render() {

    return (
      <g ref='container' className='SelectedVideo'>
        <g ref='annotations' />
      </g>
    );
  }
});

export default SelectedVideo;
