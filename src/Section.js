import React from 'react';
import _ from 'lodash';

var Section = React.createClass({
  render() {
    var style = {
      minHeight: '125vh',
      border: '1px solid',
    };

    return (
      <div className="Section" id={this.props.id} style={style}>
        {this.props.text}
      </div>
    );
  }
});

export default Section;
