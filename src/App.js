import React from 'react';
import _ from 'lodash';

import videosData from './data/videos.json';
import subtitlesData from './data/all_subtitles.json';

var annotationsData = _.mapValues(subtitlesData, (subtitle, videoKey) => {
  return require('./annotations/' + videoKey + '.json');
});

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
    var annotationsSubtitles = [];
    _.each(annotationsData, (annotations, videoId) => {
      var subtitleByStart = _.groupBy(subtitlesData[videoId], 'start');
      _.each(annotations, (annotation, filename) => {
        var time = filename.match(/at-([\d\.]+).png/);
        time = parseFloat(time[1]) * 1000;
        var subtitle = subtitleByStart[time];
        if (!subtitle) return;

        annotationsSubtitles.push(Object.assign({
          start: subtitle[0].start,
          end: subtitle[0].end,
          words: _.map(subtitle, 'words').join(' '),
          videoId,
          filename,
        }, annotation));
      });
    });

    // console.log(annotationsSubtitles);
    console.log(_.chain(annotationsSubtitles).map('faces').flatten().countBy().toPairs().sortBy(1).value());
    // console.log(_.chain(annotationsSubtitles).map('labels').flatten().countBy().toPairs().sortBy(1).value());
    this.setState({data: annotationsSubtitles});
  },

  render() {
    var imageHeight = 360;
    var emotions = ['happy', 'mad', 'sad', 'surprised', 'hat'];
    var faces = _.map(emotions, (emotion) => {
      var emotionObj = _.find(this.state.data, d => d.faces.length && d.faces[0][emotion]);
      if (!emotionObj) return;

      var emotionFaces = _.map(emotionObj.faces, (face, i) => {
        var fontSize = face.bounds.head[1].x - face.bounds.head[0].x;
        var dy = face.bounds.face[2].y - face.bounds.face[0].y;

        var style = {
          position: 'absolute',
          top: face.hat ? face.bounds.face[0].y - dy : face.bounds.head[0].y,
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
        {faces}
      </div>
    );
  }
});

export default App;
