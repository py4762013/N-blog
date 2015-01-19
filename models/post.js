var mongodb = require('./db');
//var markdown = require('markdown').markdown;
/*var poolModule = require('generic-pool');
var pool = poolModule.Pool({
        name    : 'mongoPool',
        create  : function(callback){
            var mongodb = Db();
            mongodb.open(function(err, db){
                callback(err, db);
            })
        },
        destroy : function(mongodb){
            mongodb.close();
        },
        max     : 100,
        min     : 5,
        idleTimeoutMillis   : 30000,
        log     : true
    });*/
var ObjectID = require('mongodb').ObjectID;
var async = require('async');

function Post(name, head, title, tags, post){
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

//save a post
Post.prototype.save = function(callback){
    var date = new Date();
    //save date formate
    var time = {
        date : date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //will save to database
    var post = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
        pv: 0
    };
    //open database
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //read post collection
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callbacl(err);
            }
            //put post to posts collection
            collection.insert(post, {
                safe: true
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });*/
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.insert(post, {
                safe: true
            }, function(err){
                callback(err);
            });
        }
    ], function(err){
        mongodb.close();
        //pool.release(mongodb);
        callback(err);
    });
};

//read post
Post.getTen = function(name, page, callback){
    //open db
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, db){
                callback(err, db);
            });
        },
        function(db, callback){
            var query = {};
            if(name){
                query.name = name;
            }
            db.collection('posts', function(err, collection){
                callback(err, query, collection);
            });
        },
        function(query, collection, callback){
            collection.count(query, function(err, total){
                collection.find(query,{
                    skip: (page - 1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function(err, docs){
                    callback(err, docs, total);
                });
            });
        }
    ], function(err, docs, total){
        mongodb.close();
        //pool.release(db);
        /*docs.forEach(function(doc){
            doc.post = markdown.toHTML(doc.post);
        });*/
        callback(err, docs, total);
    });
    //mongodb.open(function(err, db){
    /*pool.acquire(function(err, db){
        if(err){
            return callback(err);
        }
        //read posts collection
        db.collection('posts', function(err, collection){
            if(err){
                //mongodb.close();
                pool.release(mongodb);
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function(err, total){
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query,{
                    skip: (page - 1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function(err, docs){
                    //mongodb.close();
                    pool.release(db);
                    if(err){
                        return callback(err);
                    }
                    //解析 markdown 为 html
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                });
            });
        });
    });*/
};

//获取一篇文章
/*Post.getOne = function(name, day, title, callback){
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
            //depend username,date and title
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc){
                if(err){
                    mongodb.close(err);
                    return callback(err);
                }
                if(doc){
                    //call once add one
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    },{
                        $inc: {"pv" : 1}
                    }, function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });
                    //markdown to html
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null, doc);
                }
            });
        });
    });
};*/


//获取一篇文章
Post.getOne = function(_id, callback){
    //open db
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.findOne({
                '_id' : new ObjectID(_id)
            }, function(err, doc){
                callback(err, collection, doc);
            });
        },
        function(collection, doc, callback){
            if(doc){
                collection.update({
                    '_id' : new ObjectID(_id)
                },{
                    $inc: {"pv":1}
                }, function(err){
                    callback(err, doc);
                });
            }
        }
    ], function(err, doc){
            mongodb.close();
            //pool.release(mongodb);
            /*doc.post = markdown.toHTML(doc.post);
            doc.comments.forEach(function(comment){
                comment.content = markdown.toHTML(comment.content);
            });*/
            callback(err, doc);
    });
}

//Edit
Post.edit = function(_id, callback){
    //open db
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.findOne({
                '_id': new ObjectID(_id)
            },function(err, doc){
                callback(err, doc);
            });
        }
    ], function(err, doc){
        mongodb.close();
        //pool.release(mongodb);
        callback(err, doc);
    });
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //read post collection
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //According username, date and title
            collection.findOne({
                '_id': new ObjectID(_id)
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    });*/
};

//Update
Post.update = function(_id, post, callback){
    //open db
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.update({
                "_id": new ObjectID(_id)
            },{
                $set: {post: post}
            },function(err){
                callback(err)
            });
        }
    ], function(err){
        mongodb.close();
        //pool.release(mongodb);
        callback(err);
    });
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //read post collection
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //update article collection
            collection.update({
                "_id" : new ObjectID(_id)
            },{
                $set: {post: post}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });*/
};

