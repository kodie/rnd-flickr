# rnd-flickr [![npm version](https://badge.fury.io/js/rnd-flickr.svg)](https://badge.fury.io/js/rnd-flickr)

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
	content_type: 1,
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
$ export rndFlickr_content_type=1
$ rnd-flickr width=270 height=300 tags=kitten,puppy file=~/Desktop/random_image.jpg
```

## Options
* `api_key` - Your Flickr API Key. **(Required)**
* `width` - The width in pixels that you would like the image to be.
* `height` - The height in pixels that you would like the image to be.
* `tags` - The tags that you would like the image to have. Can be an array or a comma seperated string.
* `tag_mode` - Set to `any` or `all` to specify if the image should have any of the tags or all of them.
* `file` - If specified, the image will be saved as the specified file.
* `content_type` - The type of content you would like the image to be:
	* 1 for photos only.
	* 2 for screenshots only.
	* 3 for 'other' only.
	* 4 for photos and screenshots.
	* 5 for screenshots and 'other'.
	* 6 for photos and 'other'.
	* 7 for photos, screenshots, and 'other' (all).
* `cache_path` - If specified, cache for API requests and images will be saved to this path. Can either be a string to set the cache path for both requests and images, or an object to set paths individually. Caching is disabled by default.
* `cache_path.images` - If specified, cache for images will be saved to this path. Can be set to empty string to disable image caching.
* `cache_path.requests` - If specified, cache for API requests will be saved to this path. Can be set to empty string to disable request caching.
* `cache_expire` - The number of milliseconds before a cache file should be deleted. Default is `3600000` (1 hour)

## Return
The callback function will return the following parameters in order:
* `error` - Any errors that occured.
* `image` - A buffer with the image.
* `data` - The image data from Flickr.

## Wallpaper
You could easily use this to set a random wallpaper for you.

### Mac OS X
#### Setup
```shell
# Install rnd-flickr as a global module
$ npm i rnd-flickr -g

# Set an environmental variable with your Flickr API key
$ echo "export rndFlickr_api_key=YOUR_FLICKR_API_KEY_HERE" >> ~/.bash_profile

# Reload your bash profile
$ source ~/.bash_profile
```
#### Usage
```shell
# Create the image
$ rnd-flickr width=1280 height=800 tags=puppy,kitten tag_mode=any file=/Users/Shared/wallpaper.jpg

# Set the wallpaper
$ osascript -e 'tell application "Finder" to set desktop picture to "/Users/Shared/wallpaper.jpg" as POSIX file'
```
#### Cron Job
You could even create a cron job to change your wallpaper automatically for you at a certain time every day:

1. Save the above two commands in a file like `/Users/Shared/wallpaper.sh`
1. Give the file executable permissions with this command: `chmod +x /Users/Shared/wallpaper.sh`
1. Edit your crontab file with this command: `env EDITOR=nano crontab -e`
1. Put this in there: `00 12 * * *	/Users/Shared/wallpaper.sh`

And that's it! Your wallpaper will be replaced with a random one everyday at noon. [Read more about crontab here](http://www.adminschoice.com/crontab-quick-reference).

## License
MIT. See the License file for more info.
