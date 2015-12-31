var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');
var async = require('async');
var fs = require("fs");
var multiparty = require('multiparty');
var gm = require('gm').subClass({imageMagick: true});

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

// сделать по типам !!!!
router.post('/admin/projects/new_project', function (req, res) {
    knexSQL().select().from('projects').where({mark: req.body.mark}).then(function (result) {
        if (result.length != 0) { res.send({check: false}); }
        else {
            knexSQL().select().from('type').where({type: req.body.type}).then(function (type) {
                console.log(type);
                knexSQL('projects').insert({
                    mark: req.body.mark, name: req.body.name, price: req.body.price, space: req.body.space,
                    number_room: req.body.number_room, type_id: type[0].id, material: req.body.material
                }).returning('id').then(function (check) {
                    if (check.length == 0) {
                        res.send({check: false});
                    } else {
                        res.send({id: check, check: true});
                    }
                });
            });
        }
    });
});

router.post('/admin/projects/replace_project', function(req, res) {
    knexSQL('projects').select().where({id: req.body.id}).update({
        name: req.body.name,
        mark: req.body.mark,
        number_room: req.body.number_room,
        price: req.body.price,
        material: req.body.material,
        space: req.body.space,
        description: req.body.description }).then(function(result) { res.send(true); });
});

router.post('/admin/projects/upload_photo/:proj_id', function(req, res) {
    // создаем форму
    var form = new multiparty.Form();
    var uploadFile = {path: '', type: '', size: 0};
    var maxSize = 10 * 1024 * 1024; //10MB
    var supportMimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    var errors = [];
    var uploadDir = 'public/images/uploaded_files/'
    var prefix = 'uploaded';

    //если произошла ошибка
    form.on('error', function(err){
        if(fs.existsSync(uploadFile.path)) {
            //если загружаемый файл существует удаляем его
            fs.unlinkSync(uploadFile.path);
            console.log('error');
        }
    });

    form.on('close', function() {
        //если нет ошибок и все хорошо
        if(errors.length == 0) {
            knexSQL('images').insert({projects_id: req.params.proj_id}).returning('id').then(function (id) {
                // апдейт имени нового изображения и ренейм файла на серве
                knexSQL('images').select().where({id: id}).update({image_name: id + uploadFile.format}).then(function () {
                    fs.renameSync(uploadFile.path, uploadDir + id + uploadFile.format);
                    knexSQL('type_images').select().then(function(imgtypes){
                        res.send({photo_id : id, filename: id + uploadFile.format, image_types : imgtypes});
                    });
                    gm(uploadDir+id+uploadFile.format)
                        .resize(900, 600)
                        .write(uploadDir+id+uploadFile.format, function (err) {
                            if (err) console.log(err);
                            else {
                                knexSQL('type_images').select().then(function(imgtypes){
                                    res.send({photo_id : id, filename: id + uploadFile.format, image_types : imgtypes});
                                });
                            }
                        });
                });
            });
        }
        else {
            if(fs.existsSync(uploadFile.path)) {
                //если загружаемый файл существует удаляем его
                fs.unlinkSync(uploadFile.path);
            }
            //сообщаем что все плохо и какие произошли ошибки
            res.send({status: 'bad', errors: errors});
        }
    });

    // при поступление файла
    form.on('part', function(part) {
        //читаем его размер в байтах

        uploadFile.size = part.byteCount;
        //читаем его тип
        uploadFile.type = part.headers['content-type'];
        //путь для сохранения файла
        uploadFile.format = part.filename.slice(part.filename.lastIndexOf("."));
        uploadFile.path = uploadDir + prefix;

        //проверяем размер файла, он не должен быть больше максимального размера
        if (uploadFile.size > maxSize) {
            console.log('i am heree bich');
            errors.push('File size is ' + uploadFile.size + '. Limit is' + (maxSize / 1024 / 1024) + 'MB.');
        }

            //проверяем является ли тип поддерживаемым
        if (supportMimeTypes.indexOf(uploadFile.type) == -1) {
            errors.push('Unsupported mimetype ' + uploadFile.type);
        }
            //если нет ошибок то создаем поток для записи файла
        if(errors.length == 0) {
            // gm(uploadFile.path).compress('jpeg');
            var out = fs.createWriteStream(uploadFile.path);
            part.pipe(out);
        } else {
            part.resume();
        }
    });

    // парсим форму
    form.parse(req);
});

router.post('/admin/projects/load_photo', function(req, res) {
    knexSQL('images').select().where({projects_id: req.body.project_id}).then(function(photos){
        knexSQL('type_images').select().then(function(image_types){
            res.send({files: photos, types: image_types});
        });
    });
});

router.post('/admin/projects/update_photo', function(req, res){
    console.log(req.body.type);
    knexSQL('images').select().where({id: req.body.id}).update({type_images_id: req.body.type}).then(function(){
        res.send(true);
    });
});
router.post('/admin/projects/delete_photo', function(req, res){
    knexSQL('images').select().where({id: req.body.id}).del().then(function(data){
        var path = './public/images/uploaded_files/';
        var files = fs.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            console.log(files[i]);
            if (files[i].indexOf(req.body.id + '.') == 0) {
                fs.unlinkSync(path + files[i]);
                break;
            }
        }
        res.send(true);
    });
});

