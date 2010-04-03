/*
 * jQuery processEach plugin
 *  - Copyright (c) 2010 Borgar Þorsteinsson 
 *
 * Description: A variation of the code each function for enormous or labour intensive 
 * loops where the thread is yelded every iteration to prevent script timeouts.
 *
 * Licenced under the terms of the MIT/GPL software licenses.
 */
/*global jQuery */
jQuery.processEach = function ( obj, callback, done ) {

  if ( typeof obj === 'object' ) {

    var subject, keys;

    // for normal arrays, or jQuery objects, trust the length
    if ( $.isArray( obj ) ) {
      subject = obj.concat(); // array clone
    }
    else if ( obj instanceof jQuery ) {
      subject = obj.get();
    }
    // copy regular objects into an array
    else {
      keys = [];
      subject = {};
      for ( k in obj ) { 
        keys[ keys.length ] = k;
        subject[ k ] = obj[ k ];
      }
    }

    var i = 0, 
        l = (keys || subject).length;
    
    (function f () {

      var res, timer = new Date();
      while ( (res !== false) && (i < l) && (new Date() - timer < 100) ) {
        
        var key = keys ? keys[ i++ ] : i++;
        var res = callback.call( subject[ key ], key, subject[ key ] );

      }
      if ( res !== false && i < l ) {
        setTimeout( f, 1 );
      }
      else if ( $.isFunction( done ) ) {
        done.call( obj, res );
      }

    })();

  }

};

jQuery.fn.processEach = function ( callback, done ) {
  jQuery.processEach( this, callback, done );
  return this;
};