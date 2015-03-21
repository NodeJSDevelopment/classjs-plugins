/*!
 * @author      Angelo Dini - github.com/finalangel/classjs-plugins
 * @copyright   Distributed under the BSD License.
 * @version     1.1.7
 */

// ensure namespace is defined
var Cl = window.Cl || {};

(function($){
    'use strict';

    // creating class
    Cl.Mobilemenu = new Class({

        options: {
            'easing': 'swing',
            'duration': 300,
            'bound': 539,
            'ratio': 70 / 100,
            'fixedRatio': null,
            'offset': {
                'left': 0,
                'top': 0
            },
            'cls': {
                'menu': '.mainnav',
                'inner': '> ul',
                'knob': '.mainnav-knob'
            },
            'heightCalc': true,
            'overlay': '<div class="mainnav-overlay"></div>',
            'overlayContainer': 'body'
        },

        initialize: function (options) {
            this.options = $.extend(true, {}, this.options, options);

            this.body = $('body');

            this.menu = $(this.options.cls.menu);
            this.knob = $(this.options.cls.knob);
            this.overlay = $(this.options.overlay);

            this.initialized = false;
            this.visible = false;
            this.timer = function () {};
            this.width = null;
            this.height = this.menu.outerHeight(true);
            this.callbacks = {};

            this._setup();
        },

        _setup: function () {
            var that = this;

            // setup initial states
            this.menu.attr('aria-expanded', false);

            // attach trigger to mainmenu
            this.knob.on('click', function (e) {
                e.preventDefault();
                that.toggle();
            });

            // attach event to overlay
            this.overlay.on('click', function () { that.hide(); });

            // show navigation if focus
            this.menu.on('focusin', function () { that.show(); });

            // attach resize event for hiding mobile menu
            $(window).on('resize.menu', function () {
                if(that.visible && $(window).width() >= that.options.bound) that.hide(0);
                if (that.visible) that.resize();
                that.menu.height('min-height', that._setHeight());
            });
        },

        toggle: function () {
            if(this.visible) { this.hide(); } else { this.show(); }

            // trigger callback
            this._fire('toggle');
        },

        show: function (speed) {
            // if not initialized, inject overlay
            if(!this.initialized) $(this.options.overlayContainer).append(this.overlay);
            this.initialized = true;

            // validate if toolbar should be shown
            if(!this._validate()) return false;

            // switch aria
            this.menu.attr('aria-expanded', true);

            // calculate width, use original if once calculated
            if(!this.visible) this.width = ($(window).width() * this.options.ratio);
            // if fixedRatio is defined overwrite ratio
            if(this.options.fixedRatio) this.width = this.options.fixedRatio;

            // fix html size and animate
            this.body.animate({
                'margin-left': this.width
            }, (speed !== undefined) ? speed : this.options.duration, this.options.easing);
            // set correct menu css
            this.menu.css({
                'width': this.width,
                'min-height': this._setHeight(), // +5 = address bar fix
                'top': this.options.offset.top,
                'left': -this.width + this.options.offset.left
            });
            // show overlay
            this.overlay.show();

            // set new state
            this.visible = true;

            // trigger callback
            this._fire('show');
        },

        hide: function (speed) {
            var that = this;

            // switch aria
            this.menu.attr('aria-expanded', false);

            // animate back and remove attributes
            this.body.animate({
                'margin-left': 0
            }, (speed !== undefined) ? speed : this.options.duration, this.options.easing, function () {
                that.menu.removeAttr('style');
                that.body.removeAttr('style');
            });
            // hide overlay
            this.overlay.hide();

            // set new state
            this.visible = false;

            // trigger callback
            this._fire('hide');
        },

        resize: function() {
            // depending on current window width
            this.width = ($(window).width() * this.options.ratio);
            // if fixedRatio is defined overwrite ratio
            if(this.options.fixedRatio) this.width = this.options.fixedRatio;
            
            this.body.css({
                'margin-left': this.width
            });
            this.menu.css({
                'width': this.width,
                'left': -this.width + this.options.offset.left
            });
        },

        _validate: function () {
            return ($(window).width() < this.options.bound) ? true : false;
        },

        _setHeight: function () {
            if(!this.options.heightCalc) return 0;

            var height = ($(window).height() > this.body.height()) ? $(window).height() : this.body.height();

            if(this.height > height) height = this.height;

            return height + 1;
        },

        _fire: function (keyword) {
            // cancel if there is no callback found
            if(this.callbacks[keyword] === undefined) return false;
            // excecute callback
            this.callbacks[keyword](this);
        }

    });

})(jQuery);
