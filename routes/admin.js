var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');
var async = require('async');


//                  ******************** управление пользователями ***********************
router.get('/admin', function(req,res){
     async.waterfall([
        function(callback){
            knexSQL().select().from('sessions').where({sid: req.sessionID}).then(function(session) {
                callback(null, session);
            });
        }, function (session, callback){
            if (session[0].admin_id == null) {
                knexSQL('sessions').where({sid: req.sessionID}).update({admin_id: req.session.user_id}).then(function () {
                    callback(null);
                });
            } else {callback(null); }
        }
    ], function(err){
        if (err) {res.send(500);}
        knexSQL().select().from('admin').then(function(users){
            res.render('adminView/index_admin.ejs', {users: users, currentUser: req.session.user_id, super_user: req.session.super_user, title: "Управление пользователями"});
        });
    });
});

router.post('/admin/create_new_user', function(req, res){
    knexSQL().select().from('admin').where({name: req.body.login}).then(function (oldUser) {
        if (oldUser.length != 0){ res.send(false); }
        else {
            var hashedPassword = passwordHash.generate(req.body.password);
            knexSQL('admin').insert({name: req.body.login, password: hashedPassword, superUser: 0}).then(function(newUser){
                if (!newUser){ res.send(500); }
                else { res.send(true); }
            });
        }
    });
});

router.post('/admin/update_password', function(req, res){
    var hashedPassword = passwordHash.generate(req.body.oldpassword);
    knexSQL().select().from('admin').where({id: req.body.id}).then(function (user) {
        if (user[0].superUser != 1 && user[0].id != req.session.user_id){ res.send(false); }
        else if (passwordHash.verify(req.body.oldpassword, user[0].password)){
            var newPassword = passwordHash.generate(req.body.newpassword);
            knexSQL('admin').where({id: req.body.id}).update({password: newPassword}).then(function () {
                res.send(true);
            });
        } else { res.send(false); }
    });
});

router.delete('/admin/delete_user', function(req, res){
    knexSQL().select().from('admin').where({id: req.session.user_id}).then(function (user) {
        if (user[0].superUser == 0) { res.send(false); }
        else if (user[0].id == req.body.id){ res.send(false); }
        else {
            knexSQL('sessions').where({admin_id: req.body.id}).del().then(function(test){
                knexSQL('admin').where('id', req.body.id).del().then(function () {
                    res.send(true);
                });
            });
        }
    });
});

//                  ******************** управление пользователями ***********************


//                  ******************** проекты ***********************

// type 1 = интерьеры
// type 2 = проекты
router.post('/admin/projects/new_project', function (req, res) {
    async.waterfall([
        function(callback) {
            knexSQL().select().from('projects').where({mark: req.body.mark}).then(function (result) {
                if (result.length == 0) {
                    callback(null);
                } else {
                    res.send({check: false});
                }
            });
        }, function (callback) {
            if (req.body.type == 1){
                knexSQL('projects').insert({
                    mark: req.body.mark, name: req.body.name, price: req.body.price, space: req.body.space,number_room: req.body.number_room, type_id: req.body.type
                }).returning('id').then(function (check) {
                    if (check.length == 0){
                        res.send({check: false});
                    } else {
                        res.send({id: check, check:true});
                    }
                });
            } else {
                callback(null);
            }
        }
    ], function(err){
        knexSQL('projects').insert({
            mark: req.body.mark, name: req.body.name, price: req.body.price, space: req.body.space,
            number_room: req.body.number_room, type_id: req.body.type, material: req.body.material
        }).returning('id').then(function (check) {
            if (check.length == 0){
                res.send({check: false});
            } else {
                res.send({id: check, check:true});
            }
        });
    });
});

var projectOffset; // индекс первого проекта, необходимого для следующей выгрузки
var interiorsOffset; // индекс первого интерьера, необходимого для следующей выгрузки
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.

// выгрузка первой пачки проектов
router.get('/admin/projects/', function (req, res) {
    projectOffset = 0;
    interiorsOffset = 0;
    count = 12;

    async.waterfall([
        function(callback){
            knexSQL('projects').select().where({type_id: 2}).limit(count).offset(projectOffset).then(function (projects){
                if (!projects) { res.send(500); }
                else {
                    callback (null, projects); }
            });
        }, function (projects, callback){
            knexSQL('projects').select().where({type_id: 1}).limit(count).offset(interiorsOffset).then(function (interiors) {
                if (!interiors) { res.send(500);}
                else { callback(null, projects, interiors); }
            });
        }
    ], function(err, projects,interiors, type){
            interiorsOffset += count;
            projectOffset += count;
            res.render('adminView/projects.ejs', {
                title: "Проекты/Интерьеры",
                projects: projects,
                interiors: interiors,
                type: type
            });
    });
});

// для ajax-запросов на подгрузку следующей пачки проектов
router.get('/admin/projects/load_projects', function (req, res) {
    console.log('projects');
    knexSQL('projects').select().where({type_id: 2}).limit(count).offset(projectOffset).then(function (loaded) {
        if (!loaded){ res.send(500); }
        else {
            projectOffset += count;
            res.send(loaded);
        }
    });
});

// для ajax-запросов на подгрузку следующей пачки интерьеров
router.get('/admin/projects/load_interiors', function (req, res) {
    knexSQL('projects').select().where({type_id: 1}).limit(count).offset(interiorsOffset).then(function (loaded) {
        if (!loaded){ res.send(500); }
        else {
            interiorsOffset += count;
            res.send(loaded);
        }
    });
});

router.delete('/admin/projects/delete', function(req, res){
    knexSQL('projects').where('id', req.body.id).del().then(function (check) {
        if (!check) { res.send(false); }
        else { res.send(true); }
    });
});

module.exports = router;