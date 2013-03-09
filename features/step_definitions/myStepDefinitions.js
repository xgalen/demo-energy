var rootUrl = 'http://localhost:3000';
var myStepDefinitionsWrapper = function () {
    this.World = require("../support/world.js").World;
    this.Given(/^I load (.*) page$/, function (link, callback) {
        this.visit(rootUrl, callback);
    });
    this.Then(/^I should see "(.*)" as the page title$/, function (title, callback) {
        if (!this.isOnPageWithTitle(title)) {
            var error = new Error("Expected to be on page with title " + title),
                screenshotName = error.message.replace(/\W+/g, '-') + '.png';
            this.takeScreenshot(rootUrl, screenshotName, function () {
                callback.fail(error);
            });
        } else {
            callback();
        }
    });
};
module.exports = myStepDefinitionsWrapper;
