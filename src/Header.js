import React from 'react';
import _ from 'lodash';

var Header = React.createClass({
  componentWillMount() {
    var emotion = 'happy';
    this.barackPhotos = _.filter(this.props.annotationsData, d =>
      d.guest === 'B' && d.faces.length && d.faces[0][emotion]);
    this.michellePhotos = _.filter(this.props.annotationsData, d =>
      d.guest === 'M' && d.faces.length && d.faces[0][emotion]);
  },

  randomize() {
    this.forceUpdate();
  },

  render() {
    var imageScale = 0.65;
    var imageHeight = 360 * imageScale;
    var imageWidth = 640 * imageScale;

    var images = [[this.barackPhotos, 'B'], [this.michellePhotos, 'M']];
    var faces = _.map(images, (image) => {
      var emotionObj = image[0];
      var guest = image[1];
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

        var emoji = this.props.emojis.happy;
        emoji = emoji[_.random(emoji.length - 1)];

        return (<div key={i} style={style}>{emoji}</div>);
      });

      var style = {
        position: 'relative',
        display: 'inline-block',
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

    var style = {
      textAlign: 'center',
    };

    return (
      <div className="Header" style={style}>
        <div>
          <button onClick={this.randomize}>Random!</button>
        </div>
        {faces}
      </div>
    );
  }
});

export default Header;
