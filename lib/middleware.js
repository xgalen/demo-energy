module.exports.loadCategories = function (req, res, next) {
    req.app.get('db').view('products/categories', {
        include_docs: false,
        group: true,
        reduce: true
    }, function (err, docs) {
        if (err) {
            console.error(err);
            console.trace(err.stack);
            return next();
        }
        res.locals.categories = docs;
        next();
    });
};
module.exports.loadProductsByCategory = function (req, res, next) {
    var category = req.params.category;
    if (!category) {
        return next();
    }
    res.locals.selectedCategory = category;
    req.app.get('db').view('products/categories', {
        startkey: [category],
        endkey: [category, {}],
        include_docs: true,
        reduce: false
    }, function (err, docs) {
        if (err) {
            console.error(err);
            console.trace(err.stack);
            return next();
        }
        res.locals.products = docs;
        next();
    });
};
module.exports.loadProduct = function (req, res, next) {
    req.app.get('db').get(req.params.id, function (err, doc) {
        if (err) {
            console.error(err);
            console.trace(err.stack);
            return next(err);
        }
        res.locals.product = doc;
        next();
    });
};
