var cradle = require('cradle'),
    debug = require('debug')('initdb'),
    products = require('./products'),
    host = process.env.DB_HOST || 'localhost',
    port = process.env.DB_PORT || 5984,
    username = process.env.DB_USER || 'root',
    password = process.env.DB_PASSWORD || 'root',
    db = new(cradle.Connection)(host, port, {
        auth: {
            username: username,
            password: password
        }
    }).database('energy'),
    charMap = {
        'á': 'a',
        'é': 'e',
        'í': 'i',
        'ó': 'o',
        'ú': 'u',
        'ñ': 'n'
    },
    getSafeText = function (input) {
        return Array.prototype.map.call(input.toLowerCase(), function (x) {
            return charMap[x] || x;
        }).join('').replace(/^\s+|\s+$/g, '').replace(/\W+/g, '-');
    };
debug('Deploying db');

function prepareProductsForDB() {
    products.forEach(function (p) {
        p._id = '' + p.code;
        p.type = 'product';
        p.safeCategoryName = getSafeText(p.categoryName);
    });
}

function putData() {
    debug('Storing views');
    db.save('_design/products', {
        all: {
            map: function (doc) {
                if (doc.type === 'product') {
                    emit(doc._id, null);
                }
            }
        },
        categories: {
            map: function (doc) {
                if (doc.type === 'product') {
                    emit([doc.safeCategoryName, doc.categoryName, doc.categoryId], doc._id);
                }
            },
            reduce: "_count"
        }
    });
    debug('About to insert ' + products.length + ' products');
    prepareProductsForDB();
    db.save(products, function (err, res) {
        if (err) {
            console.error(err);
            console.trace(err.stack);
            return;
        }
        debug('Ok');
    });
}
db.exists(function (err, exists) {
    if (err) {
        console.error(err);
        console.trace(err.stack);
    } else if (exists) {
        debug('Cleaning existing db');
        db.destroy(function () {
            debug('Creating db');
            db.create(function () {
                putData();
            });
        });
    } else {
        debug('Database does not exists.');
        debug('Creating db');
        db.create(putDocs, function () {
            putData();
        });
    }
});
