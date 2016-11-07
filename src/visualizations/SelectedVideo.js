import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var xScale = d3.scaleLinear();
var heightScale = d3.scaleLinear();
var wordsHeight = 100;
var top = 450;
var imageScale = 0.25;
var imageWidth = 640;
var imageHeight = 360;
var mousingOver = false;
var formatTime = d3.timeFormat("%B %d, %Y");
var currentVideo;

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
    if (this.props.isMobilePhone) {
      top = 600;
    }

    this.container = d3.select(this.refs.container);
    this.titleContainer = d3.select(this.refs.videoTitle);
    this.annotationsContainer = d3.select(this.refs.annotations)
      .attr('transform', 'translate(' + [0, imageHeight + wordsHeight * 0.6] + ')');
    this.facesContainer = d3.select(this.refs.faces)
      .attr('transform', 'translate(' + [0, imageHeight + wordsHeight * 1.6] + ')');
    this.emojisContainer = d3.select(this.refs.emojis)
      .attr('transform', 'translate(' + [0, imageHeight + wordsHeight * 1.6] + ')');
    this.captionContainer = d3.select(this.refs.videoCaption);
    this.imageContainer = d3.select(this.refs.emojiImage);
    this.underlineContainer = d3.select(this.refs.underline)
      .attr('transform', 'translate(' + [0, imageHeight + wordsHeight * 0.5] + ')');
    var mouseMove = this.props.isMobilePhone ? 'touchmove' : 'mousemove';
    var mouseLeave = this.props.isMobilePhone ? '' : 'mouseleave';
    var click = this.props.isMobilePhone ? 'touchend' : 'click';
    this.mouseContainer = d3.select(this.refs.mouse)
      .attr('transform', 'translate(' + [0, imageHeight + wordsHeight * 0.6] + ')')
      .on(click, this.selectCaption)
      .on(mouseMove, this.mouseoverCaption)
      .on(mouseLeave, this.mouseleaveCaption)
      .attr('opacity', 0);

    this.imageContainer.append('image')
      .classed('source', true);

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
    this.mouseContainerLeft = this.refs.mouse.getBoundingClientRect().left;

    this.titleContainer
      .attr('y', -75)
      .attr('text-anchor', 'middle')
      .attr('x', props.vizWidth / 2)
      .html(() => {
        var tspan = '<tspan x="' + (props.vizWidth / 2) + '"';
        return tspan + ' dy="1.35em" class="header" style="font-size:18px">' +
            props.selectedVideo.video.title + '</tspan>' +
          tspan + ' dy="2em" style="font-size:12px">on ' +
            props.selectedVideo.video.channelTitle +
            ', ' + formatTime(props.selectedVideo.video.date) + '</tspan>';
      });

    // this.mouseContainer.attr('transform', )

    this.calculateAnnotation(props, props.selectedVideo);
    this.calculateFaces(props, props.selectedVideo);

    this.renderAnnotation();
    this.renderFaces(props);

    // default the selected caption to the first smiling image
    if (!currentVideo || (currentVideo && currentVideo.key !== props.selectedVideo.key)) {
      this.selectedCaption = _.find(this.facesData, d =>
        _.some(d.annotation.faces, face => face.happy));
      currentVideo = props.selectedVideo;
    }

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
      .attr('transform', d => 'translate(' + [d.x, 0] + ')');

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
    this.faces = this.facesContainer.selectAll('image').data(this.facesData);
    this.faces.exit().remove();

    this.faces = this.faces.enter().append('image')
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('height', imageHeight * imageScale)
      .merge(this.faces)
      .attr('viewBox', d => '0 0 ' + [_.round(d.x2 - d.x1), imageHeight * imageScale].join(' '))
      .attr('xlink:href', d => 'https://storage.googleapis.com/obama-interview-screenshots/sm-' + d.filename)
      .attr('width', d => d.x2 - d.x1)
      .attr('x', d => d.x1)
      .attr('opacity', d => d.opacity);
  },

  renderCaption(props) {
    this.captionContainer
      .attr('transform', 'translate(' + [props.vizWidth / 2, imageHeight + wordsHeight * 0.2] + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', 14)
      .text(_.unescape(this.hoveredCaption ?
        this.hoveredCaption.words : mousingOver ? '' : this.selectedCaption.words));

    this.underlineContainer
      .attr('x1', this.hoveredCaption ? this.hoveredCaption.x1 :
        mousingOver ? 0 : this.selectedCaption.x1)
      .attr('x2', this.hoveredCaption ? this.hoveredCaption.x2 :
        mousingOver ? 0 : this.selectedCaption.x2)
      .attr('stroke', props.colors[props.selectedVideo.guest])
      .attr('stroke-width', 3);

  },

  renderImage(props) {
    this.imageContainer.attr('transform',
      'translate(' + [props.vizWidth / 2, 0] + ')')
      .style('cursor', 'pointer')
      .on('click', this.clickImage);
    this.imageContainer.select('.source')
      .attr('x', -imageWidth / 2)
      .attr('width', imageWidth)
      .attr('height', imageHeight)
      .attr('xlink:href', 'https://storage.googleapis.com/obama-interview-screenshots/' + this.selectedCaption.annotation.filename);

    var emojis = this.imageContainer.selectAll('.emoji')
      .data(this.selectedCaption.annotation.faces);
    emojis.exit().remove();

    emojis.enter().append('image')
      .classed('emoji', true)
      .merge(emojis)
      .attr('x', d => (d.bounds.head[0].x || 0) - imageWidth / 2)
      .attr('y', d => d.bounds.head[0].y || 0)
      .attr('width', d => (d.bounds.head[1].x || 0) - (d.bounds.head[0].x || 0))
      .attr('height', d => (d.bounds.head[1].x || 0) - (d.bounds.head[0].x || 0))
      .attr('xlink:href', d => d.happy ? props.emojis.happy(d.confidence) : props.emojis.neutral);

  },

  selectCaption(annotation) {
    this.selectedCaption = this.hoveredCaption || this.selectedCaption;
    this.renderCaption(this.props);
    this.renderImage(this.props);
  },

  mouseoverCaption() {
    mousingOver = true;

    var focusX = d3.event.clientX - this.mouseContainerLeft;
    if (this.props.isMobilePhone) {
      focusX = d3.touches(this.refs.mouse)[0][0];
    }
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
    mousingOver = false;

    // go through annotations and recalculate
    _.each(this.annotationsData, d => {
      var x1 = xScale(d.annotation.start);
      var x2 = xScale(d.annotation.end);
      d.x1 = x1;
      d.x = x1;
      d.width = x2 - x1;
    });
    this.renderAnnotation(this.props);

    _.each(this.facesData, d => {
      var x1 = xScale(d.annotation.start);
      var x2 = xScale(d.annotation.end);
      d.x1 = x1;
      d.x2 = x2;
      d.x = (x2 - x1) / 2 + x1;
    });
    this.renderFaces(this.props);

    this.hoveredCaption = null;
    this.renderCaption(this.props);
  },

  clickImage() {
    var videoId = this.selectedCaption.annotation.videoId;
    var start = _.round(this.selectedCaption.annotation.start / 1000) - 1;
    // clicking should take to video at that time
    var url = 'https://youtu.be/' + videoId + '?t=' + start;
    window.open(url, '_new');
  },

  render() {

    return (
      <g ref='container' className='SelectedVideo'>
        <text ref='videoTitle' />
        <g ref='faces' />
        <g ref='annotations' />
        <g ref='emojis' />
        <line ref='underline' />
        <rect ref='mouse' />
        <text ref='videoCaption' />
        <g ref='emojiImage' />
      </g>
    );
  }
});

export default SelectedVideo;
