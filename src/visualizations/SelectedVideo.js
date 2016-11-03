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
    this.facesContainer = d3.select(this.refs.faces);

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
    this.calculateFaces(props, props.selectedVideo);

    this.renderAnnotation();
    this.renderFaces();
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
      .selectAll('rect').data(this.annotationsData);

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

  calculateFaces(props, video) {
    var fontSize = 12;
    this.facesData = _.chain(video.annotations)
      .filter(d => _.some(d.faces, face => face.happy))
      .map(d => {
        var index = 0;
        return _.map(d.faces, (face) => {
          if (!face.happy) return;

          var i = index;
          index += 1;
          return {
            x: xScale(d.start),
            y: wordsHeight + i * fontSize,
            emoji: props.emojis.happy[0],
            fontSize,
            filename: d.filename,
          };
        });
      }).flatten().filter().value();
  },

  renderFaces() {
    this.faces = this.facesContainer.selectAll('.face').data(this.facesData);

    this.faces.exit().remove();

    var enter = this.faces.enter().append('g')
      .classed('face', true);
    enter.append('text')
      .classed('emoji', true)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em');

    this.faces = this.faces.merge(enter)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    this.faces.select('.emoji')
      .attr('font-size', d => d.fontSize)
      .text(d => d.emoji);
  },

  render() {

    return (
      <g ref='container' className='SelectedVideo'>
        <g ref='annotations' />
        <g ref='faces' />
      </g>
    );
  }
});

export default SelectedVideo;