var projectOffset; // индекс первого проекта, необходимого для следующей выгрузки
var interiorsOffset; // индекс первого интерьера, необходимого для следующей выгрузки
var landscapeOffset;
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.

// переделать выгрузку по имени а не типу!!!
router.get('/admin/projects/', function (req, res) {
        projectOffset = 0;
        interiorsOffset = 0;
        landscapeOffset = 0;
        count = 12;
        async.waterfall([
            function (callback) {
                knexSQL('type').select().where({type: 'projects'}).then(function(type){
                    knexSQL('projects').select().where({type_id: type[0].id}).limit(count).offset(projectOffset).then(function (projects) {
                        if (!projects) {
                            res.send(500);
                        }
                        else {
                            callback(null, projects);
                        }
                    });
                })
            }, function (projects, callback) {
                knexSQL('type').select().where({type: 'design'}).then(function(type){
                    knexSQL('projects').select().where({type_id: type[0].id}).limit(count).offset(interiorsOffset).then(function (interiors) {
                        if (!interiors) {
                            res.send(500);
                        }
                        else {
                            callback(null, projects, interiors);
                        }
                    });
                });
            }, function (projects, interiors, callback){
                knexSQL('type').select().where({type: 'landscape'}).then(function(type) {

                    knexSQL('projects').select().where({type_id: type.id}).limit(count).offset(landscapeOffset).then(function (landscape) {
                        if (!landscape) {
                            res.send(500);
                        } else {
                            callback(null, projects, interiors, landscape);
                        }
                    });
                });
            }
        ], function (err, projects, interiors, landscape) {
            interiorsOffset += count;
            projectOffset += count;
            landscapeOffset += count;
            knexSQL('type').select().then (function (type) {
                res.render('adminView/projects.ejs', {
                    title: "Проекты/Интерьеры",
                    projects: projects,
                    interiors: interiors,
                    landscape: landscape,
                    type: type
                });
            });
        });
});

// убрать тип наифиг, искать по имени!!!!!

// для ajax-запросов на подгрузку следующей пачки проектов

router.get('/admin/projects/load_projects', function (req, res) {
    knexSQL().select().from('type').where({type: 'projects'}).then(function (type) {
       knexSQL('projects').select().where({type_id: type[0].id}).limit(count).offset(projectOffset).then(function (loaded) {
           if (!loaded){ res.send(500); }
           else {
               projectOffset += count;
               res.send(loaded);
           }
       });
   })
});

router.get('/admin/projects/load_landscape', function (req, res) {
    knexSQL().select().from('type').where({type: 'landscape'}).then(function (type) {
        knexSQL('projects').select().where({type_id: type[0].id}).limit(count).offset(landscapeOffset).then(function (loaded) {
            if (!loaded){ res.send(500); }
            else {
                landscapeOffset += count;
                res.send(loaded);
            }
        });
    })
});

router.get('/admin/projects/load_interiors', function (req, res) {
    knexSQL().select().from('type').where({type: 'design'}).then(function (type) {
        console.log(type);
        knexSQL('projects').select().where({type_id: type[0].id}).limit(count).offset(interiorsOffset).then(function (loaded) {
            if (!loaded){ res.send(500); }
            else {
                interiorsOffset += count;
                res.send(loaded);
            }
        });
    })
});

router.delete('/admin/projects/delete', function(req, res){
    knexSQL('images').where({projects_id: req.body.id}).then(function (images) {
        for (var i = 0; i < images.length; i++){
            fs.unlinkSync('./public/images/uploaded_files/'+ images[i].image_name);
        }
        knexSQL('images').where({projects_id: req.body.id}).del().then(function(x){
            knexSQL('projects').where('id', req.body.id).del().then(function (check) {
                if (!check) { res.send(false); }
                else { res.send(true); }
            });
        });
    });
});

// опыять по имени
router.get('/admin/projects/:id', function(req, res){
    var id = req.params.id;
    knexSQL('projects').select().where({id: id}).then(function(proj){
        if (proj.length == 0) { res.send(404); }
        else {
            knexSQL('type').select().where({id: proj[0].type_id}).then(function(type_name){
                knexSQL('images').select().where({projects_id: id}).then(function(photos){
                    knexSQL('type_images').select().then(function(image_types){
                        res.render('adminView/project_info.ejs', {
                            title: "Редактирование " + type_name[0].name,
                            project: proj[0],
                            photos: photos,
                            image_types: image_types,
                            type: type_name[0].type
                        });
                    });
                });
            });
        }
    });
});


router.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});

//        ******* Внешний вид ********

router.get('/admin/view_list/', function (req, res) {
    knexSQL('type').select().then(function(types){
        knexSQL('projects').select().then(function (projects) {
            res.render('adminView/view_list.ejs', {
               title: "Внешний вид",
               projects: projects,
               types: types
            });
        });
    })
});



module.exports = router;