var express = require('express');
var router = express.Router();
var async = require('async');
var fs = require("fs");
var multiparty = require('multiparty');
var gm = require('gm').subClass({imageMagick: true});

// рендеринг на "project_info.ejs"
router.get('/admin/projects/:id', function(req, res){
    
    // id запрашиваемого проекта
    var projectId = req.params.id;
    
    knexSQL('projects').select()
        .where({id: projectId})
        .then(function(projects){
        
        if (!projects.length) { 
            
            res.send(404); 
            
        }
        else {
            
            // собственно проект
            var project = projects[0];
            
            knexSQL('type').select()
                .where({id: project.type_id})
                .then(function(projectTypes){
                
                // собственно тип проекта
                var projectType = projectTypes[0];
                
                knexSQL('images').select()
                    .where({projects_id: projectId})
                    .then(function(projectPictures){
                    
                    knexSQL('type_images').select()
                        .then(function(imageTypes){
                        
                        res.render('adminView/project_info.ejs', {
                            title: "Редактирование " + projectType.type_name,
                            project: project,
                            type: projectType.type,
                            photos: projectPictures,
                            image_types: imageTypes
                        });
                    });
                });
            });
        }
    });
});

// путь к фотографиям проектов
var uploadDir = 'public/images/uploaded_files/';

//---ajax--- Загрузка фото на сервер
router.post('/admin/projects/uploadPhoto/:proj_id', function(req, res) {
    // создаем форму
    var form = new multiparty.Form();
    var uploadFile = {path: '', type: '', size: 0};
    var maxSize = 10 * 1024 * 1024; //10MB
    var supportMimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    var tempUploadFileName = 'uploadedImage';
    var destImageName = '';
    var destMiniName = '';
    var projectId = req.params.proj_id;
    var errors = [];
    
    // если произошла ошибка
    form.on('error', function(err){
        if(fs.existsSync(uploadFile.path)) {
            //если загружаемый файл существует удаляем его
            fs.unlinkSync(uploadFile.path);
            console.log('error');
        }
    });

    // окончание обработки
    form.on('close', function() {
        //если нет ошибок и все хорошо
        if(!errors.length) {
            async.waterfall([
                
                function (callback) {
                    knexSQL('type_images').select()
                        .where({type: 'default'})
                        .then(function(imageTypes){
                        
                        // тип изображений со значением 'default'
                        var defaultImageType = imageTypes[0];
                        
                        knexSQL('images')
                            .insert({
                                projects_id: projectId, 
                                type_images_id: defaultImageType.id})
                            .returning('id')
                            .then(function(imageId){
                            
                            destImageName = imageId + uploadFile.format;
                            destMiniName = imageId + '_mini' + uploadFile.format;
                            fs.rename(uploadFile.path, uploadDir + destImageName,  function (err) {
                                
                                if (err) { 
                                    
                                    res.send(500); 
                                }
                                
                                callback(null, imageId);
                            });
                        });
                    });
                    
                }, function (imageId, callback){
                    
                        // Получаем размеры изображения
                        gm(uploadDir + destImageName).size(function(err, image){
                            
                            // Получаем ориентацию изображения
                            var isPortrait = image.width < image.height;
                            // Ресайз
                            gm(uploadDir + destImageName)
                                .resize(null, 700)
                                .write(uploadDir + destImageName, function (err) {
                                
                                    if (err) { 
                                        
                                        res.send(500); 
                                    }
                                
                                    // апдейт полей в бд
                                    knexSQL('images').select()
                                        .where({id: imageId})
                                        .update({
                                            image_name: destImageName, 
                                            mini_name: destMiniName, 
                                            orient: isPortrait ? 1 : 0 })
                                        .then(function () {
                                        
                                        callback(null, imageId);
                                    });
                            });
                        });
                    
                }, function (imageId, callback){ 
                
                    // получение размеров изображения после ресайза 
                    gm(uploadDir + destImageName).size(function(err, image) {
                        
                        // кроп (с предстоящим форс-ресайзом если необходимо)
                        gm(uploadDir + destImageName)
                            .gravity('Center')
                            .resize(image.width < 900 ? 900 : null, 700, '!')
                            .crop(900, 700)
                            .write(uploadDir + destMiniName, function (err) {
                            
                                if (err) {
                                    
                                    res.send(500);
                                    
                                } else {
                                    
                                    callback(null, imageId);
                                }
                            })
                    });
                }
                
            ], function(err , imageId){
                
                knexSQL('type_images').select()
                    .then(function (imageTypes) {
                    
                    res.send({
                        photo_id: imageId,
                        filename: destImageName,
                        mini_name: destMiniName,
                        image_types: imageTypes
                    });
                });
            });
        } else {
            
            if(fs.existsSync(uploadFile.path)) {
                //если загружаемый файл существует удаляем его
                fs.unlink(uploadFile.path, function(err){
                    if (err) throw err;
                });
            }
            //сообщаем что все плохо и какие произошли ошибки
            res.send({
                status: 'bad', 
                errors: errors
            });
        }
    });

    // при поступлении файла
    form.on('part', function(part) {
        //читаем его размер в байтах
        uploadFile.size = part.byteCount;
        //читаем его тип
        uploadFile.type = part.headers['content-type'];
        //путь для сохранения файла
        uploadFile.format = part.filename.slice(part.filename.lastIndexOf("."));
        uploadFile.path = uploadDir + tempUploadFileName;
        
        //проверяем размер файла, он не должен быть больше максимального размера
        if (uploadFile.size > maxSize) {
            errors.push('File size is ' + uploadFile.size + '. Limit is' + (maxSize / 1024 / 1024) + 'MB.');
        }

            //проверяем является ли тип поддерживаемым
        if (supportMimeTypes.indexOf(uploadFile.type) == -1) {
            errors.push('Unsupported mimetype ' + uploadFile.type);
        }
            //если нет ошибок то создаем поток для записи файла
        if(errors.length == 0) {
            //читаем его размер в байтах
            var out = fs.createWriteStream(uploadFile.path);
            part.pipe(out);
        } else {
            part.resume();
        }
    });

    // парсим форму
    form.parse(req);
});

