var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price',
        'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .where({selected: 1})
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .then(function (project) {
                res.render('user/index.ejs', {title: 'Art Object', projects: project});
            })
    });
});

var projectOffset = 0; // индекс первого проекта, необходимого для следующей выгрузки
var interiorsOffset = 0; // индекс первого интерьера, необходимого для следующей выгрузки
var landscapeOffset = 0; // индекс первого ландшафта, необходимого для следующей выгрузки
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.

router.get('/get_project_information', function(req, res){
   knexSQL('images').select().where({projects_id:  req.query.id})
       .join('type_images', 'type_images.id', 'images.type_images_id')
       .then(function(images){
           res.send(images);
   });
});


router.get('/projects', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "projects"})
            .limit(25)
            .offset(projectOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                projectOffset += count;
                res.render('user/project.ejs', {title: 'Art Object', projects: project});
            })
    });
});


router.get('/design', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "design"})
            .limit(25)
            .offset(interiorsOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                interiorsOffset += count;
                res.render('user/project.ejs', {title: 'Art Object', projects: project});
            })
    });
});

router.get('/landscapes', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "landscape"})
            .limit(25)
            .offset(landscapeOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                console.log(project);
                landscapeOffset += count
                res.render('user/project.ejs', {title: 'Art Object', projects: project});
            })
    });
});

router.get('/projects_ajax', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "projects"})
            .limit(25)
            .offset(projectOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                projectOffset += count;
                res.send(project);
            })
    });
});


router.get('/design_ajax', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "design"})
            .limit(25)
            .offset(interiorsOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                interiorsOffset += count;
                res.send(project);
            })
    });
});

router.get('/landscapes_ajax', function(req, res){
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: "landscape"})
            .limit(25)
            .offset(landscapeOffset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                landscapeOffset += count
                res.send(project);
            })
    });
});






module.exports = router;
