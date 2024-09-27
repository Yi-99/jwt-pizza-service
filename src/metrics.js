const config = require('./config.js');
const os = require('os');

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.getRequests = 0;
    this.deleteRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.successes = 0;
    this.failures = 0;
    this.latencies = []; // calculate the avg latency and send it over the grafana
    this.count = 0;
    this.totalRevenue = 0;
    this.isPurchaseSuccess = 0;
    this.activeUsers = 0;

    // This will periodically sent metrics to Grafana
    if (NODE_ENV === 'prod') {

      const timer = setInterval(() => {
        this.sendMetricToGrafana('request', 'all', this.totalRequests);
        
        const cpuUsage = this.getCpuUsagePercentage();
        const memoryUsage = this.getMemoryUsagePercentage();
        
        this.sendLatency();
        this.sendFailures();
        this.sendSuccesses();
        this.sendNumOfPizzasSold();
        this.sendRevenue();
        this.sendActiveUsers();
        
        this.sendMetricToGrafana('osMetrics', 'cpu', cpuUsage);
        this.sendMetricToGrafana('osMetrics', 'memory', memoryUsage);
      }, 10000);
      timer.unref();
    }
  }

  incrementRequests(httpMethod) {
    this.totalRequests++;
    if (httpMethod === 'POST') {
      this.postRequests++;
      this.sendMetricToGrafana('request', 'post', this.postRequests);
    } else if (httpMethod === 'GET') {
      this.getRequests++;
      this.sendMetricToGrafana('request', 'get', this.getRequests);
    } else if (httpMethod === 'DELETE') {
      this.deleteRequests++;
      this.sendMetricToGrafana('request', 'delete', this.deleteRequests);
    } else if (httpMethod === 'PUT') {
      this.putRequests++;
      this.sendMetricToGrafana('request', 'put', this.putRequests);
    }
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }
  // ${this.nowString()}
  sendMetricToGrafana(metricPrefix, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue}`;
    console.log(metric);

    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.log(`${metric}`);
          console.error(response);
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

  // get the number of success and failure attempts
  getAuthMetrics() {
    return {
      successes: this.successes,
      failures: this.failures,
    }
  }

  incrementAuthSuccess() {
    this.successes++;
  }

  incrementAuthFailures() {
    this.failures++;
  }

  incrementCount() {
    this.count++;
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }

  decrementActiveUsers() {
    this.activeUsers--;
  }

  addLatency(latency) {
    this.latencies.push(latency);
  }

  addRevenue(price) {
    this.totalRevenue += price;
  }

  sendLatency() {
    let total = 0;
    this.latencies.forEach((latency) => { total += latency })
    const avg = total / this.latencies.length;
    console.debug("AVG:", avg);
    this.sendMetricToGrafana("avg_latency", "making_pizza", avg);
  }

  sendRevenue() {
    this.sendMetricToGrafana("revenue", "total", this.totalRevenue);
  }

  sendNumOfPizzasSold() {
    this.sendMetricToGrafana("pizza", "number_sold", this.count);
  }

  sendSuccesses() {
    this.sendMetricToGrafana("auth", "successful", this.successes);
  }

  sendFailures() {
    this.sendMetricToGrafana("auth", "failed", this.failures);
  }

  sendActiveUsers() {
    this.sendMetricToGrafana("active", "users", this.activeUsers);
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }
  
  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }
}

const metrics = new Metrics();
module.exports = metrics;