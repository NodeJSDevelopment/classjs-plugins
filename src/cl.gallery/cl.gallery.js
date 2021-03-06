/*!
 * @author      Aleš Kocjančič, Angelo Dini - github.com/finalangel/classjs-plugins
 * @copyright   Distributed under the BSD License.
 * @version     2.0.5
 */

// ensure namespace is defined
var Cl = window.Cl || {};

(function($){
    'use strict';

    // creating class
    Cl.Gallery = new Class({
        /*
            TODO 2.1.0
            - add coverflow feature
         */

        options: {
            'index': null,
            'timeout': 5000,
            'autoplay': false,
            'easing': 'swing',
            'duration': 300,
            'autoHeight': true,
            'autoResize': true,
            'engine': 'fade',
            'cls': {
                'active': 'active',
                'wrapper': '.wrapper',
                'viewport': '.viewport',
                'elements': '.item',
                'next': '.trigger-next a',
                'previous': '.trigger-previous a',
                'navigation': 'nav a'
            },
			'callbacks': {}
        },

        initialize: function (container, options) {
            this.container = $(container);
            this.options = $.extend(true, {}, this.options, options);

            this.wrapper = this.container.find(this.options.cls.wrapper);
            this.viewport = this.container.find(this.options.cls.viewport);
            this.elements = this.container.find(this.options.cls.elements);
            this.navigation = this.container.find(this.options.cls.navigation);

            this.triggers = {
                'next': this.container.find(this.options.cls.next),
                'previous': this.container.find(this.options.cls.previous)
            };

            this.index = null;
            this.bound = this.elements.length;
            this.direction = '';
            this.queue = false;
            this.autoplay = false;
            this.timer = function () {};
            this.callbacks = this.options.callbacks;
            // this is the default implementation of this callback
            if(!this.callbacks.syncNavigation) {
                this.callbacks.syncNavigation = function(gallery) {
                    gallery.navigation.removeClass(gallery.options.cls.active);
                    gallery.navigation.eq(gallery.index).addClass(gallery.options.cls.active);
                };
            }

            // this fixes chromes jQuery(window).load issue
            if(this.elements.length > 0) this._setup();
        },

        _setup: function () {
            var that = this;

            // set the correct height
            if(this.options.autoHeight) this._setHeight();

            // bind event for next triggers
            this.triggers.next.on('click', function(e) {
                e.preventDefault();
                // determine autoplay status
                if(!that.options.autoplay) that.options.timeout = null;
                that.next();
            });

            // bind event for previous triggers
            this.triggers.previous.on('click', function(e) {
                e.preventDefault();
                // determine autoplay status
                if(!that.options.autoplay) that.options.timeout = null;
                that.previous();
            });

            // bind navigation
            this.navigation.on('click', function (e) {
                e.preventDefault();
                // determine autoplay status
                if(!that.options.autoplay) that.options.timeout = null;
                that.move(that.navigation.index($(this)), 'random');
            });

            // attach autoresize if enabled
            if(this.options.autoResize) {
                this._autoResize();
            }

            // show triggers and navigation only if there is more than one item
            if(that.elements.length > 1) {
                // show elements
                this.navigation.parent().show();
                this.triggers.next.parent().show();
                this.triggers.previous.parent().show();
            }

            // init first
            this.move(this.options.index || 0, 'setup');
        },

        next: function () {
            // move
            this.move(this.index + 1, 'next');

            // trigger callback
            this._fire('next');
        },

        previous: function () {
            // move
            this.move(this.index - 1, 'previous');

            // trigger callback
            this._fire('previous');
        },

        move: function (index, direction) {
            // cancel if there are not enough elements
            if (direction !== 'setup' && this.elements.length <= 1) return;

            // helper vars
            var that = this;

            // cancel if queue
            if(this.queue) return false;

            // set new height
            if(this.options.autoHeight) this._setHeight();

            // cancel if index is the same
            if(index === this.index) return false;

            // set new index
            this.index = this._setIndex(index);

            // check if we should autoplay
            if(this.autoplay) this.stop();
            if(this.options.timeout > 0) this.play();

            // set direction
            this.direction = direction || 'next';

            // add accessibility
            this._accessibility();

            // change active navigation using callback
            this._fire('syncNavigation');

            // start the engine
            this.engine[this.options.engine].call(this);

            // trigger event
            this._fire('move');

            // release queue
            setTimeout(function () {
                that.queue = false;
            }, this.options.duration);
        },

        play: function () {
            var that = this;
            // start timer
            this.timer = setInterval(function () {
                that.next();
            }, this.options.timeout);

            // set runner
            this.autoplay = true;

            // trigger event
            this._fire('play');
        },

        stop: function () {
            // we just need to clear the intervall
            clearInterval(this.timer);

            // unset runner
            this.autoplay = false;

            // trigger event
            this._fire('stop');
        },

        update: function () {
            // update gallery scripts
            this.move(this.index);

            // trigger event
            this._fire('update');
        },

        engine: {

            'fade': function () {
                this.queue = true;
                if(this.direction === 'setup') {
                    this.queue = false;
                    this.elements.hide();
                    this.elements.eq(0).show();
                } else {
                    // add fade animation
                    this.elements.fadeOut(this.options.duration, this.options.transition);
                    this.elements.eq(this.index).fadeIn(this.options.duration, this.options.transition);
                }
            },

            'slide': function () {
                // set queue
                this.queue = true;

                // setup
                if(this.direction === 'setup') {
                    this.elements.show().css('left', -9999);
                    // show first slide
                    var el = this.elements.eq(this.index);
                    el.css('left', 0).show();

                    // we don't need a queue here
                    this.queue = false;
                } else {
                    // get current element
                    var width = this.viewport.outerWidth();
                    var visible = this.elements.filter(function () {
                        return parseInt($(this).css('left')) === 0;
                    });

                    // animate old element
                    visible.animate({
                        'left': (this.direction === 'previous') ? width : -width
                    }, this.options.duration, this.options.transition, function () {
                        // ensure element is out of reach
                        $(this).css('left', -9999);
                    });
                    // animate new element
                    this.elements.eq(this.index).css('left', (this.direction === 'previous') ? -width : width).animate({
                        'left': 0
                    }, this.options.duration, this.options.transition);
                }
            }

        },

        _setIndex: function (index) {
            if(index < 0) index = this.bound - 1;
            if(index >= this.bound) index = 0;

            return index;
        },

        _setHeight: function () {
            // autoheight gets the heighest element of the set and adds that value to the .wrapper
            var height = null;
            this.elements.each(function (index, item) {
                var el = $(item);
                if(height < el.outerHeight(true)) {
                    // set greater value
                    height = el.outerHeight(true);
                }
            });
            this.wrapper.css('height', height);
        },

        _autoResize: function () {
            var that = this;
            $(window).on('resize.cl-gallery', function () {
                that._setHeight();
            });
        },

        _accessibility: function () {
            // if only one item is moved at a time
            this.elements
                .attr('aria-hidden', true)
                .attr('aria-selected', false);
            this.elements.eq(this.index)
                .attr('aria-hidden', false)
                .attr('aria-selected', true);
        },

        _fire: function (keyword) {
            // cancel if there is no callback found
            if(this.callbacks[keyword] === undefined) return false;
            // excecute callback
            this.callbacks[keyword](this);
        }

    });

})(jQuery);