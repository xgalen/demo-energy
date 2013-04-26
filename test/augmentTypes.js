var assert = require('assert'),
    connectAgument = require('../lib/connect-augment.js');
describe('Augment types', function () {
    describe('#augmentCategories(req, res, next)', function () {
        it('should augment categories', function (done) {
            var res = {
                locals: {
                    categories: [{
                        key: ['a']
                    }]
                }
            };
            connectAgument.augmentCategories({}, res, function () {
                assert.equal(res.locals.categories[0].url, '/productos/a');
                done();
            });
        });
    });
});
