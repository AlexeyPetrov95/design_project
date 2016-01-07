var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price',
        'projects.space','projects.number_room','projects.description','images.mini_name', 'type.type')
            .where({selected: 1})
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .then(function (project) {
                res.render('user/index.ejs', {title: 'Art Object', projects: project});
            })
    });
});

router.get('/get_project_information', function(req, res){
   knexSQL('images').select().where({projects_id:  req.query.id})
       .join('type_images', 'type_images.id', 'images.type_images_id')
       .then(function(images){
           res.send(images);
   });
});

module.exports = router;
