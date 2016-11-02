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

    this.obamas = this.obamas.enter().append('image')
      .classed('obama', true)
      .merge(this.obamas)
      .attr('xlink:href', d => d.image)
      .attr('width', d => d.radius)
      .attr('height', d => d.radius);

    this.obamas.transition().duration(props.scrollDuration)
      .attr('x', d => {
        var x = d.interpolateX ? d.interpolateX(props.interpolateScroll) : d.x;
        return x - d.radius / 2;
      }).attr('y', d => {
        var y = d.interpolateY ? d.interpolateY(props.interpolateScroll) : d.y;
        return y - d.radius / 2;
      });
  },

  render() {

    return (
      <g ref='container' className='obamas' />
    );
  }
});

export default Obamas;
