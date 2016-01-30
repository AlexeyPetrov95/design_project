var express = require('express');
var router = express.Router();
var async = require('async');
var fs = require("fs");

var projectOffset; // индекс первого проекта, необходимого для следующей выгрузки
var interiorsOffset; // индекс первого интерьера, необходимого для следующей выгрузки
var landscapeOffset; // индекс первого ландшафта, необходимого для следующей выгрузки
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.

// рендеринг на 'projects.ejs'
router.get('/admin/projects/', function (req, res) {
    
        projectOffset = 0;
        interiorsOffset = 0;
        landscapeOffset = 0;
        count = 6;
    
        async.waterfall([
            function (callback) {
                
                knexSQL('type').select()
                    .where({type: 'projects'})
                    .then(function(type){
                    
                    // выгрузка проектов
                    var projectType = type[0];
                    knexSQL('projects').select()
                        .where({type_id:  projectType.id})
                        .limit(count)
                        .offset(projectOffset)
                        .then(function (projects) {
                        
                        if (!projects) {
                            
                            res.send(500);
                            
                        }
                        else {
                            
                            callback(null, projects);
                        }
                    });
                })
                
            }, function (projects, callback) {
                
                knexSQL('type').select()
                    .where({type: 'design'})
                    .then(function(type){
                    
                    // выгрузка интерьеров
                    var interiorType = type[0];
                    knexSQL('projects').select()
                        .where({type_id: interiorType.id})
                        .limit(count)
                        .offset(interiorsOffset)
                        .then(function (interiors) {
                        
                        if (!interiors) {
                            
                            res.send(500);
                        }
                        else {
                            
                            callback(null, projects, interiors);
                        }
                    });
                });
                
            }, function (projects, interiors, callback){
                
                // выгрузка главных фотографий проектов
                knexSQL('type_images').select()
                    .where({type: 'main'})
                    .then(function(mainType){
                    
                    knexSQL('images').select()
                        .where({type_images_id: mainType[0].id})
                        .then(function(photos) {
                        
                        if (!photos) {
                            
                            res.send(500);
                            
                        } else {
                            
                            callback(null, photos, projects, interiors);
                        }
                    });
                });
            }, function (photos, projects, interiors, callback){
                

                knexSQL('type').select()
                    .where({type: 'landscape'})
                    .then(function(type) {
                        var landscapeType = type[0];
                        knexSQL('projects').select()
                            .where({type_id: landscapeType.id})
                            .limit(count)
                            .offset(landscapeOffset)
                            .then(function(landscape){

                            if (!landscape) {

                                res.send(500);

                            } else {

                                callback(null, photos, projects, interiors, landscape);

                            }
                        });
                });
            }
            
        ], function (err, photos, projects, interiors, landscape) {
            
            interiorsOffset += count;
            projectOffset += count;
            landscapeOffset += count;
            
            knexSQL('type').select()
                .then (function (type) {
                
                res.render('adminView/projects.ejs', {
                    
                    title: "Проекты/Интерьеры/Ландшафты",
                    projects: projects,
                    interiors: interiors,
                    landscape: landscape,
                    pictures: photos,
                    type: type
                });
            });
        });
});

//---ajax--- Добавление нового проекта
router.post('/admin/projects/new_project', function (req, res) {
    
    knexSQL().select()
        .from('projects')
        .where({mark: req.body.mark})
        .then(function (result) {
        
        if (!result.length) {
            
            knexSQL('type').select()
                .where({type: req.body.type})
                .then(function (type) {
                
                knexSQL('projects')
                    .insert({
                        name: req.body.name,
                        mark: req.body.mark,  
                        price: req.body.price, 
                        space: req.body.space,
                        number_room: req.body.number_room, 
                        type_id: type[0].id, 
                        material: req.body.material})
                    .returning('id')
                    .then(function (insertedProjectId) {
                    
                    res.send(insertedProjectId.length 
                             ? {id: insertedProjectId, check: true} 
                             : {check: false});
                });
            });
            
        } else { 
            
            res.send({check: false}); 
        }
    });
});

//---ajax--- Изменение проекта
router.post('/admin/projects/replaceProject', function(req, res) {
    knexSQL('projects').select()
        .where({id: req.body.id})
        .update({
            name: req.body.name,
            mark: req.body.mark,
            number_room: req.body.rooms,
            price: req.body.price,
            material: req.body.material,
            space: req.body.space,
            description: req.body.description })
        .then(function(result) { 
        
        res.send(true); 
    });
});

//---ajax--- Изменение избранных проектов
router.post('/admin/projects/changeFavourite', function (req, res){
   
    var checked = req.body.checked;
    var id = req.body.id;
    
    knexSQL('projects').select()
        .where({id: id})
        .update({ favourite: checked })
        .then(function(result) { 
        
        console.log(id + ": changed favourite to " + checked);
        res.send(200); 
    });
});

