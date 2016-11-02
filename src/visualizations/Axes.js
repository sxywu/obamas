import React from 'react';
import * as d3 from 'd3';

var Axes = React.createClass({
  componentDidMount() {
    this.xAxis = d3.axisBottom();
    this.yAxis = d3.axisRight();

    this.container = d3.select(this.refs.container);
    this.xContainer = this.container.append('g')
      .classed('x axis', true);
    this.yContainer = this.container.append('g')
      .classed('y axis', true);

    this.renderAxes(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderAxes(nextProps);
    return false;
  },

  renderAxes(props) {
    if (!props.axes) return;

    if (props.axes.x) {
      this.xAxis.scale(props.axes.x.scale);
      this.xContainer
        .attr('transform', props.axes.x.transform)
        .call(this.xAxis);
    }
    if (props.axes.y) {
      this.yAxis.scale(props.axes.y.scale)
        .tickFormat(props.axes.y.format);
      this.yContainer
        .attr('transform', props.axes.y.transform)
        .call(this.yAxis);
    }
  },

  render() {

    return (
      <g ref='container' className='axes' />
    );
  }
});

export default Axes;
