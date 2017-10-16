var graphite = require('graphite-tcp');

function getIntConfig (envName, defaultValue) {
    if (process.env[envName]) {
        let parsed = parseInt(process.env[envName]);
        if (isNaN(parsed)) {
            throw new Error(`Expect an integer value for ${envName} but the input is ${process.env[envName]}`);
        }
        return parsed;
    } else {
        return defaultValue;
    }

}

var metric = graphite.createClient({
  host: process.env.GRAPHITE_HOST || "graphite.zeta.tools",
  port: getIntConfig("GRAPHITE_PORT", 2003),
  family: '4',
  prefix: process.env.GRAPHITE_PREFIX || "my-app",
  verbose: false,
  interval: 5000,
  callback: null
});

var hostName = '';
var PROD_MODE = process.env.PROD_MODE && process.env.PROD_MODE.toLowerCase() == "true" ? true : false;

function getHostname() {
    return new Promise(function(resolve, reject) {
        if (PROD_MODE) {
            var http = require("http");
            http.get("http://169.254.169.254/latest/meta-data/local-ipv4", function(res) {
                if (res.statusCode != 200) {
                    resolve(require('os').hostname());
                    return;
                }
                var rawData = '';
                res.on('data', function(chunk){ rawData += chunk });
                res.on('end', function () {
                    // replace the dot since it's a deliminator of graphite metrics groups.
                    resolve(rawData.replace(/\./g, "-"));
                });
            });

        } else {
            resolve(require('os').hostname());
        }
    });
}

function withHostname (callback) {
    if (hostName == '') {
        getHostname()
            .then(function(hName) {
                hostName = hName; // to cache the result
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

function meter (name, callback){
    withHostname(function(hostname){
        var start = Date.now();
        callback();
        var execTime = Date.now() - start;
        metric.put(`${hostname}.${name}`, execTime);
    });
}

var metrics = {
    meter : meter,
    counter : function(name) {addMetric(name, 1);},
    put: putMetric
}

exports = module.exports = metrics;