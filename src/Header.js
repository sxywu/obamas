import React from 'react';
import _ from 'lodash';
import Remarkable from 'remarkable';
var md = new Remarkable({linkTarget: '_new', html: true});

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

  getText() {
    return `
<sup>**BY [SHIRLEY WU](https://twitter.com/sxywu)**</sup>

In 2009, President Obama became the [first sitting president to appear on a late-night talk show](http://fortune.com/2016/11/04/obama-comedy-late-night-shows/), and in 2012, First Lady Michelle Obama also made her appearance.  They've been on many more talk shows since, promoting [HealthCare.gov](https://www.healthcare.gov/) and urging America to [get moving](http://www.letsmove.gov/).  And with this plethora of comedic gold arose a great opportunity: to put emoji's on the <span style='color: ${this.props.colors.B}'>**POTUS**</span> and <span style='color: ${this.props.colors.M}'>**FLOTUS**</span>'s face.

You may be wondering, why do something so ridiculously silly?  Simple: it's been a long and exhausting election season, and *we'll all need a pick-me-up come Election Day*.
    `;
  },

  render() {
    var imageScale = this.props.isMobilePhone ? (window.innerWidth - 40) / 640 : 0.65;
    var imageWidth = 640 * imageScale;

    var images = [[this.barackPhotos, 'B'], [this.michellePhotos, 'M']];
    var faces = _.map(images, (image) => {
      var emotionObj = image[0];
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

        return (<img key={i} style={style} src={emoji} role="presentation" />);
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
            <img src={'https://storage.googleapis.com/obama-interview-screenshots/' + emotionObj.filename}
              width={imageWidth} role="presentation" />
            {emotionFaces}
            <div style={footerStyle}>{emotionObj.video.channelTitle}</div>
          </div>
        </span>
      );
    });
    var allEmojis = _.union([this.props.emojis.neutral], this.props.emojis.happy.range());
    if (this.props.isMobilePhone) {
      allEmojis = (<img style={{width: 48}} src={this.props.emojis.happy(100)} role="presentation" />);
    } else {
      allEmojis = _.map(allEmojis, (emoji) => {
        return (<img style={{width: 48}} src={emoji} role="presentation" />);
      });
    }

    var style = {
      textAlign: 'center',
      height: 1200,
      // border: '1px solid',
      paddingTop: 40,
      position: 'relative',
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

    var headerStyle = {
      fontWeight: 400,
      fontSize: 42,
      lineHeight: 1.25,
    };
    var pStyle = {
      // textAlign: 'left',
      width: imageWidth * (this.props.isMobilePhone ? 1 : 2),
      margin: 'auto',
      marginBottom: 40,
      lineHeight: 2,
      pointerEvents: 'auto',
    };

    var rawMarkup = { __html: md.render(this.getText())};
    var mobileWarning;
    if (this.props.isMobilePhone) {
      mobileWarning = `
<sup>Interaction is limited on mobile<br />
Consider **going on desktop**<br />
for full experience</sup>
      `;
      mobileWarning = { __html: md.render(mobileWarning)};
    }

    return (
      <div className="Header" style={style}>
        <h1 style={headerStyle}>Putting {allEmojis}s on the<br />President’s Face
        </h1>
        <div style={pStyle} dangerouslySetInnerHTML={rawMarkup} />

        {faces}
        <br />
        <img src={this.props.images.B} style={bStyle} role="presentation" />
        <img src={this.props.images.M} style={mStyle} role="presentation" />

        <div style={{paddingTop: 20}} dangerouslySetInnerHTML={mobileWarning} />
        <h3>
          Start<br />
          ↓
        </h3>
      </div>
    );
  }
});

export default Header;
