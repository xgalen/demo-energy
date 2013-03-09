/**
 * Module dependencies.
 */
var express = require('express'),
    cradle = require('cradle'),
    routes = require('./routes'),
    debug = require('debug')('app'),
    dbconf = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5984,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root'
    },
    middleware = require('./lib/middleware'),
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
    app.set('db', new(cradle.Connection)(dbconf.host, dbconf.port, {
        auth: {
            username: dbconf.username,
            password: dbconf.password
        }
    }).database('energy'));
});
app.get('/', middleware.loadCategories, routes.index);
app.get('/productos/:category', middleware.loadProductsByCategory, function(req,res){
	res.json(res.locals.products);
});
