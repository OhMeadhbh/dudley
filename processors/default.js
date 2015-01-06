( function () {

  var fs         = require( 'fs' );
  var pathmod    = require( 'path' );
  var handlebars = require( 'handlebars' );

  module.exports = function ( dudley, callback ) {
    if( ! dudley.ignore_template ) {
      _copy_themedir.call( dudley );
    } else {
      _copy_sourcedir.call( dudley );
    }

    function _copy_themedir( ) {
      process_dir.call( dudley, dudley.themedir, function( err ) {
        if( err ) { return callback( err ); }
        _copy_sourcedir.call( this );
      }.bind( this ) );
    }

    function _copy_sourcedir() {
      process_dir.call( dudley, dudley.source, function( err ) {
        if( err ) { return callback( err ); }
        callback( null );
      }.bind( this ) );
    }
  }

  function process_dir( source, callback ) {
    fs.readdir( source, function( err, files ) {
      if( err ) { return callback( err ); }
      var counter = files.length._$counter( _finished_processing.bind( this ) );
      files._$each( function( e ) {
        if( this.ignore._$any( function( file ) { return e === file; } ) ) {
          counter();
        } else {
          fs.stat( [ source, e ].join( pathmod.sep ), function( err, stat ) {
            if( err ) { return callback( err ); }
            if( stat.isDirectory() ) {
              _as_directory.call( this, source, e, counter );
            } else {
              _as_file.call( this, e, counter );
            }
          }.bind( this ) );
        }
      }.bind( this ) );

      function _finished_processing() {
        callback.call( this );
      }
    }.bind( this ) );
  }

  function _as_directory( path, file, callback ) {
    var new_context = {
      source: [ path, file ].join( pathmod.sep ),
      destination: [ this.destination, file ].join( pathmod.sep ),
      ignore_template: true
    };

    if( '.' == this.base ) {
      new_context.base = '..'
    } else {
      new_context.base = [ this.base, '..' ].join( pathmod.sep );
    }

    new_context.__proto__ = this;

    new_context.process( callback );
  }

  function _as_file( path, callback ) {
    fs.readFile( [ this.source, path ].join( pathmod.sep ), function( err, data ) {
      var target_path = path;
      if( err ) { return callback( err ); }
      if( '_' == path.substr(0,1) ) {
        data = this.template( { body: handlebars.compile ( data.toString() ) ( this ) }._$merge( this ) );
        target_path = path.substr(1);
      }
      fs.writeFile( [ this.destination, target_path ].join( pathmod.sep ), data, function( err ) {
        if( err ) { return callback( err ); }
        callback.call(this);
      }.bind( this ) );
    }.bind( this ) );
  }

} ) ();