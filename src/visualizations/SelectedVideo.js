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
var top = 250;
var imageScale = 0.25;
var imageWidth = 640 * imageScale;
var imageHeight = 360 * imageScale;

var SelectedVideo = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.titleContainer = d3.select(this.refs.videoTitle);
    this.annotationsContainer = d3.select(this.refs.annotations);
    this.facesContainer = d3.select(this.refs.faces);
    this.emojisContainer = d3.select(this.refs.emojis);
    this.captionContainer = d3.select(this.refs.videoCaption);

    this.selectedCaption = null;

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
    // default the selected caption to the first smiling image
    this.selectedCaption = this.selectedCaption ||
      _.find(props.selectedVideo.annotations, d => _.some(d.faces, face => face.happy));

    this.container.attr('transform', 'translate(' + [0, props.section.top + top] + ')');
    this.titleContainer
      .attr('y', -30)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 700)
      .attr('x', props.vizWidth / 2 + props.vizSide)
      .text(props.selectedVideo.video.title);

    this.calculateAnnotation(props, props.selectedVideo);
    this.calculateFaces(props, props.selectedVideo);

    this.renderAnnotation();
    this.renderFaces(props);

    this.renderCaption(props);
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
        annotation: d,
      };
    });
  },

  renderAnnotation() {
    this.annotationsContainer.select('.axis')
      .call(xAxis);

    this.annotations = this.annotationsContainer
      .selectAll('rect').data(this.annotationsData);

    this.annotations.exit().remove();

    this.annotations = this.annotations.enter().append('rect')
      .merge(this.annotations)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.fill)
      .attr('stroke', '#fff')
      .attr('opacity', d => this.selectedCaption &&
        this.selectedCaption.start === d.annotation.start ? 1 : 0.25)
      .style('cursor', 'pointer')
      .on('click', this.selectCaption)
      .on('mouseover', this.mouseoverCaption)
      .on('mouseleave', this.mouseleaveCaption);
  },

  calculateFaces(props, video) {
    var fontSize = 12;
    this.facesData = _.map(video.annotations, d => {
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
          opacity: emojis.length ? 1 : 0.25,
          key: d.start,
        };
      });
  },

  renderFaces(props) {
    this.emojis = this.emojisContainer.selectAll('g').data(this.facesData);

    this.emojis.exit().remove();

    var enter = this.emojis.enter().append('g');

    this.emojis = this.emojis.merge(enter)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    var emojis = this.emojis.selectAll('.emoji').data(d => d.emojis);
    emojis.exit().remove();
    emojis.enter().append('text')
      .classed('emoji', true)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('y', d => d.y)
      .merge(emojis)
      .attr('font-size', d => d.fontSize)
      .text(d => d.emoji);

    // add images
    this.facesContainer.attr('transform', 'translate(' + [0, wordsHeight] + ')');

    this.faces = this.facesContainer.selectAll('image').data(this.facesData);
    this.faces.exit().remove();

    this.faces = this.faces.enter().append('image')
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('height', imageHeight)
      .merge(this.faces)
      .attr('viewBox', d => '0 0 ' + [_.round(d.x2 - d.x1), imageHeight].join(' '))
      .attr('xlink:href', d => process.env.PUBLIC_URL + '/' + d.filename)
      .attr('width', d => d.x2 - d.x1)
      .attr('x', d => d.x1)
      .attr('opacity', d => d.opacity);
  },

  renderCaption(props) {
    this.captionContainer
      .attr('transform', 'translate(' + [props.vizWidth / 2 + props.vizSide, wordsHeight * 2.25] + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', 12)
      .text(_.unescape(this.hoveredCaption ? this.hoveredCaption.words : this.selectedCaption.words));
  },

  selectCaption(d) {
    this.selectedCaption = d.annotation;
    this.renderCaption(this.props);
    this.renderAnnotation(this.props);
  },

  mouseoverCaption(d) {
    this.hoveredCaption = d.annotation;
    this.renderCaption(this.props);
  },

  mouseleaveCaption() {
    this.hoveredCaption = null;
    this.renderCaption(this.props);
  },

  render() {

    return (
      <g ref='container' className='SelectedVideo'>
        <text ref='videoTitle' />
        <g ref='faces' />
        <g ref='emojis' />
        <g ref='annotations' />
        <text ref='videoCaption' />
      </g>
    );
  }
});

export default SelectedVideo;
