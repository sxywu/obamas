import React from 'react';
import * as d3 from 'd3';

var Obamas = React.createClass({
  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.renderObamas(this.props);
  },

  shouldComponentUpdate(nextProps) {
    this.renderObamas(nextProps);
    return false;
  },

  renderObamas(props) {
    this.obamas = this.container.selectAll('.obama')
      .data(props.obamas, d => d.date + d.guest);

    this.obamas.exit().remove();

    var enter = this.obamas.enter().append('g')
      .classed('obama', true)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x - d.radius / 2, y - d.radius / 2] + ')';
      });
    enter.append('image')
      .attr('xlink:href', d => d.image)
      .attr('width', d => d.radius)
      .attr('height', d => d.radius);
    enter.append('line')
      .attr('x1', d => d.radius * 0.15)
      .attr('x2', d => d.radius * 0.85)
      .attr('y1', d => d.radius)
      .attr('y2', d => d.radius)
      .attr('stroke', d => props.colors[d.guest])
      .attr('stroke-width', 3)
      .attr('opacity', 0.5);

    this.obamas = this.obamas.merge(enter);

    this.obamas.transition().duration(props.scrollDuration)
      .attr('transform', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return 'translate(' + [x - d.radius / 2, y - d.radius / 2] + ')';
      });
  },

  render() {

    return (
      <g ref='container' className='obamas' />
    );
  }
});

export default Obamas;
