var express = require('express');
var path = require('path');
var multer = require('multer');
//var favicon = require('server-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var settings = require('./settings');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

var passport = require('passport'),GithubStrategy = require('passport-github').Strategy;

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(passport.initialize());

app.use(multer({
    dest: './public/images',
    rename: function(fieldname, filename){
        return filename;
    }
}));

app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,//cookie name
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
    store: new MongoStore({
        db: settings.db,
        host: settings.host,
        port: settings.port
    })
}));

app.use(flash());

app.use(logger('dev'));
app.use(logger({stream: accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next){
    var meta = '[' + new Date() + ']' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});

passport.use(new GithubStrategy({
    clientID: "69c61377d6bd211ce59f",
    clientSecret: "5cdf2a97b4be7e47cdad60ba1c8d2cf0d7b23c4a",
    callbackURL: "http://106.185.48.100:3000/github/callback"
}, function(accessToken, refreshToken, profile, done){
    done(null, profile);
}));

routes(app);

app.listen(app.get('port'), function(){
    console.log('Express server listening on port' + app.get('port'));
});
