#! /usr/bin/env node
'use strict';

process.env.VIPS_WARNING = 0;

module.exports = function(options, cb) {
  var request = require('request');
  var sharp = require('sharp');

  var url = `https://api.flickr.com/services/rest/?method=flickr.photos.search`;
  url += `&format=json`;
  url += `&nojsoncallback=1`;
  url += `&per_page=500`;
  url += `&content_type=1`;
  url += `&media=photos`;
  url += `&license=1,2,3,4,5,6,7`;
  url += `&extras=date_taken,date_upload,geo,license,owner_name,tags,url_o,url_l,url_c,url_z,url_n`;
  url += `&sort=interestingness-desc`;
  url += `&api_key=${options.api_key}`;

  if (!cb) { var cb = function(e, i, d) { if (e) { throw e; } } }

  if (options.tags) {
    if (typeof options.tags === 'object') {
      url += `&tags=${options.tags.join()}`;
    } else { url += `&tags=${options.tags}`; }
  }

  if (options.tag_mode) { url += `&tag_mode=${options.tag_mode}`; }

  if (options.width) {
    options.width = parseInt(options.width);
    url += `&width=${options.width}`;
  }

  if (options.height) {
    options.height = parseInt(options.height);
    url += `&height=${options.height}`;
  }

  if (options.width || options.height) { url += `&dimension_search_mode=min`; }

  request.get(url, function(error, response, body) {
    if (!error) {
      if (body && response.statusCode == 200) {
        body = JSON.parse(body);
        if (body.stat !== 'fail') {
          if (body.photos && body.photos.photo.length) {
            var images = body.photos.photo;
            var image_data = images[Math.floor((Math.random() * images.length))];
            var image_url = image_data['url_o'];

            if (options.width || options.height) {
              var sizes = ['n', 'z', 'c', 'l', 'o'];
              for (i = 0; i < sizes.length; i++) {
                var pass = true;
                if (image_data['url_' + sizes[i]]) {
                  if (options.width) {
                    if (options.width > image_data['width_' + sizes[i]]) { pass = false; }
                  }
                  if (options.height) {
                    if (options.height > image_data['height_' + sizes[i]]) { pass = false; }
                  }
                } else { pass = false; }
                if (pass) {
                  image_url = image_data['url_' + sizes[i]];
                  break;
                }
              }
            }

            request.get({encoding:'binary', url:image_url}, function(error, response, image_body) {
              if (!error) {
                var buffer = new Buffer(image_body, 'binary');
                var img = sharp(buffer);

                if (options.width || options.height) { img.resize(options.width, options.height); }

                if (options.file) {
                  img.toFile(options.file, function(error, info) {
                    if (error) { cb(error); process.exit(1); }
                  });
                }

                img.toBuffer()
                  .then(function(image) { cb(null, image, image_data); })
                  .catch(function(error) { cb(error); });
              } else { cb(error); }
            });
          } else { cb('No images found'); }
        } else { cb(body.message); }
      } else { cb('Invalid response from server'); }
    } else { cb(error); }
  });
}

if (require.main === module) {
  var options = {};
  var varPrefix = 'rndFlickr_';

  for (var key in process.env) {
    if (key.indexOf(varPrefix) == 0) {
      options[key.substring(varPrefix.length)] = process.env[key];
    }
  }

  if (process.argv.length > 2) {
    for (var i = 2; i < process.argv.length; i++) {
      var arg = process.argv[i].split('=');
      options[arg[0]] = arg[1];
    }
  }

  module.exports(options, function(error, image, data) {
    if (!error) {
      console.log(data);
    } else { console.log(new Error(error)); }
  });
}
