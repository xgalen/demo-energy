var zombie = require('zombie'),
    path = require('path');
var childProcess = require('child_process'),
    phantomjs = require('phantomjs'),
    binPath = phantomjs.path,
    screenshotScript = '../../screenshot.js';
var World = function World(callback) {
    this.browser = new zombie.Browser(); // this.browser will be available in step definitions
    this.visit = function (url, callback) {
        this.browser.visit(url, {
            debug: true,
            runScripts: false
        }, callback);
    };
    this.isOnPageWithTitle = function (title) {
        return title == this.browser.text("title");
    };
    this.existsSection = function (section) {
        return (this.browser.queryAll("#" + section)).length;
    };
    this.takeScreenshot = function (url, screenshotFile, callback) {
        screenshotFile = 'screenshots/' + screenshotFile;
        console.error('Taking screenshot: ' + screenshotFile);
        var childArgs = [
        path.join(__dirname, screenshotScript),
        url, screenshotFile];
        console.error(__dirname);
        console.error(screenshotScript);
        console.error(url);
        console.error(screenshotFile);
        childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
            console.error('Screenshot completed');
            callback();
        });
    };
    callback(); // tell Cucumber we're finished and to use 'this' as the world instance
};
exports.World = World;
