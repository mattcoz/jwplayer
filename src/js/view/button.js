define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/underscore',
    'handlebars-loader!templates/button.html'
], function(utils, Events, _, Template) {
    var Button = function(model, name, mapping) { // Mapping is temporary use
        _.extend(this, Events);

        this.el = utils.createElement(Template({'name': name}));

        this.el.addEventListener('click', function(){
            if (mapping){
                mapping();
            }
        }, false);

        this.element = function() { return this.el; };

        model.on('change:state', function(){
            console.log('YAYOI');
        });

        //this.el.addEventListener('click', _clickHandler, false);

        return this.el;
    };

    //function _clickHandler() {
    //    this.trigger(name);
    //}

    return Button;
});


