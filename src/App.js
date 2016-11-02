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
  host: '#556270',
};
var data = {videosData, annotationsData, showsData};

var width = 1100;
var sectionPositions = [];
var prevSection;
var interpolateSection;

var App = React.createClass({
  getInitialState() {
    return {
      hosts: [],
      obamas: [],
      links: [],
      axes: null,
      interpolateScroll: 0,
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
      var halfway = top + sectionRect.height * 0.25;
      var bottom = top + sectionRect.height;

      return Object.assign({top, halfway, bottom}, section);
    });
  },

  onScroll() {
    var scrollTop = document.body.scrollTop;

    var next;
    var section = _.find(sectionPositions, (section, i) => {
      if (section.top <= scrollTop && scrollTop < section.bottom) {
        next = sectionPositions[i + 1];
        return true;
      }
      return false;
    });

    // if there's no section, then just return
    if (!section) {
      prevSection = interpolateSection = section;
      // if there's no section, just draw the first one
      section = sectionPositions[0];
      var {hosts, obamas} = section.position(width, section.top, section.bottom);
      this.setState({hosts, obamas});
      return;
    };

    // if user is between top and 50%
    if (section.top <= scrollTop && scrollTop < section.halfway) {
      // did they just scroll into it?
      if (!prevSection || (prevSection && prevSection.id !== section.id)) {
        // then calculate the new positions
        var newState = section.position(width, section.top, section.bottom);
        prevSection = section;
        this.setState(newState);
      }
    } else if (section.halfway <= scrollTop && scrollTop < section.bottom) {
      // if instead they are in the bottom half of section
      var newState = {};
      if ((prevSection && prevSection.id !== section.id) ||
        (!interpolateSection || interpolateSection.id !== section.id)) {
        // if we just entered a new section, or if we havne't calculated the interpolation before
        // then calculate section positions as well as the next section positions
        newState = section.position(width, section.top, section.bottom);
        if (next) {
          var nextPos = next.position(width, next.top, next.bottom);
          var nextObamas = _.keyBy(nextPos.obamas, 'key');
          var nextHosts = _.keyBy(nextPos.hosts, 'key');

          _.each(newState.obamas, obama => {
            var nextObama = nextObamas[obama.key];
            obama.interpolateX = d3.interpolate(obama.x, nextObama.x);
            obama.interpolateY = d3.interpolate(obama.y, nextObama.y);
          });
          _.each(newState.hosts, host => {
            var nextHost = nextHosts[host.key];
            host.interpolateX = d3.interpolate(host.x, nextHost.x);
            host.interpolateY = d3.interpolate(host.y, nextHost.y);
          });
          interpolateSection = section;
          prevSection = section;
        }
      }

      // interpolate
      newState.interpolateScroll = (scrollTop - section.halfway) / (section.bottom - section.halfway);
      this.setState(newState);
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
