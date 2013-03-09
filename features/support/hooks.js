// features/support/hooks.js (this path is just a suggestion)
var myHooks = function () {
    var app = require('../../app'),
        server;
    this.Before(function (callback) {
        server = app.listen(3000, callback);
    });
    this.After(function (callback) {
        server.close(callback);
    });
};
module.exports = myHooks;
