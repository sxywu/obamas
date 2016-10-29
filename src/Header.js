import React from 'react';
import _ from 'lodash';

var Header = React.createClass({
  randomize() {
    this.forceUpdate();
  },

  render() {
    var imageScale = 0.65;
    var imageHeight = 360 * imageScale;
    var imageWidth = 640 * imageScale;
    var images = [['happy', 'B'], ['happy', 'M']];
    var faces = _.map(images, (image) => {
      var emotion = image[0];
      var guest = image[1];
      var emotionObj = _.filter(this.props.annotationsData, d =>
        d.guest === guest && d.faces.length && d.faces[0][emotion]);
      if (!emotionObj.length) return;
      emotionObj = emotionObj[_.random(emotionObj.length - 1)];

      var emotionFaces = _.map(emotionObj.faces, (face, i) => {
        var fontSize = face.bounds.head[1].x - face.bounds.head[0].x;
        var dy = face.bounds.face[2].y - face.bounds.face[0].y;

        var style = {
          position: 'absolute',
          top: face.bounds.head[0].y,
          left: face.bounds.head[0].x,
          fontSize,
        };
        style.top *= imageScale;
        style.left *= imageScale;
        style.fontSize *= imageScale;

        // if  emoji is an array, randomly pick one from it
        var emoji = this.props.emojis[face[emotion] ? emotion : 'neutral'];
        emoji = _.isArray(emoji) ? emoji[_.random(emoji.length - 1)] : emoji;

        return (<div key={i} style={style}>{emoji}</div>);
      });

      var style = {
        position: 'relative',
        display: 'inline-block',
        textAlign: 'center',
      };
      return (
        <span style={style}>
          <div>
            <img src={process.env.PUBLIC_URL + '/' + emotionObj.filename} width={imageWidth} />
            {emotionFaces}
          </div>
          <img src={this.props.images[guest]} width={100} />
        </span>
      );
    });

    return (
      <div className="Header">
        <div>
          <button onClick={this.randomize}>Random!</button>
        </div>
        {faces}
      </div>
    );
  }
});

export default Header;
