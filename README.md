# Browser Plug-in for Computational Observation at FBforschung.de

This is a browser plug-in to observe human online behavior, for example in the realm of Facebook. It is part of a larger academic research project to investigate algorithmic content curation. Find information on the project itself in German language under <https://fbforschung.de>.

## Installation

The final plug-in is available in various plug-in stores, such as [Google Chrome](https://chrome.google.com/webstore/detail/fbforschungde-browser-plu/faemgdmnkflbiakkkchdgpaphljccpch) and [Mozilla Firefox](https://addons.mozilla.org/firefox/addon/fbforschung/). For developmental installation, follow the steps below.

1. Clone the repository `git clone https://github.com/marhai/fbforschung`
1. Run `npm install`
1. Run `npm run build`

The following tasks can be used when you want to start developing the extension and want to enable live reload:
- `npm run chrome-watch`
- `npm run opera-watch`
- `npm run firefox-watch`

### Chrome and Opera
1. Open Chrome/Opera browser and navigate to chrome://extensions
1. Select "Developer Mode" and then click "Load unpacked extension..."
1. From the file browser, choose to `FBForschung/build/chrome` or (`extension-boilerplate/build/opera`)

### Firefox
1. Open Firefox browser and navigate to about:debugging
1. Click "Load Temporary Add-on" and from the file browser, choose `FBForschung/build/firefox`

## Distribution
Run `npm run dist` to create a zipped, production-ready extension for each browser.

## Contact
Extensive contact information is available under <https://fbforschung.de/impressum>, for quick contact use [@MarHai](https://github.com/MarHai). 
