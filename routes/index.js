/*
 * GET home page.
 */
exports.index = function (req, res) {
    res.render('index', {
        title: 'Tienda energy'
    });
};
exports.byCategory = function (req, res) {
    var category, categoryParam = req.params.category,
        c = res.locals.categories,
        i = c && c.length;
    while (i--) {
        if (c[i].key[0] === req.params.category) {
            category = c[i];
            break;
        }
    }
    res.render('products-by-category', {
        title: 'Tienda energy',
        category: category
    });
};
exports.products = require('./products');
exports.cart = require('./cart');
