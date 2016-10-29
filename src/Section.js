import React from 'react';
import _ from 'lodash';

var Section = React.createClass({
  render() {
    var style = {
      margin: '50vh 0',
    };

    return (
      <div className="Section" style={style}>
        {this.props.text}
      </div>
    );
  }
});

export default Section;
