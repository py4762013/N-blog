var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

/*function Comment(name, day, title, comment){
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}*/
function Comment(id, comment){
    this.id = id;
    this.comment = comment;
}

module.exports = Comment;

//save a comment message
Comment.prototype.save = function(callback){
    /*var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;*/
    var id = this.id,
        comment = this.comment;
    //open db
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //read post collection
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //According username,time,title find,add a comment to article comments array
            collection.update({
                /*"name": name,
                "time.day": day,
                "title": title*/
                "_id": new ObjectID(id)
            },{
                $push: {"comments": comment}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}
