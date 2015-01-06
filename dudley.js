( function () {
                   require( 'sn-core' );
  var fs         = require( 'fs' );
  var pathmod    = require( 'path' );
  var handlebars = require( 'handlebars' );

  var _instance_defaults = {
    source: 'contents',
    destination: 'static',
    theme: 'default',
    themepath: [ process.env.THEMEPATH, '.', [ __dirname, 'themes' ].join( pathmod.sep )  ],
    processor: 'default.js',
    processorpath: [ process.env.PROCESSORPATH, '.', [ __dirname , 'processors' ].join( pathmod.sep ) ],
    configfile: '_dudley.json',
    templatefile: '_template.html',
    processorfile: '_processor.js'
  };

  _$construct( 'exports', _instance_defaults, module );
  module.exports.prototype._$init = function () {
    this.base = ".";
    this.ignore = [ this.configfile, this.templatefile, this.processorfile ];
  };

  module.exports.prototype.process = function ( callback ) {
    callback = _$g( callback );
    
    // load config file - if we can't find it, we just assume defaults
    fs.readFile( [ this.source, this.configfile ].join( pathmod.sep ), function( err, data ) {
      if( err && err.code !== 'ENOENT' ) { return callback( err ); }
      if( data ) {
        try {
          this._$merge( JSON.parse( data ) );
        } catch( err ) {
          return callback( err );
        }
      }

      // use custom processor in the source directory if it's there
      find_file_in_paths( this.processorfile, [ this.source ], function( err, path ) {
        if( err ) {
          if( 'ENOENT' === err.code ) {
            // Since we didn't find the custom processor, look for the processor based on the object state
            return find_file_in_paths( this.processor, []._$shallow( this.processorpath ), function( err, path ) {
              if( err ) { return callback( err ); }
              return _use_processor.call( this, path );
            }.bind( this ) );
          } else {
            return callback( err );
          } 
          return _use_processor.call( this, path );
        }
      }.bind( this ) );

    }.bind( this ) );

    function _use_processor( processor_path ) {
      build_target.call( this, function( err ) {
        if( err ) { return callback( err ); }
      
        build_template.call( this, function( err ) {
          if( err ) { return callback( err ); }
          try {
            require( processor_path ) ( this, callback );
          } catch( err ) {
            return callback( err );
          }
        } );
      } );
    }
  };

  function build_target( callback ) {
    fs.stat( this.destination, function( err ) {
      if( err ) {
        if( 'ENOENT' !== err.code ) { return callback( err ); }
        fs.mkdir( this.destination, function( err ) {
          if( err ) { return callback( err ); }
          callback.call( this );
        }.bind( this ) );
      } else {
        callback.call( this );
      }
    }.bind( this ) );
  }

  function build_template( callback ) {
    find_file_in_paths( this.theme, []._$shallow( this.themepath ), function( err, path ) {
      if( err ) { return callback( err ); }
      this.themedir = path;
      fs.readFile( [ path, this.templatefile ].join( pathmod.sep ), function( err, data ) {
        if( err && ( ( 'ENOENT' !== err.code ) || ( ! this.template ) ) ) { return callback( err ); }
        this.template = handlebars.compile( data.toString() );
        callback.call( this );
      }.bind( this ) );
    }.bind( this ) );
  }

  function find_file_in_paths( fname, dirs, callback ) {
    var current = dirs.shift();
    if( ( dirs.length > 0 ) && ( ! current ) ) {
      return find_file_in_paths( fname, dirs, callback );
    }
    var currentpath = [ current, fname ].join( pathmod.sep );
    fs.stat( currentpath, function( err, stats ) {
      if( err ) {
        if( ( dirs.length > 0 ) && ('ENOENT' === err.code ) ) {
          return find_file_in_paths( fname, dirs, callback );
        }
        return _$g( callback ) ( err );
      }
      _$g( callback ) ( null, currentpath );
    } );
  }

} ) ();