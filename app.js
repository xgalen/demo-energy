/**
 * Module dependencies.
 */
var express = require('express'),
    routes = require('./routes'),
    debug = require('debug')('app'),
    path = require('path');
var app = module.exports = express();
app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.compress());
    app.use(app.router);
    app.use(express['static'](path.join(__dirname, 'public')));
});
app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.locals.pretty = true;
});
app.get('/', routes.index);
