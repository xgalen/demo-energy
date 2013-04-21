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

function augmentCategories(req, res, next) {
    var c = res.locals.categories,
        i = c.length;
    while (i--) {
        c[i].url = '/productos/' + c[i].key[0];
    }
    next();
}

function augmentProducts(req, res, next) {
    var c = res.locals.products,
        i = c && c.length;
    while (i--) {
        c[i].url = '/' + c[i].id;
        c[i].categoryUrl = '/productos/' + c[i].safeCategoryName;
    }
    if ((c = res.locals.product)) {
        c.url = '/' + c.id;
        c.categoryUrl = '/productos/' + c.safeCategoryName;
    }
    next();
}
var loadProduct = [ middleware.loadCategories, middleware.loadProduct, augmentCategories, augmentProducts];
app.get('/', middleware.loadCategories, augmentCategories, routes.index);
app.get('/productos/:category', middleware.loadCategories, middleware.loadProductsByCategory, augmentCategories, augmentProducts, routes.byCategory);
app.get('/buy/:id', loadProduct, routes.cart.get);
app.get('/:id', loadProduct, routes.products.get);
