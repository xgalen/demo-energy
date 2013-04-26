module.exports.augmentCategories = function augmentCategories(req, res, next) {
    var c = res.locals.categories,
        i = c.length;
    while (i--) {
        c[i].url = '/productos/' + c[i].key[0];
    }
    next();
};
module.exports.augmentProducts = function augmentProducts(req, res, next) {
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
};
