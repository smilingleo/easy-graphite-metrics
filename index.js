var graphite = require('graphite-tcp');

var metric = graphite.createClient({
  host: process.env.GRAPHITE_HOST || "graphite.zeta.tools",
  port: parseInt(process.env.GRAPHITE_PORT || "2003"),
  family: '4',
  prefix: process.env.GRAPHITE_PREFIX || "my-app",
  verbose: false,
  interval: 5000,
  callback: null
});

var hostName = '';

function getHostname() {
    return new Promise(function(resolve, reject) {
        var http = require("http");
        http.get({
            hostname: '169.254.169.254',
            port: 80,
            path: '/latest/meta-data/local-ipv4',
            method: 'GET',
            timeout: 3000
          }, function(res) {
            if (res.statusCode !== 200) {
                resolve(require('os').hostname());
                return;
            }
            var rawData = '';
            res.on('data', function(chunk){ rawData += chunk });
            res.on('end', function () {
                // replace the dot since it's a deliminator of graphite metrics groups.
                resolve(rawData.replace(/\./g, "-"));
            });
        }).on('error', function(e) {
            resolve(require('os').hostname());
        });
    });
}

function withHostname (callback) {
    if (hostName === '') {
        getHostname()
            .then(function(hName) {
                // cache the result
                hostName = hName;
                callback(hName);
            })
    } else {
        // to keep this function async.
        setImmediate(callback, hostName);
    }
}

function addMetric (name, value) {
    withHostname(function(hostname) {
        metric.add(`${hostname}.${name}`, value);
    });
}

function putMetric (name, value){
    withHostname(function(hostname){
        metric.put(`${hostname}.${name}`, value);
    });
}

function meter(name, callback) {
    withHostname(function(hostname){
        var argType = typeof callback;
        if (argType === 'undefined' || argType === null) {
            metric.put(`${hostname}.${name}`, 0);
        }else if (argType === 'function') {
            var begin = Date.now();
            callback();
            var execTime = Date.now() - begin;
            metric.put(`${hostname}.${name}`, execTime);
        } else if (argType === 'number') {
            metric.put(`${hostname}.${name}`, callback);
        } else if (argType === 'object' && callback.__proto__ === Promise.prototype) {
            var begin = Date.now();
            callback.then(function() {
                var execTime = Date.now() - begin;
                metric.put(`${hostname}.${name}`, execTime);
            }, function(e) {
                var execTime = Date.now() - begin;
                metric.put(`${hostname}.${name}`, execTime);
            });
        } else {
            throw new Error("invalid argument type, expect one of 'number', function, promise.")
        }
    });
}

var metrics = {
    counter : function(name) {addMetric(name, 1);},
    put: putMetric,
    add: addMetric,
    meter: meter,

    __test_withHostname: withHostname,
    __test_getHostname: getHostname
}

exports = module.exports = metrics;