var nock = require('nock');
// Nock works by overriding Node's http.request function.

var assert = require('assert');
var metrics = require('./index');

var localName = require('os').hostname();

// make sure this is the first case to cover the case when 'hostName' private variable is not set
describe('metrics.withHostname', function() {
    it('will get hostname if not in AWS', function(done){
        nock('http://169.254.169.254')
            .get('/latest/meta-data/local-ipv4')
            .reply(503, '');

            // invoke twice, should go with different routes.
        metrics.__test_withHostname(function(hostname){
            assert(hostname === localName);
            done();
        });
    });

    it('will get EC2 IP address if in AWS', function(done){
        delete require.cache[require.resolve('./index')];
        metrics = require('./index');
        var ip = '10.10.10.10';
        nock('http://169.254.169.254')
            .get('/latest/meta-data/local-ipv4')
            .reply(200, ip);

            // invoke twice, should go with different routes.
        metrics.__test_withHostname(function(hostname){
            assert(hostname === "10-10-10-10", `expected 10-10-10-10 but got ${hostname}`);
            done();
        });
    });
});

describe('metrics.meter', function() {
    it('should accept number', function() {
        metrics.meter("key", 1);
    });
    it('should accept function', function() {
        metrics.meter("key", function() {
            console.log("do something");
        });
    });
    it('should accept success promise', function(done) {
        var p = new Promise(function(resolve) {
            setTimeout(function() {
                resolve("something");
                done();
            }, 10)
        });

        metrics.meter("key", p);
    });

    it('should accept reject promise', function(done) {
        var p = new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject(new Error("some error"));
                done();
            }, 10);
        });

        metrics.meter("key", p);

    });
})