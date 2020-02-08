module.exports = {
    sleep: function(timems) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {resolve("done!");}, timems);
        });
    }
}