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
var imageWidth = 640;
var imageHeight = 360;

var distortion = 5;
function fisheye(_, a) {
  var x = xScale(_),
      left = x < a,
      range = d3.extent(xScale.range()),
      min = range[0],
      max = range[1],
      m = left ? a - min : max - a;
  if (m === 0) m = max - min;
  return (left ? -1 : 1) * m * (distortion + 1) / (distortion + (m / Math.abs(x - a))) + a;
}

var SelectedVideo = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.titleContainer = d3.select(this.refs.videoTitle);
    this.annotationsContainer = d3.select(this.refs.annotations);
    this.facesContainer = d3.select(this.refs.faces);
    this.emojisContainer = d3.select(this.refs.emojis);
    this.captionContainer = d3.select(this.refs.videoCaption);
    this.imageContainer = d3.select(this.refs.emojiImage);
    this.mouseContainer = d3.select(this.refs.mouse)
      .on('click', this.selectCaption)
      .on('mousemove', this.mouseoverCaption)
      .on('mouseleave', this.mouseleaveCaption)
      .attr('opacity', 0);

    this.imageContainer.append('image')
      .classed('source1', true);
    this.imageContainer.append('image')
      .classed('source2', true);

    this.renderSelectedVideo(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderSelectedVideo(nextProps);
    return false;
  },

  renderSelectedVideo(props) {
    if (!props.section.updateSelectedVideo) return;

    this.container.attr('transform', 'translate(' + [props.vizSide, props.section.top + top] + ')');

    this.mouseContainer
      .attr('width', props.vizWidth)
      .attr('height', wordsHeight * 2);

    this.titleContainer
      .attr('y', -30)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 700)
      .attr('x', props.vizWidth / 2)
      .text(props.selectedVideo.video.title);

    // this.mouseContainer.attr('transform', )

    this.calculateAnnotation(props, props.selectedVideo);
    this.calculateFaces(props, props.selectedVideo);

    this.renderAnnotation();
    this.renderFaces(props);

    // default the selected caption to the first smiling image
    this.selectedCaption = _.find(this.annotationsData, d =>
      _.some(d.annotation.faces, face => face.happy));

    this.renderCaption(props);
    this.renderImage(props);
  },

  calculateAnnotation(props, video) {
    xScale.domain([video.annotations[0].start, _.last(video.annotations).end])
      .range([0, props.vizWidth]);

    // y scale is frequency of words in the annotation
    var wordsExtent = d3.extent(video.annotations, d => d.words.length);
    heightScale.domain(wordsExtent).range([0, wordsHeight]);

    this.annotationsData = _.map(video.annotations, d => {
      var x1 = xScale(d.start);
      var x2 = xScale(d.end);
      var happy = _.some(d.faces, face => face.happy);

      return {
        x: x1,
        y: wordsHeight - heightScale(d.words.length),
        height: heightScale(d.words.length),
        width: x2 - x1,
        fill: props.colors[video.guest],
        opacity: happy ? 0.75 : 0.25,
        annotation: d,
      };
    });
  },

  renderAnnotation() {
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
      .attr('opacity',d => d.opacity);
  },

  calculateFaces(props, video) {
    var width = 14;
    this.facesData = _.map(video.annotations, d => {
        var emojis = _.chain(d.faces)
          .filter(face => face.happy)
          .map((d, i) => {
            return {emoji: props.emojis.happy(d.confidence), y: (i - 0.5) * width, width};
          }).value();
        var x1 = xScale(d.start);
        var x2 = xScale(d.end);

        return {
          x1,
          x2,
          px1: x1,
          px2: x2,
          x: (x2 - x1) / 2 + x1,
          y: wordsHeight,
          emojis,
          width,
          filename: d.filename,
          opacity: emojis.length ? 1 : 0.25,
          key: d.start,
          words: d.words,
          annotation: d,
        };
      });
  },

  renderFaces(props) {
    var emojisData = _.filter(this.facesData, d => d.emojis.length);
    this.emojis = this.emojisContainer.selectAll('g').data(emojisData);

    this.emojis.exit().remove();

    var enter = this.emojis.enter().append('g');

    this.emojis = this.emojis.merge(enter)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    var emojis = this.emojis.selectAll('.emoji').data(d => d.emojis);
    emojis.exit().remove();
    emojis.enter().append('image')
      .classed('emoji', true)
      .merge(emojis)
      .attr('x', d => -d.width / 2)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.width)
      .attr('xlink:href', d => d.emoji);

    // add images
    this.facesContainer.attr('transform', 'translate(' + [0, wordsHeight] + ')');

    this.faces = this.facesContainer.selectAll('image').data(this.facesData);
    this.faces.exit().remove();

    this.faces = this.faces.enter().append('image')
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('height', imageHeight * imageScale)
      .merge(this.faces)
      .attr('viewBox', d => '0 0 ' + [_.round(d.x2 - d.x1), imageHeight * imageScale].join(' '))
      .attr('xlink:href', d => process.env.PUBLIC_URL + '/' + d.filename)
      .attr('width', d => d.x2 - d.x1)
      .attr('x', d => d.x1)
      .attr('opacity', d => d.opacity);
  },

  renderCaption(props) {
    this.captionContainer
      .attr('transform', 'translate(' + [props.vizWidth / 2, wordsHeight * 2.25] + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .text(_.unescape(this.hoveredCaption ?
        this.hoveredCaption.words : this.selectedCaption.words));
  },

  renderImage(props) {
    var sourceScale = (props.vizWidth / 2) / imageWidth;

    this.imageContainer.attr('transform','translate(' + [0, wordsHeight * 2.5] + ')');
    this.imageContainer.select('.source1')
      .attr('width', imageWidth * sourceScale)
      .attr('height', imageHeight * sourceScale)
      .attr('xlink:href', process.env.PUBLIC_URL + '/' + this.selectedCaption.annotation.filename);
    this.imageContainer.select('.source2')
      .attr('x', imageWidth * sourceScale)
      .attr('width', imageWidth * sourceScale)
      .attr('height', imageHeight * sourceScale)
      .attr('xlink:href', process.env.PUBLIC_URL + '/' + this.selectedCaption.annotation.filename);

    var emojis = this.imageContainer.selectAll('.emoji')
      .data(this.selectedCaption.annotation.faces);
    emojis.exit().remove();

    emojis.enter().append('image')
      .classed('emoji', true)
      .merge(emojis)
      .attr('x', d => ((d.bounds.head[0].x || 0) + imageWidth) * sourceScale)
      .attr('y', d => (d.bounds.head[0].y || 0) * sourceScale)
      .attr('width', d => ((d.bounds.head[1].x || 0) - (d.bounds.head[0].x || 0)) * sourceScale)
      .attr('height', d => ((d.bounds.head[1].x || 0) - (d.bounds.head[0].x || 0)) * sourceScale)
      .attr('xlink:href', d => d.happy ? props.emojis.happy(d.confidence) : props.emojis.neutral);

  },

  selectCaption(annotation) {
    this.selectedCaption = this.hoveredCaption || this.selectedCaption;
    this.renderCaption(this.props);
    this.renderImage(this.props);
  },

  mouseoverCaption() {
    var focusX = d3.event.offsetX - this.props.vizSide;
    var annotation = _.find(this.facesData, d => d.px1 <= focusX && focusX < d.px2);

    // update cursor
    this.mouseContainer.style('cursor', annotation ? 'pointer' : 'default');

    // go through annotations and recalculate
    _.each(this.annotationsData, d => {
      var x1 = fisheye(d.annotation.start, focusX);
      var x2 = fisheye(d.annotation.end, focusX);
      d.x1 = x1;
      d.x = x1;
      d.width = x2 - x1;
    });
    this.renderAnnotation(this.props);

    _.each(this.facesData, d => {
      var x1 = fisheye(d.annotation.start, focusX);
      var x2 = fisheye(d.annotation.end, focusX);
      d.x1 = x1;
      d.x2 = x2;
      d.x = (x2 - x1) / 2 + x1;
    });
    this.renderFaces(this.props);

    // and finally, the caption
    this.hoveredCaption = annotation;
    this.renderCaption(this.props);
  },

  mouseleaveCaption() {
    this.calculateAnnotation(this.props, this.props.selectedVideo);
    this.calculateFaces(this.props, this.props.selectedVideo);

    this.renderAnnotation();
    this.renderFaces(this.props);

    this.hoveredCaption = null;
    this.renderCaption(this.props);
  },

  render() {

    return (
      <g ref='container' className='SelectedVideo'>
        <text ref='videoTitle' />
        <g ref='faces' />
        <g ref='annotations' />
        <g ref='emojis' />
        <rect ref='mouse' />
        <text ref='videoCaption' />
        <g ref='emojiImage' />
      </g>
    );
  }
});

export default SelectedVideo;