//---ajax--- Выгрузка фото (вроде не юзается)
/*
router.post('/admin/projects/load_photo', function(req, res) {
    knexSQL('images').select().where({projects_id: req.body.project_id}).then(function(photos){
        knexSQL('type_images').select().then(function(image_types){
            res.send({files: photos, types: image_types});
        });
    });
}); */

//---ajax--- Изменение типа изображения
router.post('/admin/projects/updatePhoto', function(req, res){
    
    var photoId = req.body.id; // id изображения 
    var selectedTypeName = req.body.type; // выбранный тип
    
    knexSQL('type_images').select()
        .where({type: selectedTypeName})
        .then(function(imageTypes){
        
        var selectedType = imageTypes[0];
        
        knexSQL('images').select()
            .where({id: photoId})
            .update({type_images_id: selectedType.id})
            .then(function(){
            
            res.send(true);
        });
    });
});

//---ajax--- Удаление изображения
router.post('/admin/projects/deletePhoto', function(req, res){
    
    var imageId = req.body.id; // id удаляемого изображения
    
    knexSQL('images').select()
        .where({id: imageId})
        .then(function(images){
        
        // удаляемое изображение
        var deletedImage = images[0];
        
        fs.unlink(uploadDir + deletedImage.image_name, function(err){
            
            if (err) { 
                
                throw err; 
                res.send(500); 
            }
            
            fs.unlink(uploadDir + deletedImage.mini_name, function(err){
                
                if (err) {    
                    
                    throw err; 
                    res.send(500);
                }
                
                knexSQL('images').select()
                    .where({id: imageId})
                    .del()
                    .then(function(data){
                    
                    res.send(true);
                });
            });
        });
    });
});


module.exports = router;