import React from 'react';
import _ from 'lodash';
import Remarkable from 'remarkable';
var md = new Remarkable({linkTarget: '_new', html: true});

var Section = React.createClass({
  render() {
    var style = Object.assign({
      minHeight: '125vh',
      // border: '1px solid',
      position: 'relative',
      pointerEvents: 'none',
    }, this.props.style);
    var textStyle = {
      lineHeight: 2,
      padding: 20,
      background: 'rgba(255, 255, 255, 0.8)',
      pointerEvents: 'auto',
    };

    var rawMarkup = { __html: md.render(this.props.text())};

    return (
      <div className="Section" id={this.props.id} style={style}>
        <div style={textStyle} dangerouslySetInnerHTML={rawMarkup} />
      </div>
    );
  }
});

export default Section;
