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
    connectAgument = require('./lib/connect-augment.js'),
    http = require('http'),
    req = http.IncomingMessage.prototype,
    path = require('path'),
    app = module.exports = express();
req.pushMessage = function (type, foreword, text) {
    if (!this.session.messages) {
        this.session.messages = [];
    }
    this.session.messages.push({
        type: type,
        foreword: foreword,
        text: text
    });
};
app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(function (req, res, next) {
        var msg = req.session.messages;
        delete req.session.messages;
        res.locals.messages = msg;
        next();
    });
    app.use(express.compress());
    app.use(function (req, res, next) {
        res.locals.thumbBaseUrl = 'http://www.grupoenergy.com/grupoenergy/images/productos';
        next();
    });
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
var loadProduct = [middleware.loadCategories, middleware.loadProduct, connectAgument.augmentCategories, connectAgument.augmentProducts];
app.get('/', middleware.loadCategories, connectAgument.augmentCategories, routes.index);
app.get('/productos/:category', middleware.loadCategories, middleware.loadProductsByCategory,connectAgument.augmentCategories, connectAgument.augmentProducts, routes.byCategory);
app.get('/buy/:id', loadProduct, routes.cart.get);
app.post('/buy/:id', loadProduct, routes.cart.processCart);
app.get('/:id', loadProduct, routes.products.get);
