import React from 'react';

var Hover = React.createClass({
  render() {
    if (!this.props.hover) {
      return (<div />);
    }

    var width = 150;
    var padding = 10;
    var style = {
      position: 'absolute',
      top: this.props.hover.y + padding,
      left: this.props.hover.x - width / 2 - padding,
      width,
      background: '#fff',
      textAlign: 'center',
      fontSize: 10,
      // border: '1px solid #999',
      borderRadius: 3,
      boxShadow: '0 0 5px #999',
      padding,
    };

    return (
      <div style={style}>
        {this.props.hover.content}
      </div>
    );
  }
});

export default Hover;
