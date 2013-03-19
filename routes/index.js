
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Tienda energy' });
};
exports.byCategory = function(req, res){
  res.render('products-by-category', { title: 'Tienda energy' });
};