//---ajax--- Удаление проекта
router.delete('/admin/projects/delete', function(req, res){
    
    // путь к фотографиям проектов
    var uploadDir = 'public/images/uploaded_files/';
    
    knexSQL('images')
        .where({projects_id: req.body.id})
        .then(function (images) {
        
        // удаление всех фотографий проекта
        for (var i = 0; i < images.length; i++){
            fs.unlinkSync(uploadDir+ images[i].image_name); // асинхронный !
            fs.unlinkSync(uploadDir + images[i].mini_name); // асинхронный !
        }
        
        knexSQL('images')
            .where({projects_id: req.body.id})
            .del()
            .then(function(){
            
            knexSQL('projects')
                .where('id', req.body.id)
                .then(function(project) {
                
                // id типа удаляемого проекта
                var projectTypeId = project[0].type_id;
                knexSQL('type')
                    .where('id', projectTypeId)
                    .then(function(projectType){
                    
                    // тип удаляемого проекта
                    var projectTypeName = projectType[0].type;
                    knexSQL('projects')
                        .where('id', req.body.id)
                        .del()
                        .then(function (success) {

                            if (!success) { res.send(false); }
                            else {                                 
                                // декремент смещения выбора проектов
                                if (projectTypeName == "design"){ interiorsOffset--; }
                                else if (projectTypeName == "landscape"){ landscapeOffset--; }
                                else { projectOffset--; }
                                res.send(true); 
                            }
                    });
                });
            });
        });
    });
});

//---ajax--- Подгрузка следующей пачки проектов
router.get('/admin/projects/load_projects', function (req, res) {
    
    knexSQL('type').select()
        .where({type: 'projects'})
        .then(function (types) {
        
        var projectType = types[0];
        knexSQL('projects').select()
           .where({type_id: projectType.id})
           .limit(count)
           .offset(projectOffset)
           .then(function (loaded) {
           
           if (!loaded){ 
               
               res.send(500); 
               
           } else {
               
                var loadedId = [];
                for (var i in loaded) { loadedId.push(loaded[i].id) }
               
               projectOffset += count;
               
               // выгрузка главных фотографий выгруженных проектов
               knexSQL('type_images').select()
                    .where({type: 'main'})
                    .then(function(mainType){

                    knexSQL('images').select()
                        .where({type_images_id: mainType[0].id})
                        .whereIn('projects_id', loadedId)
                        .then(function(photos) {

                        if (!photos) {

                            res.send(500);

                        } else {

                            res.send({loaded: loaded, images: photos});
                        }
                    });
               });  
           }
       });
   });
});

//---ajax--- Подгрузка следующей пачки ландшафтов
router.get('/admin/projects/load_landscape', function (req, res) {
    
    knexSQL('type').select()
        .where({type: 'landscape'})
        .then(function (types) {

        var landscapeType = types[0];
        knexSQL('projects').select()
           .where({type_id: landscapeType.id})
           .limit(count)
           .offset(landscapeOffset)
           .then(function (loaded) {

           if (!loaded){ 

               res.send(500); 

           } else {
               
               var loadedId = [];
               for (var i in loaded) { loadedId.push(loaded[i].id) }
               
               landscapeOffset += count;
               
               // выгрузка главных фотографий выгруженных проектов
               knexSQL('type_images').select()
                    .where({type: 'main'})
                    .then(function(mainType){

                    knexSQL('images').select()
                        .where({type_images_id: mainType[0].id})
                        .whereIn('projects_id', loadedId)
                        .then(function(photos) {

                        if (!photos) {

                            res.send(500);

                        } else {

                            res.send({loaded: loaded, images: photos});
                        }
                    });
               });               
           }
       });
    });
});

//---ajax--- Подгрузка следующей пачки интерьеров
router.get('/admin/projects/load_interiors', function (req, res) {
    knexSQL('type').select()
        .where({type: 'design'})
        .then(function (types) {
        
        var designType = types[0];
        knexSQL('projects').select()
            .where({type_id: designType.id})
            .limit(count)
            .offset(interiorsOffset)
            .then(function (loaded) {
            
            if (!loaded) { 
                
                res.send(500); 
                
            } else {
                
                var loadedId = [];
                for (var i in loaded) { loadedId.push(loaded[i].id) }
               
               interiorsOffset += count;
               
               // выгрузка главных фотографий выгруженных проектов
               knexSQL('type_images').select()
                    .where({type: 'main'})
                    .then(function(mainType){

                    knexSQL('images').select()
                        .where({type_images_id: mainType[0].id})
                        .whereIn('projects_id', loadedId)
                        .then(function(photos) {

                        if (!photos) {

                            res.send(500);

                        } else {

                            res.send({loaded: loaded, images: photos});
                        }
                    });
               });  
            }
        });
    })
});

module.exports = router;