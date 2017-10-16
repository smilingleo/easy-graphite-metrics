# Metrics
An easy to use graphite metrics utils.

## To use
### Install and Config
```
npm install easy-graphite-metrics -S
export GRAPHITE_HOST=<your_graphite_Host>
export GRAPHITE_PORT=2003
export GRAPHITE_PREFIX=<your_prefix>
```

### To Add a Metric
```
var metrics = require('easy-graphite-metrics');
metrics.add("metric-name", value);
```

### To meter a callback
```
metrics.meter("meter-name", function() => {
    //do something useful.
})
```
