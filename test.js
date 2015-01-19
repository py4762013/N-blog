var async = require('async');

async.waterfall([
    function(callback){
        callback(null, 'one');
    },
    function(arg1/*, arg2*/, callback){
        console.log('arg1=> ' + arg1);
        //console.log('arg2=> ' + arg2);
        callback(null, 'three');
    }/*,
    function(arg3, callback){
        console.log('arg3=> ' + arg3);
        callback(null, 'done');
    }*/
], function(err, result){
    console.log('err=> ' + err);
    console.log('result=> ' + result);
});
