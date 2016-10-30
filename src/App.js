import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

import Header from './Header';
import Section from './Section';
import Visualization from './visualizations/Visualization';

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
var colors = {
  B: '#FF6B6B',
  M: '#4ECDC4',
  host: '#C7F464',
};
var data = {videosData, annotationsData, showsData};

var width = 1200;
var sectionPositions = [];
var prevSection;

var App = React.createClass({
  getInitialState() {
    return {
      hosts: [],
    };
  },

  componentWillMount() {
    _.each(showsData, show => {
      show.image = require('./images/' + show.host.split(' ')[1].toLowerCase() + '.png');
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

    data.sectionData = sectionData(data, images);
  },

  componentDidMount() {
    this.updateSectionPositions();
    this.onScroll();
    window.addEventListener('scroll', this.onScroll);
  },

  componentDidUpdate() {
    this.updateSectionPositions();
  },

  updateSectionPositions() {
    var bodyRect = document.body.getBoundingClientRect();
    sectionPositions = _.map(data.sectionData, section => {
      var sectionRect = d3.select('.Section#' + section.id).node().getBoundingClientRect();
      var top = (sectionRect.top - bodyRect.top);
      var bottom = top + sectionRect.height;

      return Object.assign({top, bottom}, section);
    });
  },

  onScroll() {
    var scrollTop = document.body.scrollTop;

    var section = _.find(sectionPositions, section => {
      return section.top <= scrollTop && scrollTop < section.bottom;
    });

    // if this section is different from previous, calculate the new positions
    if (section && section !== prevSection) {
      var top = section.top + window.innerHeight * (section.topMultiple || 0.25);
      var {hosts} = section.position(width, top);
      this.setState({hosts});
    }
  },

  render() {
    var style = {
      position: 'relative',
      width,
      margin: 'auto',
      paddingBottom: '100vh',
    };
    var sections = _.map(data.sectionData, section => {
      return <Section {...section} />;
    });
    var props = {
      emojis,
      images,
      colors,
    };

    return (
      <div className="App" style={style}>
        <Visualization {...props} {...this.state} />
        <Header {...props} {...data} />
        {sections}
      </div>
    );
  }
});

export default App;
