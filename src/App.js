import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

import Header from './Header';
import Section from './Section';
import Hover from './Hover';
import Visualization from './visualizations/Visualization';

import videosData from './data/videos.json';
import annotationsData from './data/annotation_subtitles.json';
import showsData from './data/shows.json';
import metadata from './data/metadata.json';
import sectionData from './data/sections.js';

var emojis = {
  happy: d3.scaleQuantize().domain([50, 90, 98, 99.7, 99.98, 100])
    .range([
      require('./images/smiling.svg'),
      require('./images/smiling_closed.svg'),
      require('./images/grinning_closed.svg'),
      require('./images/smiling_really.svg'),
      require('./images/tears.svg'),
    ]),
  neutral: require('./images/neutral.svg'),
};
var images = {
  B: require('./images/barack.png'),
  M: require('./images/michelle.png'),
};
var colors = {
  B: '#FF6B6B',
  M: '#4ECDC4',
  host: '#556270',
  happy: '#FFA347',
};
var data = {videosData, annotationsData, showsData};

var width = 1100;
var sectionPositions = [];
var topSection;
var bottomSection;
var interpolateSection;

var App = React.createClass({
  getInitialState() {
    return {
      hosts: [],
      obamas: [],
      videos: [],
      links: [],
      axes: null,
      interpolateScroll: 0,
      scrollDuration: 200,
      section: {},
      selectedVideo: null,
      hover: null,
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
      video.caption = false;
      video.annotations = [];

      video.date = new Date(video.publishedAt);
      video.guest = _.find(metadata, data => data.id === video.videoId).guest[0];
      video.duration = (video.duration.minutes ? video.duration.minutes * 60 : 0) +
        (video.duration.seconds ? video.duration.seconds : 0);
      video.host = _.filter(showsData, show => _.includes(show.id, video.channelId));

      // if there's more than one show, match the title of the video
      if (video.host.length > 1) {
        video.host = _.find(video.host, host => {
          return _.find(host.shows, show => _.includes(video.title, show));
        }).host;
      } else {
        video.host = video.host[0].host;
      }
    });

    _.each(annotationsData, annotation => {
      annotation.filename = _.last(annotation.filename.split('/')).replace('.png', '.jpg');
      var video = _.find(videosData, video => video.videoId === annotation.videoId);
      if (video) {
        video.caption = true;
        video.annotations.push(annotation);

        annotation.video = video;
      }
    });

    // go through all the videos and sort the annotations...
    _.each(videosData, video => {
      video.annotations = _.sortBy(video.annotations, d => d.start);
    });

    data.sectionData = sectionData(data, images, colors, emojis);
  },

  componentDidMount() {
    this.updateSectionPositions();
    this.onScroll();
    window.addEventListener('scroll', _.throttle(this.onScroll, this.state.scrollDuration / 2));
  },

  componentDidUpdate() {
    this.updateSectionPositions();
  },

  updateSectionPositions() {
    var bodyRect = document.body.getBoundingClientRect();
    sectionPositions = _.map(data.sectionData, section => {
      var sectionRect = d3.select('.Section#' + section.id).node().getBoundingClientRect();
      var top = (sectionRect.top - bodyRect.top);
      var halfway = top + (section.half || sectionRect.height * 0.25);
      var bottom = top + sectionRect.height;

      return Object.assign({top, halfway, bottom}, section);
    });
  },

  updateSelectedVideo(selectedVideo, videos) {
    if (selectedVideo) {
      this.setState({selectedVideo});
    } else if (!this.state.selectedVideo && videos) {
      // if there's currently none selected
      var filteredVideos = _.filter(videos, video => video.happy.length);
      selectedVideo = filteredVideos[_.random(filteredVideos.length - 1)];
      this.setState({selectedVideo});
    }
  },

  updateHover(hover) {
    var section = this.state.section;
    var newState = section.position(width, section.top, hover || {});
    newState.hover = hover;

    this.setState(newState);
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
      topSection = bottomSection = interpolateSection = section;
      // if there's no section, just draw the first one
      section = sectionPositions[0];
      var {hosts, obamas} = section.position(width, section.top);
      this.setState({hosts, obamas});
      return;
    };

    var newState = {};
    // if user is between top and 50%
    if (section.top <= scrollTop && scrollTop < section.halfway) {
      // have we come into this top section before?
      if (!topSection || (topSection && topSection.id !== section.id)) {
        // if not, calculate the new positions
        newState = section.position(width, section.top);

        // set things for pulsing
        newState.section = section;
        this.updateSelectedVideo(null, newState.videos);

        topSection = section;
        bottomSection = null;
        this.setState(newState);
      }
    } else if (section.halfway <= scrollTop && scrollTop < section.bottom) {
      // if instead they are in the bottom half of section
      if ((!bottomSection || (bottomSection && bottomSection.id !== section.id)) ||
        (!interpolateSection || interpolateSection.id !== section.id)) {
        // if we just entered this bottom section,
        // or if we havne't calculated the interpolation before
        // then calculate section positions as well as the next section positions
        newState = section.position(width, section.top);
        newState.section = section;
        this.updateSelectedVideo(null, newState.videos);

        if (next) {
          var nextState = next.position(width, next.top);
          var nextObamas = _.keyBy(nextState.obamas, 'key');
          var nextHosts = _.keyBy(nextState.hosts, 'key');
          var nextVideos = _.keyBy(nextState.videos, 'key');

          if (!_.isEmpty(nextObamas)) {
            _.each(newState.obamas, obama => {
              var nextObama = nextObamas[obama.key];
              obama.interpolateX = d3.interpolate(obama.x, nextObama.x);
              obama.interpolateY = d3.interpolate(obama.y, nextObama.y);
            });
          }
          if (!_.isEmpty(nextHosts)) {
            _.each(newState.hosts, host => {
              var nextHost = nextHosts[host.key];
              host.interpolateX = d3.interpolate(host.x, nextHost.x);
              host.interpolateY = d3.interpolate(host.y, nextHost.y);
            });
          }
          if (!_.isEmpty(nextVideos)) {
            newState.videos = _.chain(newState.videos)
              .filter(video => nextVideos[video.key])
              .map(video => {
                var nextVideo = nextVideos[video.key];
                video.interpolateX = d3.interpolate(video.x, nextVideo.x);
                video.interpolateY = d3.interpolate(video.y, nextVideo.y);
                video.interpolateRadius = d3.interpolate(video.radius, nextVideo.radius);
                video.interpolateCaption = d3.interpolate(video.captionRadius, nextVideo.captionRadius);

                var nextHappyByStart = _.keyBy(nextVideo.happy, 'key');
                _.each(video.happy, happy => {
                  var nextHappy = nextHappyByStart[happy.key];
                  happy.interpolateX = d3.interpolate(happy.x, nextHappy.x);
                  happy.interpolateY = d3.interpolate(happy.y, nextHappy.y);
                });
                return video;
              }).value();
          }

          interpolateSection = section;
          bottomSection = section;
          topSection = null;
        }
      }

      // interpolate
      var scrollRange = (section.bottom - section.halfway - 20);
      newState.interpolateScroll = Math.min((scrollTop - section.halfway) / scrollRange, 1);
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
        <Visualization {...props} {...this.state}
          updateSelectedVideo={this.updateSelectedVideo}
          updateHover={this.updateHover} />
        <Header {...props} {...data} />
        {sections}
        <Hover hover={this.state.hover} />
      </div>
    );
  }
});

export default App;
