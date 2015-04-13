$(document).ready(function(){
    $('.jwplayer').css('width', '100%');

    $('.jw-icon-tooltip').on('click', function(e){
        $(this).toggleClass('jw-open');
    });

    var stateStyles = 'jw-state-paused jw-state-playing jw-state-idle jw-state-buffering jw-state-complete';
    var sizingStyles = 'player-size window-size jw-aspect-mode';
    var stretchingStyles = 'uniform-stretching fill-stretching exactfit-stretching none-stretching';

    var uniform = function(e){
        activateStyles('player-size', sizingStyles);
        activateStyles('uniform-stretching', stretchingStyles);

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_uniform').on('click', uniform);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', uniform);

    var none = function(e){
        activateStyles('player-size', sizingStyles);
        activateStyles('none-stretching', stretchingStyles);

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_none').on('click', none);
    if(document.attachEvent) document.getElementById('100pct_300px_uniform').attachEvent('onclick', none);

    var fill = function(e){
        activateStyles('player-size', sizingStyles);
        activateStyles('fill-stretching', stretchingStyles);

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_fill').on('click', fill);
    if(document.attachEvent) document.getElementById('100pct_300px_fill').attachEvent('onclick', fill);

    var exactfit = function(e){
        activateStyles('player-size', sizingStyles);
        activateStyles('none-stretching', stretchingStyles);

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#100pct_300px_exactfit').on('click', exactfit);
    if(document.attachEvent) document.getElementById('100pct_300px_exactfit').attachEvent('onclick', exactfit);

    var windowsize = function(e){
        activateStyles('window-size', sizingStyles);
        activateStyles('uniform-stretching', stretchingStyles);

        $('.button-cont-top').addClass('fixed-buttons');
    };

    $('#window-size').on('click', windowsize);
    if(document.attachEvent) document.getElementById('window-size').attachEvent('onclick', windowsize);

    var aspect169 = function(e){
        activateStyles('jw-aspect-mode', sizingStyles);
        activateStyles('uniform-stretching', stretchingStyles);

        $('.button-cont-top').removeClass('fixed-buttons');

        var styleTarget = '.jwplayer.jw-aspect-mode:before';
        document.styleSheets[0].addRule(styleTarget,'padding-top: ' + Math.round(9/16 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule(styleTarget,'content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule(styleTarget + ' { padding-top: ' + Math.round(9/16 * 100) + '%; }', 0);
    };

    $('#aspect-ratio-16-9').on('click', aspect169);
    if(document.attachEvent) document.getElementById('aspect-ratio-16-9').attachEvent('onclick', aspect169);

    var aspect43 = function(e){
        activateStyles('jw-aspect-mode', sizingStyles);
        activateStyles('uniform-stretching', stretchingStyles);

        $('.button-cont-top').removeClass('fixed-buttons');

        var styleTarget = '.jwplayer.jw-aspect-mode:before';
        document.styleSheets[0].addRule(styleTarget,'padding-top: ' + Math.round(3/4 * 100) + '%');
        if(document.attachEvent)document.styleSheets[0].addRule(styleTarget,'content: ' + Math.round(Math.random()*1000));
        if(!document.attachEvent) document.styleSheets[0].insertRule(styleTarget + ' { padding-top: ' + Math.round(3/4 * 100) + '%; }', 0);
    };

    $('#aspect-ratio-4-3').on('click', aspect43);
    if(document.attachEvent) document.getElementById('aspect-ratio-4-3').attachEvent('onclick', aspect43);


    var idlestate = function(e) {
        activateStyles('jw-state-idle', stateStyles);
    };

    $('#idle-state').on('click', idlestate);
    if(document.attachEvent) document.getElementById('idle-state').attachEvent('onclick', idlestate);


    var playstate = function(e){
        activateStyles('jw-state-playing', stateStyles);
    };

    $('#playing-state').on('click', playstate);
    if(document.attachEvent) document.getElementById('playing-state').attachEvent('onclick', playstate);


    var pausestate = function(e){
        activateStyles('jw-state-paused', stateStyles);
    };

    $('#paused-state').on('click', pausestate);
    if(document.attachEvent) document.getElementById('paused-state').attachEvent('onclick', pausestate);


    var bufferingstate = function(e){
        activateStyles('jw-state-buffering', stateStyles);
    };

    $('#buffering-state').on('click', bufferingstate);
    if(document.attachEvent) document.getElementById('buffering-state').attachEvent('onclick', bufferingstate);


    var completestate = function(e){
        activateStyles('jw-state-complete', stateStyles);
    };

    $('#complete-state').on('click', completestate);
    if(document.attachEvent) document.getElementById('complete-state').attachEvent('onclick', completestate);

    var activateStyles = function (addStyle, removeStyles){
        var classesToRemove = removeStyles.replace(addStyle, '');

        $('.jwplayer').removeClass(classesToRemove);
        $('.jwplayer').addClass(addStyle);
    };
});