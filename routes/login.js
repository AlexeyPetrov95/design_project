var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');

/* GET users listing. */
router.get('/login', function(req, res, next) {
    if (req.session.authorized){ res.redirect('/admin'); }
    else { res.render('user/login', {title: 'Login'}); }
});

router.post('/login', function(req, res, next){
     knexSQL.select().from('admin').where({name:req.body.login}).then(function(user){
        if (user.length == 0){
          res.redirect('/login');
        } else if (passwordHash.verify(req.body.password, user[0].password) && req.session.authorized == undefined) {
            req.session.authorized = true;
            req.session.login = req.body.login;
            req.session.user_id = user[0].id;
            req.session.super_user = user[0].superUser;
            res.redirect('/admin');
        } else {
            res.redirect('/admin');
        }
     });
});


module.exports = router;
