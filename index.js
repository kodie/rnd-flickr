#! /usr/bin/env node
'use strict';

process.env.VIPS_WARNING = 0;

var fs = require('fs');
var promise = require('promise');
var request = require('request');
var sharp = require('sharp');

function hash(str) {
  var hash = 0, i, chr, len;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

function setupCache(options) {
  if (options.cache_path) {
    if (!options.cache_expire) { options.cache_expire = 3600000; }

    if (typeof options.cache_path == 'string') {
      if (!fs.existsSync(options.cache_path)) {
        try {
          fs.mkdirSync(options.cache_path);
        } catch(e) { throw e; }
      }

      options.cache_path = {
        images: `${options.cache_path}/images`,
        requests: `${options.cache_path}/requests`
      };
    }

    if (options.cache_path.images) {
      if (!fs.existsSync(options.cache_path.images)) {
        try {
          fs.mkdirSync(options.cache_path.images);
          cleanupCache(options.cache_path.images, options.cache_expire);
        } catch(e) { throw e; }
      }
    }

    if (options.cache_path.requests) {
      if (!fs.existsSync(options.cache_path.requests)) {
        try {
          fs.mkdirSync(options.cache_path.requests);
          cleanupCache(options.cache_path.requests, options.cache_expire);
        } catch(e) { throw e; }
      }
    }
  }

  return options;
}

function cleanupCache(path, expire) {
  try {
    var now = new Date(Date.now());
    var files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var filePath = `${path}/${file}`;
      var fileStat = fs.statSync(filePath);
      var fileMtime = new Date(fileStat.mtime);
      var fileExpire = new Date(+fileMtime + expire);
      if (fileExpire < now) { fs.unlinkSync(filePath); }
    });
  } catch(e) { throw e; }
}

function setupRequestUrl(options) {
  var url = `https://api.flickr.com/services/rest/?method=flickr.photos.search`;
  url += `&format=json`;
  url += `&nojsoncallback=1`;
  url += `&per_page=500`;
  url += `&media=photos`;
  url += `&license=1,2,3,4,5,6,7`;
  url += `&extras=date_taken,date_upload,geo,license,owner_name,tags,url_o,url_l,url_c,url_z,url_n`;
  url += `&sort=interestingness-desc`;
  url += `&api_key=${options.api_key}`;

  if (options.content_type) { url += `&content_type=${options.content_type}`; }

  if (options.tags) {
    if (typeof options.tags === 'object') {
      url += `&tags=${options.tags.join()}`;
    } else { url += `&tags=${options.tags}`; }
  }

  if (options.tag_mode) { url += `&tag_mode=${options.tag_mode}`; }

  return url;
}

function getImageListFromServer(options, url) {
  return new Promise(function(fulfill, reject) {
    request.get(url, function(error, response, body) {
      if (!error) {
        if (body && response.statusCode == 200) {
          body = JSON.parse(body);

          if (body.stat !== 'fail') {
            if (body.photos && body.photos.photo.length) {
              if (options.cache_path && options.cache_path.requests) {
                fs.writeFile(`${options.cache_path.requests}/${hash(url)}.json`, JSON.stringify(body.photos.photo));
              }

              fulfill(body.photos.photo);
            } else { reject('No images found'); }
          } else { reject(body.message); }
        } else { reject(`Invalid response from server - ${response.statusCode}`); }
      } else { reject(error); }
    });
  });
}

function getImageListFromCache(options, url) {
  return new Promise(function(fulfill, reject) {
    var listPath = `${options.cache_path.requests}/${hash(url)}.json`;

    if (fs.existsSync(listPath)) {
      fulfill(JSON.parse(fs.readFileSync(listPath)));
    } else {
      fulfill(getImageListFromServer(options, url));
    }
  });
}

function getImageList(options, url) {
  if (options.cache_path && options.cache_path.requests) {
    return getImageListFromCache(options, url);
  } else {
    return getImageListFromServer(options, url);
  }
}

function chooseImage(options, images) {
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

  return {info:image_data, url:image_url};
}

function getImageFromServer(options, url) {
  return new Promise(function(fulfill, reject) {
    request.get({encoding:'binary', url:url}, function(error, response, image_body) {
      if (!error) {
        var buffer = new Buffer(image_body, 'binary');

        if (options.cache_path && options.cache_path.images) {
          fs.writeFile(`${options.cache_path.images}/${hash(url)}.jpg`, buffer);
        }

        fulfill(buffer);
      } else { reject(error); }
    });
  });
}

function getImageFromCache(options, url) {
  return new Promise(function(fulfill, reject) {
    var imgPath = `${options.cache_path.images}/${hash(url)}.jpg`;

    if (fs.existsSync(imgPath)) {
      fulfill(fs.readFileSync(imgPath));
    } else {
      fulfill(getImageFromServer(options, url));
    }
  });
}

function getImage(options, url) {
  if (options.cache_path && options.cache_path.images) {
    return getImageFromCache(options, url);
  } else {
    return getImageFromServer(options, url);
  }
}

function resizeImage(options, url, image) {
  var img = sharp(image);

  if (options.width || options.height) {
    img.resize(options.width, options.height);
  }

  return img.toBuffer()
    .then(function(imgBuffer){
      if (options.cache_path && options.cache_path.images && (options.width || options.height)) {
        var cacheFile = `${options.cache_path.images}/${hash(url)}-${options.width}-${options.height}.jpg`;
        img.toFile(cacheFile, function(error, info){
          if (error) { throw new Error(e); }
        });
      }

      if (options.file) {
        img.toFile(options.file, function(error, info){
          if (error) { throw new Error(e); }
        });
      }

      return imgBuffer;
    });
}

function getResizedImageFromCache(options, url, image) {
  return new Promise(function(fulfill, reject) {
    var imgPath = `${options.cache_path.images}/${hash(url)}-${options.width}-${options.height}.jpg`;

    if (fs.existsSync(imgPath)) {
      fulfill(fs.readFileSync(imgPath));
    } else {
      fulfill(resizeImage(options, url, image));
    }
  });
}

function getResizedImage(options, url, image) {
  if (options.cache_path && options.cache_path.images) {
    return getResizedImageFromCache(options, url, image);
  } else {
    return resizeImage(options, url, image);
  }
}

module.exports = function(options, cb) {
  if (!cb) { var cb = function(e, i, d) { if (e) { console.log(new Error(e)); } } }

  try {
    if (options.width) { options.width = parseInt(options.width); }
    if (options.height) { options.height = parseInt(options.height); }

    var requestUrl = setupRequestUrl(options);
    options = setupCache(options);

    getImageList(options, requestUrl)
      .then(function(images){
        var image = chooseImage(options, images);
        return getImage(options, image.url)
          .then(function(imgBuffer){
            return {image:imgBuffer, info:image.info, url:image.url};
          });
      })
      .then(function(r){
        return getResizedImage(options, r.url, r.image)
          .then(function(buffer){
            return {buffer:buffer, info:r.info};
          });
      })
      .then(function(r){
        cb(null, r.buffer, r.info);
      })
      .catch(function(e){
        cb(e);
      });
  } catch(e) { cb(e); }
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
