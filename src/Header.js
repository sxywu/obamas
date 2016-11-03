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

  shouldComponentUpdate() {
    return false;
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
        var width = (face.bounds.head[1].x || 0) - (face.bounds.head[0].x || 0);

        var style = {
          position: 'absolute',
          top: face.bounds.head[0].y || 0,
          left: face.bounds.head[0].x || 0,
          width,
        };
        style.top *= imageScale;
        style.left *= imageScale;
        style.width *= imageScale;

        var emoji = face.happy ? this.props.emojis.happy(face.confidence) :
          this.props.emojis.neutral;

        return (<img key={i} style={style} src={emoji} />);
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
        </span>
      );
    });

    var style = {
      textAlign: 'center',
      height: '100vh',
      border: '1px solid',
    };
    var bStyle = {
      borderBottom: '3px solid ' + this.props.colors.B,
      width: 100,
      margin: 20,
    };
    var mStyle = {
      borderBottom: '3px solid ' + this.props.colors.M,
      width: 100,
      margin: 20,
    };

    return (
      <div className="Header" style={style}>
        <h3>
          <a href='https://twitter.com/sxywu' target='_new'>Shirley Wu</a>
        </h3>
        {faces}
        <br />
        <img src={this.props.images.B} style={bStyle} role="presentation" />
        <img src={this.props.images.M} style={mStyle} role="presentation" />
      </div>
    );
  }
});

export default Header;
