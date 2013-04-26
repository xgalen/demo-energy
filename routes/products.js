module.exports.get = function (req, res) {
    res.render('product-details', {
        title: res.locals.product.name
    });
};