//删除一篇文章
/*Post.remove = function(_id, callback){
    //open db
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查询要删除的文档
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
                var reprint_from = "";
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != ""){
                    //更新原文章所在文档的 reprint_to
                    collection.update({
                        "_id" : new ObjectID(reprint_from.id)
                    },{
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": doc.name,
                                "day": doc.time.day,
                                "title": doc.title
                            }
                        }
                    }, function(err){
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }

                //删除转载来的文章所在的文档
                collection.remove({
                    "_id": new ObjectID(_id)
                },{
                    w: 1
                }, function(err){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    callback(null);
                })
            });
        });
    });
}*/

//remove a article
Post.remove = function(_id, callback){
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc){
                //callback(err, collection, doc)
                var reprint_from = "";
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != ""){
                    collection.update({
                        "_id": new ObjectID(reprint_from.id)
                    },{
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": doc.name,
                                "day": doc.time.day,
                                "title": doc.title
                            }
                        }
                    }, function(err){
                        callback(err);
                    });
                }
            });
            collection.remove({
                "_id": new ObjectID(_id)
            },{
                w: 1
            }, function(err){
                callback(err);
            });
        }
    ], function(err){
        if(err){
            mongodb.close();
            //pool.release(mongodb);
            return callback(err);
        }
        callback(err);
    });
}

//return all post archive info
Post.getArchive = function(callback){
    //open db
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1,
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                callback(err, docs)
            });
        }
    ], function(err, docs){
        mongodb.close();
        //pool.release(mongodb);
        callback(err, docs);
    });
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //read posts collection
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //return only name, time, title info compact docs
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1,
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });*/
};

//return all tags
Post.getTags = function(callback){
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.distinct("tags", function(err, docs){
                callback(err, docs);
            });
        }
    ], function(err, docs){
        mongodb.close();
        //pool.release(mongodb);
        callback(err, docs);
    })
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct find key diffrent value
            collection.distinct("tags", function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        })
    });*/
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback){
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.find({
                "tags": tag
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                callback(err, docs)
            });
        }
    ], function(err, docs){
        mongodb.close();
        //pool.release(mongodb);
        callback(err, docs);
    });
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });*/
};

//Search
Post.search = function(keyword, callback){
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
            //pool.acquire(function(err, mongodb){
                callback(err, db);
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                callback(err, docs);
            })
        }
    ], function(err, docs){
        mongodb.close();
        //pool.release(mongodb);
        callback(err, docs);
    })
    /*mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close()
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            })
        });
    });*/
};

//reprint
Post.reprint = function(reprint_from, reprint_to, callback){
    mongodb.open(function(err, db){
    //pool.acquire(function(err, mongodb){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                //pool.release(mongodb);
                return callback(err);
            }
            //找到被转载的文章的原文档
            collection.findOne({
                "_id": new ObjectID(reprint_from.id)
            },function(err, doc){
                if(err){
                    mongodb.close();
                   // pool.release(mongodb);
                    return callback(err);
                }

                var date = new Date();
                var time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    date: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                    date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                }
                delete doc._id;//注意要删掉原来的 _id

                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                //更新被转载的原文档的 reprint_info 内的 reprint_to
                collection.update({
                    "_id": new ObjectID(reprint_from.id)
                },{
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day": time.day,
                            "title": doc.title
                        }
                    }
                },function(err){
                    if(err){
                        mongodb.close();
                        //pool.release(mongodb);
                        return callback(err);
                    }
                });

                //将转载生成的副本修改后存入数据库，并返回存储后的文档
                collection.insert(doc, {
                    safe: true
                }, function(err, post){
                    mongodb.close();
                    //pool.release(mongodb);
                    if(err){
                        return callback(err);
                    }
                    callback(err, post[0]);
                });
            });
        });
    });
}

//reprint
/*Post.reprint = function(reprint_from, reprint_to, callback){
    async.waterfall([
        function(callback){
            mongodb.open(function(err, db){
                callback(err, db)
            });
        },
        function(db, callback){
            db.collection('posts', function(err, collection){
                callback(err, collection);
            });
        },
        function(collection, callback){
            collection.findOne({
                "_id" : new ObjectID(reprint_from.id)
            }, function(err, doc){
                if(err){
                    callback(err);
                }

                var date = new Date();
                var time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                }

                delete doc._id;

                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                collection.update({
                    "_id" : new ObjectID(reprint_from.id)
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day": time.day,
                            "title": doc.title
                        }
                    }
                }, function(err){
                    callback(err);
                });

                collection.insert(doc, {
                    safe: true
                }, function(err, post){
                    callback(err, post);
                });
            });
        }
    ], function(err, post){
        mongodb.close();
        if(err){
            return callback(err);
        }
        callback(err, post);
    });
}*/
