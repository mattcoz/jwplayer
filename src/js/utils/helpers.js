define([
    'utils/strings',
    'events/events',
    'underscore'
], function(strings, events, _) {
    /*jshint maxparams:5*/

    // TODO:: the next lines are a holdover until we update our CDN w/ plugins for 7.0
    // This is replaced by compiler
    //var _version = __BUILD_VERSION__;
    var _version = '6.12.0';

    var utils = {};

    /**
     * Returns true if the value of the object is null, undefined or the empty
     * string
     *
     * @param a The variable to inspect
     */
    var _exists = utils.exists = function (item) {
        switch (typeof(item)) {
            case 'string':
                return (item.length > 0);
            case 'object':
                return (item !== null);
            case 'undefined':
                return false;
        }
        return true;
    };

    // Given a string, convert to element and return
    utils.createElement = function(html) {
        var newElement = document.createElement('div');
        newElement.innerHTML = html;
        return newElement.firstChild;
    };

    /** Used for styling dimensions in CSS --
     * return the string unchanged if it's a percentage width; add 'px' otherwise **/
    utils.styleDimension = function (dimension) {
        return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
    };

    /** Gets an absolute file path based on a relative filepath * */
    utils.getAbsolutePath = function (path, base) {
        if (!_exists(base)) {
            base = document.location.href;
        }
        if (!_exists(path)) {
            return;
        }
        if (isAbsolutePath(path)) {
            return path;
        }
        var protocol = base.substring(0, base.indexOf('://') + 3);
        var domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
        var patharray;
        if (path.indexOf('/') === 0) {
            patharray = path.split('/');
        } else {
            var basepath = base.split('?')[0];
            basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
            patharray = basepath.split('/').concat(path.split('/'));
        }
        var result = [];
        for (var i = 0; i < patharray.length; i++) {
            if (!patharray[i] || !_exists(patharray[i]) || patharray[i] === '.') {
                continue;
            } else if (patharray[i] === '..') {
                result.pop();
            } else {
                result.push(patharray[i]);
            }
        }
        return protocol + domain + '/' + result.join('/');
    };

    function isAbsolutePath(path) {
        if (!_exists(path)) {
            return;
        }
        var protocol = path.indexOf('://');
        var queryparams = path.indexOf('?');
        return (protocol > 0 && (queryparams < 0 || (queryparams > protocol)));
    }

    /** Logger */
    var console = window.console = window.console || {
        log: function () {
        }
    };
    utils.log = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof console.log === 'object') {
            console.log(args);
        } else {
            console.log.apply(console, args);
        }
    };

    var _userAgentMatch = _.memoize(function (regex) {
        var agent = navigator.userAgent.toLowerCase();
        return (agent.match(regex) !== null);
    });

    function _browserCheck(regex) {
        return function () {
            return _userAgentMatch(regex);
        };
    }

    utils.isFF = _browserCheck(/firefox/i);
    utils.isChrome = _browserCheck(/chrome/i);
    utils.isIPod = _browserCheck(/iP(hone|od)/i);
    utils.isIPad = _browserCheck(/iPad/i);
    utils.isSafari602 = _browserCheck(/Macintosh.*Mac OS X 10_8.*6\.0\.\d* Safari/i);

    var _isIETrident = utils.isIETrident = function (version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            return _userAgentMatch(new RegExp('trident/.+rv:\\s*' + version, 'i'));
        }
        return _userAgentMatch(/trident/i);
    };


    var _isMSIE = utils.isMSIE = function (version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            return _userAgentMatch(new RegExp('msie\\s*' + version, 'i'));
        }
        return _userAgentMatch(/msie/i);
    };
    utils.isIE = function (version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            if (version >= 11) {
                return _isIETrident(version);
            } else {
                return _isMSIE(version);
            }
        }
        return _isMSIE() || _isIETrident();
    };

    utils.isSafari = function () {
        return (_userAgentMatch(/safari/i) && !_userAgentMatch(/chrome/i) &&
            !_userAgentMatch(/chromium/i) && !_userAgentMatch(/android/i));
    };

    /** Matches iOS devices **/
    var _isIOS = utils.isIOS = function (version) {
        if (version) {
            return _userAgentMatch(new RegExp('iP(hone|ad|od).+\\sOS\\s' + version, 'i'));
        }
        return _userAgentMatch(/iP(hone|ad|od)/i);
    };

    /** Matches Android devices **/
    utils.isAndroidNative = function (version) {
        return _isAndroid(version, true);
    };

    var _isAndroid = utils.isAndroid = function (version, excludeChrome) {
        //Android Browser appears to include a user-agent string for Chrome/18
        if (excludeChrome && _userAgentMatch(/chrome\/[123456789]/i) && !_userAgentMatch(/chrome\/18/)) {
            return false;
        }
        if (version) {
            // make sure whole number version check ends with point '.'
            if (_isInt(version) && !/\./.test(version)) {
                version = '' + version + '.';
            }
            return _userAgentMatch(new RegExp('Android\\s*' + version, 'i'));
        }
        return _userAgentMatch(/Android/i);
    };

    /** Matches iOS and Android devices **/
    utils.isMobile = function () {
        return _isIOS() || _isAndroid();
    };

    utils.isIframe = function () {
        return (window.frameElement && (window.frameElement.nodeName === 'IFRAME'));
    };

    /** Save a setting **/
    utils.saveCookie = function (name, value) {
        document.cookie = 'jwplayer.' + name + '=' + value + '; path=/';
    };

    /** Retrieve saved  player settings **/
    utils.getCookies = function () {
        var jwCookies = {};
        var cookies = document.cookie.split('; ');
        for (var i = 0; i < cookies.length; i++) {
            var split = cookies[i].split('=');
            if (split[0].indexOf('jwplayer.') === 0) {
                jwCookies[split[0].substring(9, split[0].length)] = split[1];
            }
        }
        return jwCookies;
    };

    var _isInt = utils.isInt = function (value) {
        return parseFloat(value) % 1 === 0;
    };

    /** Returns the true type of an object * */
    var _typeOf = utils.typeOf = function (value) {
        if (value === null) {
            return 'null';
        }
        var typeofString = typeof value;
        if (typeofString === 'object') {
            if (_.isArray(value)) {
                return 'array';
            }
        }
        return typeofString;
    };


    /**
     * If the browser has flash capabilities, return the flash version
     */
    utils.flashVersion = function () {
        if (_isAndroid()) {
            return 0;
        }

        var plugins = navigator.plugins,
            flash;

        if (plugins) {
            flash = plugins['Shockwave Flash'];
            if (flash && flash.description) {
                return parseFloat(flash.description.replace(/\D+(\d+)\..*/, '$1'));
            }
        }

        if (typeof window.ActiveXObject !== 'undefined') {
            var status = utils.tryCatch(function() {
                flash = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                if (flash) {
                    return parseFloat(flash.GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.'));
                }
            });

            if (status instanceof utils.Error) {
                return 0;
            }

            return status;
        }
        return 0;
    };


    /** Finds the location of jwplayer.js and returns the path **/
    utils.getScriptPath = _.memoize(function(scriptName) {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src && src.indexOf(scriptName) >= 0) {
                return src.substr(0, src.indexOf(scriptName));
            }
        }
        return '';
    });


    /**
     * Determines if a URL is a YouTube link
     */
    utils.isYouTube = function (path, type) {
        return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
    };

    /**
     * Returns a YouTube ID from a number of YouTube URL formats:
     *
     * Matches the following YouTube URL types:
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4&extra_param=123
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://www.youtube.com/v/YE7VzlLtp-4
     *  - http://www.youtube.com/v/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://youtu.be/YE7VzlLtp-4
     *  - http://youtu.be/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - YE7VzlLtp-4
     **/
    utils.youTubeID = function (path) {
        var status = utils.tryCatch(function() {
            // Left as a dense regular expression for brevity.
            return (/v[=\/]([^?&]*)|youtu\.be\/([^?]*)|^([\w-]*)$/i).exec(path).slice(1).join('').replace('?', '');
        });

        if (status instanceof utils.Error) {
            return '';
        }

        return status;
    };

    /**
     * Determines if a URL is an RTMP link
     */
    utils.isRtmp = function (file, type) {
        return (file.indexOf('rtmp') === 0 || type === 'rtmp');
    };

    /**
     * Iterates over an object and executes a callback function for each property (if it exists)
     * This is a safe way to iterate over objects if another script has modified the object prototype
     */
    utils.foreach = function (aData, fnEach) {
        var key, val;
        for (key in aData) {
            if (_typeOf(aData.hasOwnProperty) === 'function') {
                if (aData.hasOwnProperty(key)) {
                    val = aData[key];
                    fnEach(key, val);
                }
            } else {
                // IE8 has a problem looping through XML nodes
                val = aData[key];
                fnEach(key, val);
            }
        }
    };

    /** Determines if the current page is HTTPS **/
    var _isHTTPS = utils.isHTTPS = function () {
        return (window.location.href.indexOf('https') === 0);
    };

    /** Gets the repository location **/
    utils.repo = function () {
        var repo = 'http://p.jwpcdn.com/' + _version.split(/\W/).splice(0, 2).join('/') + '/';

        utils.tryCatch(function() {
            if (_isHTTPS()) {
                repo = repo.replace('http://', 'https://ssl.');
            }
        });

        return repo;
    };

    // Return true:Boolean if major and minor version of target is less than current version
    utils.versionCheck = function (target) {
        var tParts = ('0' + target).split(/\W/);
        var jParts = _version.split(/\W/);
        var tMajor = parseFloat(tParts[0]);
        var jMajor = parseFloat(jParts[0]);
        if (tMajor > jMajor) {
            return false;
        } else if (tMajor === jMajor) {
            if (parseFloat('0' + tParts[1]) > parseFloat(jParts[1])) {
                return false;
            }
        }
        return true;
    };

    /** Loads an XML file into a DOM object * */
    utils.ajax = function (xmldocpath, completecallback, errorcallback, donotparse) {
        var xmlhttp;
        var isError = false;
        // Hash tags should be removed from the URL since they can't be loaded in IE
        if (xmldocpath.indexOf('#') > 0) {
            xmldocpath = xmldocpath.replace(/#.*$/, '');
        }

        if (_isCrossdomain(xmldocpath) && _exists(window.XDomainRequest)) {
            // IE8 / 9
            xmlhttp = new window.XDomainRequest();
            xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse);
            xmlhttp.ontimeout = xmlhttp.onprogress = function () {
            };
            xmlhttp.timeout = 5000;
        } else if (_exists(window.XMLHttpRequest)) {
            // Firefox, Chrome, Opera, Safari
            xmlhttp = new window.XMLHttpRequest();
            xmlhttp.onreadystatechange =
                _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse);
        } else {
            if (errorcallback) {
                errorcallback('', xmldocpath, xmlhttp);
            }
            return xmlhttp;
        }
        if (xmlhttp.overrideMimeType) {
            xmlhttp.overrideMimeType('text/xml');
        }

        xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath, xmlhttp);
        var status = utils.tryCatch(function() {
            xmlhttp.open('GET', xmldocpath, true);
        });

        if (status instanceof utils.Error) {
            isError = true;
        }

        // make XDomainRequest asynchronous:
        setTimeout(function () {
            if (isError) {
                if (errorcallback) {
                    errorcallback(xmldocpath, xmldocpath, xmlhttp);
                }
                return;
            }
            var status = utils.tryCatch(function() {
                xmlhttp.send();
            });

            if (status instanceof utils.Error) {
                if (errorcallback) {
                    errorcallback(xmldocpath, xmldocpath, xmlhttp);
                }
            }

        }, 0);

        return xmlhttp;
    };

    function _isCrossdomain(path) {
        return (path && path.indexOf('://') >= 0) &&
            (path.split('/')[2] !== window.location.href.split('/')[2]);
    }

    function _ajaxError(errorcallback, xmldocpath, xmlhttp) {
        return function () {
            errorcallback('Error loading file', xmldocpath, xmlhttp);
        };
    }

    function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse) {
        return function () {
            if (xmlhttp.readyState === 4) {
                switch (xmlhttp.status) {
                    case 200:
                        _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse)();
                        break;
                    case 404:
                        errorcallback('File not found', xmldocpath, xmlhttp);
                }

            }
        };
    }

    function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse) {
        return function () {
            // Handle the case where an XML document was returned with an incorrect MIME type.
            var xml, firstChild;
            if (donotparse) {
                completecallback(xmlhttp);
            } else {
                try {
                    // This will throw an error on Windows Mobile 7.5.
                    // We want to trigger the error so that we can move down to the next section
                    xml = xmlhttp.responseXML;
                    if (xml) {
                        firstChild = xml.firstChild;
                        if (xml.lastChild && xml.lastChild.nodeName === 'parsererror') {
                            if (errorcallback) {
                                errorcallback('Invalid XML', xmldocpath, xmlhttp);
                            }
                            return;
                        }
                    }
                } catch (e) {
                }
                if (xml && firstChild) {
                    return completecallback(xmlhttp);
                }
                var parsedXML = _parseXML(xmlhttp.responseText);
                if (parsedXML && parsedXML.firstChild) {
                    xmlhttp = _.extend({}, xmlhttp, {
                        responseXML: parsedXML
                    });
                } else {
                    if (errorcallback) {
                        errorcallback(xmlhttp.responseText ? 'Invalid XML' : xmldocpath, xmldocpath, xmlhttp);
                    }
                    return;
                }
                completecallback(xmlhttp);
            }
        };
    }

    /** Takes an XML string and returns an XML object **/
    var _parseXML = utils.parseXML = function (input) {
        var parsedXML;
        utils.tryCatch(function() {
            // Parse XML in FF/Chrome/Safari/Opera
            if (window.DOMParser) {
                parsedXML = (new window.DOMParser()).parseFromString(input, 'text/xml');
                if (parsedXML.childNodes && parsedXML.childNodes.length &&
                    parsedXML.childNodes[0].firstChild.nodeName === 'parsererror') {
                    return;
                }
            } else {
                // Internet Explorer
                parsedXML = new window.ActiveXObject('Microsoft.XMLDOM');
                parsedXML.async = 'false';
                parsedXML.loadXML(input);
            }
        });

        return parsedXML;
    };


    /**
     * Ensure a number is between two bounds
     */
    utils.between = function (num, min, max) {
        return Math.max(Math.min(num, max), min);
    };

    /**
     * Convert a time-representing string to a number.
     *
     * @param {String}    The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
     * @return {Number}    The number of seconds.
     */
    utils.seconds = function (str) {
        if (_.isNumber(str)) {
            return str;
        }

        str = str.replace(',', '.');
        var arr = str.split(':');
        var sec = 0;
        if (str.slice(-1) === 's') {
            sec = parseFloat(str);
        } else if (str.slice(-1) === 'm') {
            sec = parseFloat(str) * 60;
        } else if (str.slice(-1) === 'h') {
            sec = parseFloat(str) * 3600;
        } else if (arr.length > 1) {
            sec = parseFloat(arr[arr.length - 1]);
            sec += parseFloat(arr[arr.length - 2]) * 60;
            if (arr.length === 3) {
                sec += parseFloat(arr[arr.length - 3]) * 3600;
            }
        } else {
            sec = parseFloat(str);
        }
        return sec;
    };

    /**
     * Basic serialization: string representations of booleans and numbers are
     * returned typed
     *
     * @param {String}
     *            val String value to serialize.
     * @return {Object} The original value in the correct primitive type.
     */
    utils.serialize = function (val) {
        if (val === null || val === undefined) {
            return null;
        } else if (val.toString().toLowerCase() === 'true') {
            return true;
        } else if (val.toString().toLowerCase() === 'false') {
            return false;
        } else if (isNaN(Number(val)) || val.length > 5 || val.length === 0) {
            return val;
        } else {
            return Number(val);
        }
    };

    utils.hasClass = function (element, searchClass) {
        var className = ' ' + searchClass + ' ',
            i = 0,
            l = this.length;
        for (; i < l; i++) {
            if (this[i].nodeType === 1 && (' ' + this[i].className + ' ')
                    .replace(/[\t\r\n\f]/g, ' ').indexOf(className) >= 0) {
                return true;
            }
        }

        return false;
    };

    utils.addClass = function (element, classes) {
        // TODO:: use _.union on the two arrays

        var originalClasses = _.isString(element.className) ? element.className.split(' ') : [];
        var addClasses = _.isArray(classes) ? classes : classes.split(' ');

        _.each(addClasses, function (c) {
            if (!_.contains(originalClasses, c)) {
                originalClasses.push(c);
            }
        });

        element.className = strings.trim(originalClasses.join(' '));
    };

    utils.removeClass = function (element, c) {
        var originalClasses = _.isString(element.className) ? element.className.split(' ') : [];
        var removeClasses = _.isArray(c) ? c : c.split(' ');

        element.className = strings.trim(_.difference(originalClasses, removeClasses).join(' '));
    };

    utils.toggleClass = function (element, c, toggleTo) {
        if(_exists(toggleTo)) {
            if(toggleTo === false){
                utils.removeClass(element, c);
            } else {
                utils.addClass(element, c);
            }
        } else {
            if(utils.hasClass(element, c)){
                utils.removeClass(element, c);
            } else  {
                utils.addClass(element, c);
            }
        }
    };

    utils.emptyElement = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };

    utils.indexOf = _.indexOf;
    utils.noop = function () {
    };

    utils.canCast = function () {
        var cast = window.jwplayer.cast;
        return !!(cast && _.isFunction(cast.available) && cast.available());
    };

    /**
     * Cleans up a css dimension (e.g. '420px') and returns an integer.
     */
    utils.parseDimension = function(dimension) {
        if (typeof dimension === 'string') {
            if (dimension === '') {
                return 0;
            } else if (dimension.lastIndexOf('%') > -1) {
                return dimension;
            }
            return parseInt(dimension.replace('px', ''), 10);
        }
        return dimension;
    };

    /** Format the elapsed / remaining text. **/
    utils.timeFormat = function(sec) {
        if (sec > 0) {
            var hrs = Math.floor(sec / 3600),
                mins = Math.floor((sec - hrs * 3600) / 60),
                secs = Math.floor(sec % 60);

            return (hrs ? hrs + ':' : '') + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        } else {
            return '00:00';
        }
    };

    utils.bounds = function(element) {
        var bounds = {
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            top: 0,
            bottom: 0
        };
        if (!element || !document.body.contains(element)) {
            return bounds;
        }
        if (element.getBoundingClientRect) {
            var rect = element.getBoundingClientRect(element),
                scrollOffsetY = window.pageYOffset,
                scrollOffsetX = window.pageXOffset;
            if (!rect.width && !rect.height && !rect.left && !rect.top) {
                //element is not visible / no layout
                return bounds;
            }
            bounds.left = rect.left + scrollOffsetX;
            bounds.right = rect.right + scrollOffsetX;
            bounds.top = rect.top + scrollOffsetY;
            bounds.bottom = rect.bottom + scrollOffsetY;
            bounds.width = rect.right - rect.left;
            bounds.height = rect.bottom - rect.top;
        } else {
            /*jshint -W084 */ // For the while loop assignment
            bounds.width = element.offsetWidth | 0;
            bounds.height = element.offsetHeight | 0;
            do {
                bounds.left += element.offsetLeft | 0;
                bounds.top += element.offsetTop | 0;
            } while (element = element.offsetParent);
            bounds.right = bounds.left + bounds.width;
            bounds.bottom = bounds.top + bounds.height;
        }
        return bounds;
    };

    utils.empty = function(element) {
        if (!element) {
            return;
        }
        while (element.childElementCount > 0) {
            element.removeChild(element.children[0]);
        }
    };

    var Error = utils.Error = function(name, message) {
        this.name = name;
        this.message = message;
    };

    utils.tryCatch = function(fn, ctx, args) {
        // IE8 requires these not be undefined
        ctx = ctx || this;
        args = args || [];
        
        // if in debug mode, let 'er blow!
        if (window.jwplayer && window.jwplayer.debug) {
            return fn.apply(ctx, args);
        }

        // else be careful
        try {
            return fn.apply(ctx, args);
        }
        catch(e) {
            return new Error(fn.name, e);
        }
    };


    return utils;
});

