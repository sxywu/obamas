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
var imageScale = 0.25;
var imageWidth = 640 * imageScale;
var imageHeight = 360 * imageScale;

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
    this.renderFaces(props);
  },

  calculateAnnotation(props, video) {
    xScale.domain([0, video.duration * 1000])
      .range([props.vizSide, props.vizWidth + props.vizSide]);
    // y scale is frequency of words in the annotation
    var wordsExtent = d3.extent(video.annotations, d => d.words.length);
    heightScale.domain(wordsExtent).range([wordsHeight, 0]);

    this.annotationsData = _.map(video.annotations, d => {
      var x1 = xScale(d.start);
      var x2 = xScale(d.end);
      return {
        x: x1,
        y: wordsHeight - heightScale(d.words.length),
        height: heightScale(d.words.length),
        width: x2 - x1,
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
      .attr('stroke', '#fff')
      .attr('opacity', 0.5);
  },

  calculateFaces(props, video) {
    var fontSize = 12;
    this.facesData = _.chain(video.annotations)
      .filter(d => _.some(d.faces, face => face.happy))
      .map(d => {
        var emojis = _.chain(d.faces)
          .filter(face => face.happy)
          .map((d, i) => {
            return {emoji: props.emojis.happy[0], y: (i + 1) * fontSize, fontSize};
          }).value();
        var x1 = xScale(d.start);
        var x2 = xScale(d.end);

        return {
          x1,
          x2,
          x: (x2 - x1) / 2 + x1,
          y: wordsHeight,
          emojis,
          fontSize,
          filename: d.filename,
        };
      }).value();
  },

  renderFaces(props) {
    this.faces = this.facesContainer.selectAll('.face').data(this.facesData);

    this.faces.exit().remove();

    var enter = this.faces.enter().append('g')
      .classed('face', true);
    enter.append('image')
      .classed('image', true)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('height', imageHeight)
      .attr('stroke', props.colors.host);

    this.faces = this.faces.merge(enter)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    var emojis = this.faces.selectAll('.emoji').data(d => d.emojis);
    emojis.exit().remove();
    emojis.enter().append('text')
      .classed('emoji', true)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('y', d => d.y)
      .merge(emojis)
      .attr('font-size', d => d.fontSize)
      .text(d => d.emoji);

    this.faces.select('image')
      .attr('viewBox', d => '0 0 ' + [_.round(d.x2 - d.x1), imageHeight].join(' '))
      .attr('xlink:href', d => process.env.PUBLIC_URL + '/' + d.filename)
      .attr('width', d => d.x2 - d.x1)
      .attr('x', d => -(d.x2 - d.x1) / 2)
      .attr('y', d => d.fontSize * 2);
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
