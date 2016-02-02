var express = require('express');
var router = express.Router();

/* ======= index.ejs (Главная) ======= */
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

// Get photo info
router.get('/get_project_information', function(req, res){
   knexSQL('images').select().where({projects_id:  req.query.id})
       .join('type_images', 'type_images.id', 'images.type_images_id')
       .then(function(images){
           res.send(images);
   });
});



/* ===== Project.ejs (Проекты/Ландшафты/Интерьеры) ===== */
var allProjects; // массив выгруженных объектов
var filtered; // массив выгруженных объектов
var projType; // тип выгружамых проектов
var offset; // индекс первого проекта, необходимого для следующей выгрузки
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.

// выгрузка очередной пачки проектов 
// (с учетом последнего фильтра)
function nextPack(){
    
    var begin = offset;
    var end = offset + count;
    var pack = filtered.slice(begin, end);
    offset += count;
    return pack;
}

// выгрузка с фильтром
function useFilter(name, price, space, rooms, material) {
    
    filtered = allProjects;
    if (!!name) {
        filtered = filtered.filter(function (item){ 
            return item.name.toLowerCase().indexOf(name.toLowerCase()) > -1; 
        });
    }
    if (!!rooms) {
        var items = rooms.split(',');
        filtered = filtered.filter(function (item){ 
            return items.indexOf(item.number_room + "") > -1; 
        });
    }
    if (!!material) {
        var items = material.split(',');
        filtered = filtered.filter(function (item){ 
            return items.indexOf(item.material) > -1; 
        });
    }
    if (!!price) {
        filtered = filtered.filter(function (item){ 
            return item.price >= price.min && item.price <= price.max; 
        });
    }
    if (!!space) {
        filtered = filtered.filter(function (item){ 
            return item.space >= space.min && item.space <= space.max; 
        });
    }
    offset = 0; // смещение выгружаемых проектов
    count = 12; // кол-во выгружаемых за раз проектов 
}

// render to 'user/project.ejs'
router.get('/view/:projectType', function(req, res){
    
    // Тип выгружаемых проектов
    projType = req.params.projectType;
    if (["projects", "design", "landscape"].indexOf(projType) == -1) { res.send(404); }
    
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: projType})
            .orderBy('favourite', 'desc')
            .then(function (projects) {

                allProjects = projects;
                useFilter(); // применяем пустой фильтр

                res.render('user/project.ejs', {
                    title: "Art object",
                    projects: nextPack()
                });
        });
    });
});

// ---ajax--- get price and space bounds & all distinct number_rooms and materials
router.post('/view/getBounds', function(req, res){
            
    var pMin, pMax, sMin, sMax;
    knexSQL('projects') // min price require
        .min('price')
        .join('type', 'type.id', 'projects.type_id')
        .where('type', projType)
        .then(function(price){
        
        for(var min in price[0]) { pMin = price[0][min]; break; }
        
        knexSQL('projects') // max price require
            .max('price')          
            .join('type', 'type.id', 'projects.type_id')
            .where('type', projType)
            .then(function(price){

            for(var max in price[0]) { pMax = price[0][max]; break; }
            
            knexSQL('projects') // min space require
                .min('space') 
                .join('type', 'type.id', 'projects.type_id')
                .where('type', projType)
                .then(function(space){

                for(var min in space[0]) { sMin = space[0][min]; break; }
                
                knexSQL('projects') // max space require
                    .max('space') 
                    .join('type', 'type.id', 'projects.type_id')
                    .where('type', projType)
                    .then(function(space){
                    
                    for(var max in space[0]) { sMax = space[0][max]; break; }
                    
                    knexSQL('projects') // distinct number_room require
                        .distinct('number_room')
                        .select('number_room')
                        .join('type', 'type.id', 'projects.type_id')
                        .where('type', projType)
                        .then(function(dist_rooms){

                        var rooms = dist_rooms.map(function(item){ return item['number_room']; });
                        
                        knexSQL('projects') // distinct materials require
                            .distinct('material')
                            .select('material')
                            .join('type', 'type.id', 'projects.type_id')
                            .where('type', projType)
                            .then(function(materials){

                            var mats = materials.map(function(item){ return item['material']; });
                            
                            res.send({
                                minSpace: sMin,
                                maxSpace: sMax,
                                minPrice: pMin,
                                maxPrice: pMax,
                                materials: mats,
                                rooms: rooms
                            });
                        });
                    });
                }); 
            });
        }); 
    }); 
});

// ---ajax--- use filter
router.post('/view/useFilter', function(req, res){
    
    var use = +req.body.use;
    if (!use) {
        // выгрузка без фильтра
        useFilter();
    } else {
        // установка критериев фильтра
        var namekey = req.body.key;
        var space = { 
            min: req.body.sMin, 
            max: req.body.sMax
        };
        var price = { 
            min: req.body.pMin, 
            max: req.body.pMax
        };
        var rooms = req.body.rooms;
        var material = req.body.mat;

        // выгрузка с фильтром
        useFilter(namekey, price, space, rooms, material);
    }
    res.send(nextPack());
});

// ---ajax--- load next project pack
router.post('/view/loadNext', function(req, res){
    res.send(nextPack());
});

module.exports = router;
