var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');
var async = require('async');

// рендеринг на 'index_admin.ejs'
router.get('/admin', function(req, res){
    
     async.waterfall([       
        function(callback){
            knexSQL().select()
                .from('sessions')
                .where({sid: req.sessionID})
                .then(function(session) {
                
                callback(null, session);
            });
            
        }, function (session, callback){
            
            if (!session[0].admin_id) { 
                
                knexSQL('sessions')
                    .where({sid: req.sessionID})
                    .update({admin_id: req.session.user_id})
                    .then(function () {
                    
                    callback(null);
                });
                
            } else {
                
                callback(null);                 
            }
        }
         
    ], function(err) {
        if (err) { 
            res.send(500); 
        } else {
            knexSQL().select()
                .from('admin')
                .then(function(users){
                
                res.render('adminView/index_admin.ejs', {
                    title: "Управление пользователями",
                    users: users, 
                    currentUserId: req.session.user_id, 
                    isSuperUser: req.session.super_user 
                });
            });   
        }
    });
});

//---ajax--- Создание нового пользователя
router.post('/admin/createUser', function(req, res){
    
    var login = req.body.login;
    var password = req.body.password;
    
    knexSQL().select()
        .from('admin')
        .where({name: login})
        .then(function (oldUser) {
        
        if (!oldUser.length) { 
            res.send(false); 
        } else {
            var hashedPassword = passwordHash.generate(password);
            knexSQL('admin')
                .insert({   
                    name: login, 
                    password: hashedPassword, 
                    superUser: 0 })
                .then(function(newUser){
                    
                res.send(newUser ? true : 500); 
            });
        }
    });
});

//---ajax--- Изменение пароля
router.post('/admin/updatePassword', function(req, res){
    
    var userId = req.body.id; // id изменяемого юзера
    var sessionUserId = req.session.user_id; // id текущего юзера в сессии
    var oldPassword = req.body.oldpass; // старый пароль
    var newPassword = req.body.newpass; // новый пароль
    var hashedNewPassword = passwordHash.generate(newPassword);
    
    knexSQL('admin').select()
        .where({id: userId})
        .then(function (user) {
        
        // является ли изменяемый юзер "супер-админом"
        var isSuperUser = user[0].superUser == 1;
        // является ли изменяемый юзер текущим (в сессии)
        var isOwnSessionActived = userId == sessionUserId;
        
        if (!isSuperUser && !isOwnSessionActived) { 
            
            res.send(false); 
            
        } else {
            var isOldPasswordValid = passwordHash.verify(oldPassword, user[0].password);
            if (isOldPasswordValid) {
                knexSQL('admin')
                    .where({id: userId})
                    .update({password: hashedNewPassword})
                    .then(function () {
                    
                    res.send(true);
                });
            } else { 
                
                res.send(false);                 
            }
        }
    });
});

//---ajax--- Удаление пользователя
router.delete('/admin/deleteUser', function(req, res){
    
    knexSQL('admin').select()
        .where({id: req.session.user_id})
        .then(function(user){
        
        // текущий пользователь в сессии
        var sessionUser = user[0];
        // id удаляемого юзера
        var deletedUserId = req.body.id;
        // является ли текущий юзер "супер-админом"
        var isSuperUser = sessionUser.superUser == 1;
        // пользователь удаляет сам себя
        var isDeleteHimself = sessionUser.id == deletedUserId;
        
        if (!isSuperUser || isDeleteHimself) { 
            
            res.send(false); 
            
        } else {
            
            knexSQL('sessions')
                .where({admin_id: deletedUserId})
                .del()
                .then(function(){
                
                knexSQL('admin')
                    .where({id: deletedUserId})
                    .del()
                    .then(function(){
                    
                    res.send(true);
                });
            });
        } 
    });
});

// закрытие сессии
router.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;