var fs = require('fs');
var gm = require('gm');
var _ = require('lodash');
var storage = require('@google-cloud/storage');

var gcs = storage({
  projectId: 'the-obamas',
  keyFilename: 'google_cloud_key.json'
});

var bucket = gcs.bucket('obama-interview-screenshots');

// get annotations
var annotationSubtitles = fs.readFileSync('../src/data/annotation_subtitles.json');
annotationSubtitles = JSON.parse(annotationSubtitles);

function uploadScreenshot(annotation, annotations) {
  var source = annotation.filename;
  var filename = _.last(source.split('/')).replace('.png', '.jpg');
  console.log(filename);

  gm(source)
    .write('finalScreenshots/' + filename, function(err) {
      console.log('write', err);
      // upload file and make it public
      bucket.upload('finalScreenshots/' + filename, {public: true}, function(err) {
        console.log('upload', err);

        gm(source)
          .resize(160, 90)
          .write('finalScreenshots/sm-' + filename, function(err) {
            console.log('write small', err);
            bucket.upload('finalScreenshots/sm-' + filename, {public: true}, function(err) {
              console.log('upload small', err);

              // call the function only if there's still more left
              if (annotations.length) {
                annotation = annotations.shift();
                uploadScreenshot(annotation, annotations);
              }
            });
          });
      });
    });
}

var annotation = annotationSubtitles.shift();
uploadScreenshot(annotation, annotationSubtitles);
