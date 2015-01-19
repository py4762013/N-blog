var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    passport = require('passport');

module.exports = function(app){

    app.get('/', function(req, res){
        //Determines whether the first page
        var page = req.query.p ? parseInt(req.query.p) : 1;
        Post.getTen(null, page, function(err, posts, total){
            if(err){
                posts = [];
            }
            res.render('index', {
                title: 'Home',
                user: req.session.user,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function(req, res){
        //res.render('reg', { title: 'register' });
        res.render('reg', {
            title: 'Register',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    
    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req, res){
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //check two password
        if(password_re != password){
            req.flash('error', 'Two input password not match!');
            return res.redirect('/reg');//back to register
        }
        //password md5
        var md5 = crypto.createHash('md5');
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });
        //check username is exist
        User.get(newUser.name, function(err, user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error', 'username isexist');
                return res.redirect('/reg');
            }
            newUser.save(function(err, user){
                if(err){
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', 'Register success!');
                res.redirect('/');//Sucess redirct to homepage
            });
        })
    });
    
    app.get('/login', checkNotLogin);
    app.get('/login', function(req, res){
        //res.render('login', { title: 'login'});
        res.render('login', {
            title: 'Login' ,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    
    app.get("/login/github", passport.authenticate("github", {session: false}));
    app.get("/login/github/callback", passport.authenticate("github", {
        session: false,
        failureRedirect: '/login',
        successFlash: '登陆成功!'
    }), function(req, res){
        req.session.user = {name: req.user.username, head: "https://gravatar/avatar/" + req.user._json.gravatar_id + "?s=48"};
        res.redirect('/');
    })

    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res){
        //create password md5
        var md5 = crypto.createHash('md5');
            password = md5.update(req.body.password).digest('hex');
        //check user is exist
        User.get(req.body.name, function(err, user){
            if(!user){
                req.flash('error', 'user not exist!');
                return res.redirect('/login');//user not exists back to login
            }
            //check user password
            if(user.password != password){
                req.flash('error', 'password is error');
                return res.redirect('/login');
            }
            //all right save user on session
            req.session.user = user;
            req.flash('success', 'login success');
            res.redirect('/');//login success redirect to homepage
        });
    });
    
    app.get('/post', checkLogin);
    app.get('/post', function(req, res){
        //res.render('post', { title: 'Publication' });
        res.render('post', {
            title: 'Publication',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function(req, res){
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            //post = new Post(currentUser.name, req.body.title, tags, req.body.post);
            post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'Publication successfuly!');
            res.redirect('/');//Publication success redirect to home
        });
    });
    
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res){
        req.session.user = null;
        req.flash('success', 'logout success!');
        res.redirect('/');//logout
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res){
        res.render('upload', {
            title: 'File Upload',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function(req, res){
        req.flash('success', 'File upload successfuly!');
        res.redirect('/upload');
    });
    
    app.get('/archive', function(req, res){
        Post.getArchive(function(err, posts){
            if(err){
                req.flash("error", err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: 'Archive',
                posts: posts,
                user: req.session.users,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags', function(req, res){
        Post.getTags(function(err, posts){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags',{
                title: 'tag',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags/:tag', function(req, res){
        Post.getTag(req.params.tag, function(err, posts){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag',{
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    
    app.get('/links', function(req, res){
        res.render('links',{
            title: 'links',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/search', function(req, res){
        Post.search(req.query.keyword, function(err, posts){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: "SEARCH" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/u/:name', function(req, res){
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //check user isexist
        User.get(req.params.name, function(err, user){
            if(!user){
                req.flash('error', 'user not exists!');
                return res.redirect('/');//user not exists redirect to home
            }
            //select and return this user all post
            Post.getTen(user.name, page, function(err, posts, total){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1)*10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    /*app.get('/u/:name/:day/:title', function(req, res){
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });*/

    app.get('/p/:_id', function(req, res){
        Post.getOne(req.params._id, function(err, post){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: post.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //app.post('/u/:name/:day/:title', function(req, res){
    app.post('/p/:_id', function(req, res){
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        //var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        var newComment = new Comment(req.params._id, comment);
        newComment.save(function(err){
            if(err){
                req.flash('error', err.toString());
                return res.redirect('back');
            }
            req.flash('success', 'Leave message Success!');
            res.redirect('back');
        });
    });
    
    //app.get('/edit/:name/:day/:title', checkLogin);
    //app.get('/edit/:name/:day/:title', function(req, res){
    app.get('/edit/:_id', checkLogin);
    app.get('/edit/:_id', function(req, res){
        var currentUser = req.session.user;
        Post.edit(req.params._id, function(err, post){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: 'Edit',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    
    //app.post('/edit/:name/:day/:title', checkLogin);
    //app.post('/edit/:name/:day/:title', function(req, res){
    app.post('/edit/:_id', checkLogin);
    app.post('/edit/:_id', function(req, res){
        var currentUser = req.session.user;
       Post.update(req.params._id, req.body.post, function(err){
            var url = encodeURI('/p/' + req.params._id);
            if(err){
                req.flash('error', err);
                return res.redirect(url);//Error! back to 
            }
            req.flash('success', 'Change Success!');
            res.redirect(url);
        });
    });

    //app.get('/remove/:name/:day/:title', checkLogin);
    //app.get('/remove/:name/:day/:title', function(req, res){
    app.get('/remove/:_id', checkLogin);
    app.get('/remove/:_id', function(req, res){
        var currentUser = req.session.user;
        Post.remove(req.params._id, function(err){
            if(err){
                req.flash('error');
                return res.redirect('back');
            }
            req.flash('succes', 'Remove Success!');
            res.redirect('/');
        });
    });

    //app.get('/reprint/:name/:day/:title', checkLogin);
    //app.get('/reprint/:name/:day/:title', function(req, res){
    app.get('/reprint/:_id', checkLogin);
    app.get('/reprint/:_id', function(req, res){
        Post.edit(req.params._id, function(err, post){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }
            var currentUser = req.session.user,
                reprint_from = {id: req.params._id, name: post.name, day: post.time.day, title: post.title},
                reprint_to = {name: currentUser.name, head: currentUser.head};
            Post.reprint(reprint_from, reprint_to, function(err, post){
                if(err){
                    req.flash('error', err.toString());
                    return res.redirect('back');
                }
                req.flash('success', '转载成功!');
                //var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
                var url = encodeURI('/p/' + post._id);
                res.redirect(url);
            });
        });
    });

    app.use(function(req, res){
        res.render("404");
    });

    function checkLogin(req, res, next){
        if(!req.session.user){
            req.flash('error', 'is not login');
            res.redirect('/');
        }
        next();
    }
    
    function checkNotLogin(req, res, next){
        if(req.session.user){
            req.flash('error', 'is logged');
            res.redirect('back');
        }
        next();
    }
};
