import React from 'react';
import _ from 'lodash';

var Section = React.createClass({
  render() {
    var style = {
      padding: (this.props.paddingMultiple || 0.25) * 100 + 'vh 0',
    };

    return (
      <div className="Section" id={this.props.id} style={style}>
        {this.props.text}
      </div>
    );
  }
});

export default Section;
