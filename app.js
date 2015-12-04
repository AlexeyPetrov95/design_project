var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var KnexSessionStore = require('connect-session-knex')(session);

var routes = require('./routes/index');
var login = require('./routes/login');
var admin = require('./routes/admin');
var admin_design = require('./routes/admin_design');


var app = express();

knexSQL = require('knex')({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'root',
    password : 'tutu123',
    database : 'design_db_test'
  }
});

var store = new KnexSessionStore({
  knex: knexSQL,
  tablename: 'sessions'
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session ({
	resave: true,
    saveUninitialized: false,
    secret: 'awesomeServer',
    key: 'sid',
    cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000  },
	store: store
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/', login );
app.use('/', loadUser, admin);
app.use('/', loadUser, admin_design);



function loadUser(req, res, next) {
  if (req.session.authorized) {
    knexSQL.select('name').from('admin').where({name: req.session.login}).then(function (user){
      if (user.name != req.session.login){ next();}
      else  { res.redirect('/'); }
    });
  } else { res.redirect('/'); }
}

// catch 404 and forward to error.ejs handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('user/error', {
      message: err.message,
      error: err
    });
  });
}


app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('user/error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
