define([
    'utils/helpers',
    'utils/stretching',
    'playlist/playlist',
    'providers/providers',
    'controller/qoe',
    'utils/underscore',
    'utils/backbone.events',
    'events/events',
    'events/states'
], function(utils, stretchUtils, Playlist, Providers, QOE, _, Events, events, states) {

    // Defaults
    var _defaults = {
        autostart: false,
        controls: true,
        dragging : false,
        // debug: undefined,
        fullscreen: false,
        height: 320,
        mobilecontrols: false,
        mute: false,
        playlist: [],
        repeat: false,
        // skin: undefined,
        stretching: stretchUtils.UNIFORM,
        width: 480,
        volume: 90
    };

    // The model stores a different state than the provider
    function normalizeState(newstate) {
        if (newstate === states.LOADING || newstate === states.STALLED) {
            return states.BUFFERING;
        }
        return newstate;
    }

    // Represents the state of the provider/media element
    var MediaModel = function() {
        this.state = states.IDLE;
    };

    // Represents the state of the player
    var Model = function(config) {
        var _this = this,
            // Video provider
            _providers,
            _provider,
            // Saved settings
            _cookies = utils.getCookies(),
            // Sub-component configurations
            _componentConfigs = {
                controlbar: {},
                display: {}
            },
            _currentProvider = utils.noop;

        this.config = _.extend({}, _defaults, _cookies, config);

        _.extend(this, this.config, {
            state: states.IDLE,
            duration: -1,
            position: 0,
            buffer: 0
        });

        this.mediaController = _.extend({}, Events);
        this.mediaModel = new MediaModel();

        QOE.model(this);

        _providers = new Providers(_this.config.primary);

        function _videoEventHandler(evt) {
            switch (evt.type) {
                case 'volume':
                case 'mute':
                    this.set(evt.type, evt[evt.type]);
                    return;

                case events.JWPLAYER_PLAYER_STATE:
                    var providerState = evt.newstate;
                    var modelState = normalizeState(evt.newstate);

                    evt.oldstate = this.get('state');
                    evt.reason   = providerState;
                    evt.newstate = modelState;
                    evt.type     = modelState;

                    this.mediaModel.set('state', providerState);
                    this.set('state', modelState);
                    break;

                case events.JWPLAYER_MEDIA_BUFFER:
                    this.set('buffer', evt.bufferPercent); // note value change
                    break;

                case events.JWPLAYER_MEDIA_BUFFER_FULL:
                    // media controller
                    this.playVideo();
                    break;

                case events.JWPLAYER_MEDIA_TIME:
                    this.set('position', evt.position);
                    this.set('duration', evt.duration);
                    break;
                case events.JWPLAYER_PROVIDER_CHANGED:
                    this.set('provider', _provider.getName());
                    break;

                case events.JWPLAYER_MEDIA_LEVEL_CHANGED:
                    var quality = evt.currentQuality;
                    var levels = evt.levels;

                    var qualityLabel = levels[quality].label;
                    this.set('qualityLabel', qualityLabel);
                    utils.saveCookie('qualityLabel', qualityLabel);
                    _this.config.qualityLabel = qualityLabel;

                    break;

                case 'visualQuality':
                    var visualQuality = _.extend({}, evt);
                    delete visualQuality.type;
                    this.mediaModel.set('visualQuality', visualQuality);
                    break;
            }

            this.mediaController.trigger(evt.type, evt);
        }

        this.setVideoProvider = function(provider) {

            if (_provider) {
                _provider.removeGlobalListener(_videoEventHandler);
                var container = _provider.getContainer();
                if (container) {
                    _provider.remove();
                    provider.setContainer(container);
                }
            }

            this.set('provider', provider.getName());

            _provider = provider;
            _provider.volume(_this.volume);
            _provider.mute(_this.mute);
            _provider.addGlobalListener(_videoEventHandler.bind(this));
        };

        this.destroy = function() {
            if (_provider) {
                _provider.removeGlobalListener(_videoEventHandler);
                _provider.destroy();
            }
        };

        this.getVideo = function() {
            return _provider;
        };

        this.seekDrag = function(state) {
            _this.set('dragging', state);
            if (state) {
                _provider.pause();
            } else {
                _provider.play();
            }
        };

        this.setFullscreen = function(state) {
            state = !!state;
            if (state !== _this.fullscreen) {
                _this.set('fullscreen', state);
            }
        };

        // TODO: make this a synchronous action; throw error if playlist is empty
        this.setPlaylist = function(p) {

            var playlist = Playlist.filterPlaylist(p, _providers, _this.androidhls);

            if (playlist.length === 0) {
                this.playlist = [];
                this.mediaController.trigger(events.JWPLAYER_ERROR, {
                    message: 'Error loading playlist: No playable sources found'
                });
                return;
            }

            this.set('playlist', playlist);
            this.setItem(0);
        };

        this.setItem = function(index) {
            var newItem;
            var repeat = false;
            var playlist = _this.get('playlist');
            if (index === playlist.length || index < -1) {
                newItem = 0;
                repeat = true;
            } else if (index === -1 || index > playlist.length) {
                newItem = playlist.length - 1;
            } else {
                newItem = index;
            }

            if (newItem === this.get('item') && !repeat) {
                return;
            }

            // Item is actually changing
            this.mediaModel.off();
            this.set('mediaModel', new MediaModel());

            this.set('item', newItem);
            // select provider based on item source (video, youtube...)
            var item = this.get('playlist')[newItem];
            this.set('playlistItem', item);
            var source = item && item.sources && item.sources[0];
            if (source === undefined) {
                // source is undefined when resetting index with empty playlist
                return;
            }

            var Provider = _providers.choose(source);
            if (!Provider) {
                throw new Error('No suitable provider found');
            }

            // If we are changing video providers
            if (!(_currentProvider instanceof Provider)) {
                _currentProvider = new Provider(_this.id, _this.config);

                _this.setVideoProvider(_currentProvider);
            }

            // this allows the Youtube provider to load preview images
            if (_currentProvider.init) {
                _currentProvider.init(item);
            }
        };

        this.setVolume = function(vol) {
            vol = Math.round(vol);
            _this.set('volume', vol);
            utils.saveCookie('volume', vol);
            if (_provider) {
                _provider.volume(vol);
            }
            var muted = (vol === 0);
            if (muted !== _this.get('mute')) {
                _this.setMute(muted);
            }
        };

        this.setMute = function(state) {
            if (!utils.exists(state)) {
                state = !_this.mute;
            }
            _this.set('mute', state);
            utils.saveCookie('mute', state);
            if (_provider) {
                _provider.mute(state);
            }
            if (!state) {
                var volume = Math.max(20, _this.get('volume'));
                this.setVolume(volume);
            }
        };

        this.componentConfig = function(name) {
            if (name === 'logo') {
                return this.config.logo;
            } else {
                return _componentConfigs[name];
            }
        };

        // The model is also the mediaController for now
        this.loadVideo = function() {
            this.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            var idx = this.get('item');
            this.getVideo().load(this.get('playlist')[idx]);
        };

        this.playVideo = function() {
            this.getVideo().play();
        };
    };

    var SimpleModel = _.extend({
        'get' : function (attr) {
            return this[attr];
        },
        'set' : function (attr, val) {
            if (this[attr] === val) {
                return;
            }
            var oldVal = this[attr];
            this[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        }
    }, Events);

    _.extend(Model.prototype, SimpleModel);
    _.extend(MediaModel.prototype, SimpleModel);

    return Model;
});
