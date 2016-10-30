import React from 'react';
// import _ from 'lodash';

import Hosts from './Hosts';
import Obamas from './Obamas';

var Visualization = React.createClass({
  render() {
    var style = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
    };

    return (
      <svg className="Visualization" style={style}>
        <Obamas {...this.props} />
        <Hosts {...this.props} />
      </svg>
    );
  }
});

export default Visualization;
