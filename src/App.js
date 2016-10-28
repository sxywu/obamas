import React from 'react';
import _ from 'lodash';

import videosData from './data/videos.json';
import subtitlesData from './data/all_subtitles.json';
import annotationsData from './data/annotation_subtitles.json';
import showsData from './data/shows.json';

var emojis = {
  happy: '😆',
  sad: '😭',
  mad: '😡',
  surprised: '😮',
  neutral: '😐',
  hat: '🎩',
  speech: '🎙',
  screenshot: '📸',
  meal: '🍽',
  retail: '👛',
  driving: '🚘',
  vehicle: '🚘',
  mouth: '👄',
  lunch: '🍽',
  newscaster: '🎙',
  hair: '💇',
  building: '🏢',
  car: '🚘',
  floristry: '💐',
  presentation: '📽'
}

var App = React.createClass({
  componentWillMount() {
  },

  randomize() {
    this.forceUpdate();
  },

  render() {
    var imageHeight = 360;
    var emotions = ['happy', 'happy', 'happy', 'happy'];
    var faces = _.map(emotions, (emotion) => {
      var emotionObj = _.filter(annotationsData, d => d.faces.length && d.faces[0][emotion]);
      if (!emotionObj.length) return;
      emotionObj = emotionObj[_.random(emotionObj.length - 1)];

      var emotionFaces = _.map(emotionObj.faces, (face, i) => {
        var fontSize = face.bounds.head[1].x - face.bounds.head[0].x;
        var dy = face.bounds.face[2].y - face.bounds.face[0].y;

        var style = {
          position: 'absolute',
          top: face.hat ? face.bounds.face[0].y - dy - 10 : face.bounds.head[0].y,
          left: face.bounds.head[0].x,
          fontSize,
        };

        return (<div key={i} style={style}>{emojis[face[emotion] ? emotion : 'neutral']}</div>);
      });

      return (
        <span style={{position: 'relative', display: 'inline-block'}}>
          <img src={process.env.PUBLIC_URL + '/' + emotionObj.filename} />
          {emotionFaces}
        </span>
      );
    });

    return (
      <div className="App">
        <div>
          <button onClick={this.randomize}>Random!</button>
        </div>
        {faces}
      </div>
    );
  }
});

export default App;
