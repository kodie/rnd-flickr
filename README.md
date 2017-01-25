# rnd-flickr

A node module that fetches a random image from [Flickr](https://www.flickr.com)!

## Installation & Usage
### via Module:
#### Installation:
```shell
$ npm i rnd-flickr -S
```
#### Usage:
```javascript
var rndFlickr = require('rnd-flickr');

var options = {
	api_key: 'tklp9NgspoRhwTP7PTyBWoHweNAyyum1',
	width: 270,
	height: 300,
	tags: ['kitten', 'puppy'],
	tag_mode: 'any',
	file: 'random_image.jpg'
};

rndFlickr(options, function(error, image, data) {
	if (!error) {
		console.log(data);
	} else { console.log(new Error(error)); }
});
```

### via Command Line Interface:
#### Installation:
```shell
$ npm i rnd-flickr -g
```
#### Usage:
```shell
$ export rndFlickr_api_key=tklp9NgspoRhwTP7PTyBWoHweNAyyum1
$ export rndFlickr_tag_mode=any
$ rnd-flickr width=270 height=300 tags=kitten,puppy file=~/Desktop/random_image.jpg
```

## Options
* `api_key` - Your Flickr API Key. **(Required)**
* `width` - The width in pixels that you would like the image to be.
* `height` - The height in pixels that you would like the image to be.
* `tags` - The tags that you would like the image to have. Can be an array or a comma seperated string.
* `tag_mode` - Set to `any` or `all` to specify if the image should have any of the tags or all of them.
* `file` - If specified, the image will be saved as the specified file.

## Return
The callback function will return the following parameters in order:
* `error` - Any errors that occured.
* `image` - A buffer with the image.
* `data` - The image data from Flickr.

## License
MIT. See the License file for more info.
