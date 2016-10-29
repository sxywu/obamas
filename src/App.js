import React from 'react';
import _ from 'lodash';

import Header from './Header';
import Section from './Section';

import videosData from './data/videos.json';
import annotationsData from './data/annotation_subtitles.json';
import showsData from './data/shows.json';
import metadata from './data/metadata.json';
import sectionData from './data/sections.js';

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
  presentation: '📽',
  'White House': '🏛',
  'U.S. Capitol': '🏛',
};
var images = {
  B: require('./images/barack.png'),
  M: require('./images/michelle.png'),
};
var data = {videosData, annotationsData, showsData};

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
      annotation.video = _.find(videosData, video => video.videoId === annotation.videoId);
    });

    data.sectionData = sectionData(data);
  },

  render() {
    var width = 1200;
    var style = {
      position: 'relative',
      width,
      margin: 'auto',
    };
    var sections = _.map(sectionData, section => {
      return <Section {...section} />;
    });

    return (
      <div className="App" style={style}>
        <Header {...data} emojis={emojis} images={images} />
        {sections}
      </div>
    );
  }
});

export default App;
