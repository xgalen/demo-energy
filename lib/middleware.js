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
