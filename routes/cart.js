module.exports.get = function(req, res){
    res.render('view-cart', {
        title: 'Compre ' + res.locals.product.name
    });
};
