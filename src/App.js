import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

import Header from './Header';

import videosData from './data/videos.json';
import subtitlesData from './data/all_subtitles.json';
import annotationsData from './data/annotation_subtitles.json';
import showsData from './data/shows.json';
import metadata from './data/metadata.json';

var emojis = {
  happy: ['😆', '😀', '😁', '😄', '😃'],
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
};
var images = {
  B: require('./images/barack.png'),
  M: require('./images/michelle.png'),
};

var App = React.createClass({
  componentWillMount() {
    _.each(showsData, show => {
      show.dates = _.map(show.dates, date => {
        date[0] = new Date(date[0]);
        return date;
      });
    });

    _.each(videosData, video => {
      video.date = new Date(video.publishedAt);
      video.guest = _.find(metadata, data => data.id === video.videoId).guest[0];
    });

    _.each(annotationsData, annotation => {
      annotation.guest = _.find(videosData, video => video.videoId === annotation.videoId).guest;
    });
  },

  render() {
    var data = {videosData, annotationsData, showsData};

    return (
      <div className="App">
        <Header {...data} emojis={emojis} images={images} />
      </div>
    );
  }
});

export default App;
