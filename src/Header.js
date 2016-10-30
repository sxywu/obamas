import React from 'react';
import _ from 'lodash';

var Header = React.createClass({
  componentWillMount() {
    var emotion = 'happy';
    this.barackPhotos = _.filter(this.props.annotationsData, d =>
      d.video.guest === 'B' && d.faces.length && d.faces[0][emotion]);
    this.michellePhotos = _.filter(this.props.annotationsData, d =>
      d.video.guest === 'M' && d.faces.length && d.faces[0][emotion]);
  },

  randomize() {
    this.forceUpdate();
  },

  render() {
    var imageScale = 0.65;
    var imageWidth = 640 * imageScale;

    var images = [[this.barackPhotos, 'B'], [this.michellePhotos, 'M']];
    var faces = _.map(images, (image) => {
      var emotionObj = image[0];
      var guest = image[1];
      if (!emotionObj.length) return;
      emotionObj = emotionObj[_.random(emotionObj.length - 1)];

      var emotionFaces = _.map(emotionObj.faces, (face, i) => {
        var fontSize = face.bounds.head[1].x - face.bounds.head[0].x;

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
        width: imageWidth,
      };
      var footerStyle = {
        fontSize: 10,
        textAlign: 'left',
        fontStyle: 'italic',
        paddingBottom: 10,
      };

      return (
        <span style={style}>
          <div>
            <img src={process.env.PUBLIC_URL + '/' + emotionObj.filename}
              width={imageWidth} role="presentation" />
            {emotionFaces}
            <div style={footerStyle}>{emotionObj.video.channelTitle}</div>
          </div>
          <img src={this.props.images[guest]} width={100} role="presentation" />
        </span>
      );
    });

    var style = {
      textAlign: 'center',
      paddingBottom: '25vh',
    };
    var buttonStyle = {
      padding: '10px 20px',
      border: '3px solid #666',
      color: '#666',
      cursor: 'pointer',
      display: 'inline-block',
      position: 'relative',
      top: -90,
    };

    return (
      <div className="Header" style={style}>
        <h3>
          <a href='https://twitter.com/sxywu' target='_new'>Shirley Wu</a>
        </h3>
        {faces}
        <br />
        <h3 style={buttonStyle} onClick={this.randomize}>
          Random
        </h3>
      </div>
    );
  }
});

export default Header;
