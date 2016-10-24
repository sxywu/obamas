var fs = require('fs');
var _ = require('lodash');

var vision = require('@google-cloud/vision')({
  projectId: 'the-obamas',
  keyFilename: 'google_cloud_key.json'
});

var allNames = fs.readdirSync('screenshots');
allNames = _.filter(allNames, function(videoName) {return videoName !== '.DS_Store'});

var allAnnotations;

function getAnnotations(image, images, videoName, videoNames) {
  if (!image) {
    // if no more images, then save the file and go to next video
    fs.writeFile('annotations/' + videoName + '.json', JSON.stringify(allAnnotations));

    videoName = videoNames.shift();
    getImages(videoName, videoNames);
    return;
  }

  var image = 'screenshots/' + videoName + '/' + image;
  var types = ['faces', 'landmarks', 'labels', 'text'];
  vision.detect(image, types, function(err, detections) {
    if (err) {
      console.log('err', err);
    }
    console.log('annotated ', image);

    if (!_.isEmpty(detections)) {
      allAnnotations[image] = detections;
    }
    image = images.shift();
    getAnnotations(image, images, videoName, videoNames);
  });
}

function getImages(videoName, videoNames) {
  if (!videoName) return;
  console.log(videoName);

  var allImages = fs.readdirSync('screenshots/' + videoName);
  allImages = _.filter(allImages, function(image) {return image !== '.DS_Store'});

  allAnnotations = {};
  var image = allImages.shift();
  getAnnotations(image, allImages, videoName, videoNames);
}

var videoName = allNames.shift();
getImages(videoName, allNames);
