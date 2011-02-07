/*
 * jQuery Sokoban
 * http://galdrar.net/sokoban
 *
 * Copyright (c) 2009 Borgar Þorsteinsson
 * Licensed under the terms of the GPL v3 license.
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function($){
  
  var _R    = RegExp;
  var _LINE = /^(\s*)(\#|\#[ \.\@\+\$\*\#]*\#)(\s*)$/;
  var _CLS  = 'soko-';
  var _LC = $( '<div class="' + _CLS + 'room"></div>' );
  
  function _obj () { return {}; }
  
  function reMap ( a ) {
    return {
      dock: "+*.".indexOf( a ) !== -1,
      box:  "$*".indexOf( a ) !== -1,
      man:  "+@".indexOf( a ) !== -1,
      wall: (a === '#')
    }
  }
  
  function Sokoban ( level ) {
    this.level = $( level );
    this.original = this.level.text();
    var ok = this.processLevelData();
    if ( ok ) {
      this.level.bind( 'keydown', function ( e ) {  // keypress doesn't work in safari
        $( this ).data( 'sokoban' ).keyhandler( e );
        return false;
      });
    }
  }
  Sokoban.prototype = {

    processLevelData: function () {
      var pre = [], post = [], level = [], wid = 0;
      var lines = this.level.text().split( '\n' );
      for ( var line, i=0; i<lines.length; i++ ) {
        line = lines[i];
        if ( _LINE.test( line ) ) {
          wid = Math.max( wid, ( _R.$1 + _R.$2 ).length );
          level.push(
            $.map( _R.$1.split( '' ), _obj )
              .concat( $.map( _R.$2.split(''), reMap ) )
          );
        }
        else {
          if ( level.length > 0 ) {
            post = lines.slice( i );
            break;
          }
          pre.push( line );
        }
      }
      this.levelData = level;
      this.height = level.length;
      this.width  = wid;
      this.indentCleanup();
      this.levelContainer = _LC.clone();
      this.moves = 0;
      this.pushes = 0;
      var men = this.count( 'man' ),
          docks = this.count( 'dock' ),
          boxes = this.count( 'box' );
      if ( men !== 1 || docks !== boxes || this.height < 3 || this.width < 3 ) {
        // this is an unplayable level
        return false;
      }
      this.level
        .empty()
        .append( '<div>' + pre.join( '\n' ) + '\n</div>' )
        .append( this.levelContainer.empty() )
        .append( '<div>' + post.join( '\n' ) + '</div>' );
      this.undoBuffer = [];
      this.levelContainer
        .append( this.renderLevel() )
        .attr( 'tabindex', 1 ); // focusable
      this.reTitle();
      return true;
    },
    
    indentCleanup: function () {
      this.scanLevel(function ( t, x, y ) { 
        if ( x === 0 || y === 0 || 
             x === this.width -1 || y === this.height -1 ) {
          this.floodFill( x, y );
        }
      });
    },
    
    floodFill: function ( x, y ) {
      if ( x > -1 && y > -1 && y < this.height && x < this.width ) {
        var c = this.levelData[ y ][ x ] || {};
        if ( !c.wall && !c.box && !c.man && !c.dock && !c.overflow ) {
          c.overflow = true;
          this.levelData[ y ][ x ] = c;
          this.floodFill( x - 1, y ).floodFill( x, y - 1 )
              .floodFill( x + 1, y ).floodFill( x, y + 1 );
        }
      }
      return this;
    },
    
    reTitle: function () {
      var s = this.boxesLeft ? '' : 'Solved: ';
      this.levelContainer.attr( 'title', s + this.moves + ' / ' + this.pushes );
    },
    
    renderLevel: function () {
      var r = '', P = ' ' + _CLS;
      this.boxesLeft = 0;
      for ( var y=0; y<this.height; y++ ) {
        r += '<div class="' + _CLS + 'line">';
        for ( var x=0; x<this.width; x++ ) {
          var t = this.levelData[ y ][ x ] || _obj(),
              s = '&nbsp;',
              c = t.overflow ? _CLS + 'indent' : _CLS + 'floor';
          if ( t ) {
            if ( t.wall ) {
              c = P + 'wall';
              s = '#';
            }
            else if ( t.dock ) {
              c = P + 'dock';
              s = '.';
              if ( t.man ) {
                c += P + 'worker';
                s = '+';
              }
              else if ( t.box ) {
                c += P + 'box';
                s = '*';
              }
            }
            else {
              if ( t.man ) {
                c += P + 'worker';
                s = '@';
              }
              else if ( t.box ) {
                c += P + 'box';
                s = '$';
                this.boxesLeft++;
              }
            }
          }
          r += '<span class="' + $.trim( c ) + '">' + s + '</span>';
        }
        r += '\n</div>';
      }
      return r;
    },
    
    count: function ( attr ) {
      var r = 0;
      this.scanLevel(function ( t ) { r += t[attr] ? 1 : 0; });
      return r;
    },

    manPos: function () {
      var pos;
      this.scanLevel(function ( t, x, y ) {
        if ( t.man ) {
          pos = { x:x, y:y };
          return false;
        }
      });
      if ( !pos ) { throw 'man overboard'; }
      return pos;
    },
 
    scanLevel: function ( callback ) {
      var x, y, t, r;
      for ( y=0; y<this.height; y++ ) {
        for ( x=0; x<this.width; x++ ) {
          t = this.levelData[ y ][ x ] || _obj();
          r = callback.call( this, t, x, y );
          if ( r === false ) {
            return r;
          }
        }
      }
      return true;
    },
    
    move: function ( yofs, xofs ) {
      var m = this.manPos(),
          u = this.levelData[ m.y + yofs ][ m.x + xofs ];
      if ( !u.wall ) {
        if ( u.box ) {
          var uu = this.levelData[ m.y + (yofs * 2) ][ m.x + (xofs * 2) ];
          if ( !uu.wall && !uu.box ) {
            // worker may push
            this.undo_push();
            this.levelData[ m.y ][ m.x ].man = false;
            u.man = true;
            u.box = false;
            uu.box = true;
            this.pushes++;
            this.levelContainer.html( this.renderLevel() );
            this.reTitle();
          }
        }
        else {
          // worker may move
          this.undo_push();
          this.levelData[ m.y ][ m.x ].man = false;
          u.man = true;
          this.moves++;
          this.levelContainer.html( this.renderLevel() );
          this.reTitle();
        }
      }
    },
    
    undo_push: function () {
      this.undoBuffer.push([ this.levelContainer.text(), this.moves, this.pushes ]);
    },
    
    undo_pop: function () {
      var undo = this.undoBuffer.pop();
      if ( undo ) {
        var lines = undo[0].replace( /\n$/, '' ).split( '\n' ),
            level = [];
        for ( var line, i=0; i<lines.length; i++ ) {
          line = lines[i].replace( /\u00A0/g, ' ' );
          if ( _LINE.test( line ) ) {
            level.push(
              $.map( _R.$1.split( '' ), _obj ).concat( $.map( _R.$2.split( '' ), reMap ) )
            );
          }
          else {
            throw 'leaky undo buffer';
          }
        }
        this.moves = undo[1];
        this.pushes = undo[2];
        this.level.removeClass( _CLS + 'solved' );
        this.levelData = level;
        this.indentCleanup();
        this.reTitle();
        this.levelContainer.html( this.renderLevel() );
      }
    },
    
    keyhandler: function ( e ) {
      // stop moving on solve
      if ( this.boxesLeft ) {
        if ( e.keyCode === 38 ) { // up
          this.move( -1, 0 );
        }
        else if ( e.keyCode === 40 ) { // down
          this.move( 1, 0 );
        }
        else if ( e.keyCode === 37 ) { // left
          this.move( 0, -1 );
        }
        else if ( e.keyCode === 39 ) { // right
          this.move( 0, 1 );
        }
        else if ( e.which === 8 ) { // backspace
          this.undo_pop();
        }
        else if ( e.charCode === 122 && ( e.metaKey || e.ctrlKey ) ) { // ctrl-z
          this.undo_pop();
        }
      }
      if ( e.keyCode === 27 ) { // esc
        this.level
          .removeClass( _CLS + 'solved' )
          .text( this.original );
        this.processLevelData();
        var sc = $( window ).scrollTop();
        this.levelContainer[0].focus();
        $( window ).scrollTop( sc );
      }
      if ( !this.boxesLeft ) { // room is solved
        this.level.trigger( 'solved' );
        this.level.addClass( _CLS + 'solved' );
        this.undoBuffer = [];
      }
    }
  }
  
  $.fn.sokoban = function () {
    return this.each(function(){
      var elm = $( this ),
          ctl = elm.data( 'sokoban' );
      if ( !ctl && !elm.children().length ) {
        elm.data( 'sokoban', new Sokoban( this ) );
      }
    });
  };
  
})(jQuery);