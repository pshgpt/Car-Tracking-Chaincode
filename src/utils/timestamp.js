function toDate(timestamp) {
    
    const milliseconds = (timestamp.seconds.low + ((timestamp.nanos / 1000000) / 1000)) * 1000;
    var time = new Date(milliseconds)
    return time;
}

module.exports = {toDate};