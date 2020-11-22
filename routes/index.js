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


router.get("/f41d3fdf504e.html", function(req,res){
   res.render("user/f41d3fdf504e.html"); 
});


/* ===== Project.ejs (Проекты/Ландшафты/Интерьеры) ===== */
var projType; // тип выгружамых проектов
var offset; // индекс первого проекта, необходимого для следующей выгрузки
var count; // количество проектов/интерьеров, выгружаемых из базы за один запрос.
var filtered; // флаг активности фильтра  
var sMinFilter; // критерии фильтра
var sMaxFilter;
var pMinFilter;
var pMaxFilter;
var roomsFilter;
var materialFilter;

// выгрузка с фильтром
function filterOn(req, res, callback) {
    
    filtered = true;    
    console.log('mat='+materialFilter);
    console.log('rooms='+roomsFilter);
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: projType})
            .andWhere('number_room', (typeof(roomsFilter) == 'undefined' ? 'not in' : '='), (typeof(roomsFilter) == 'undefined' ? [-1] : roomsFilter))
            .andWhere('material', (typeof(materialFilter) == 'undefined' ? 'not in' : '='), (typeof(materialFilter) == 'undefined' ? [-1] : materialFilter))
            .andWhere('price', '>', pMinFilter - 1)
            .andWhere('price', '<', pMaxFilter + 1)
            .andWhere('space', '>', sMinFilter - 1)
            .andWhere('space', '<', sMaxFilter + 1)
            .limit(count)
            .offset(offset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                offset += count;
                callback(req, res, project);
        });
    });
}

// выгрузка без фильтра
function filterOff(req, res, callback) {
    
    filtered = false;
    knexSQL('type_images').select().where({type: 'main'}).then(function (type_images) {
        knexSQL('projects').select('projects.id as id', 'projects.material','projects.name','projects.price', 'projects.space','projects.number_room','projects.description','images.mini_name','images.image_name', 'type.type', 'images.orient', 'projects.name')
            .join('images', 'projects.id', 'images.projects_id')
            .join('type', 'type.id', 'projects.type_id').as('ignored_alias1')
            .where({type_images_id: type_images[0].id})
            .andWhere({type: projType})
            .limit(count)
            .offset(offset)
            .orderBy('favourite', 'desc')
            .then(function (project) {
                offset += count;
                callback(req, res, project);
        });
    });
}

// function for callback which sending response with first argument
function sendData(req, res, data){ res.send(data); };

// render to 'user/project.ejs'
router.get('/view/:projectType', function(req, res){
    
    // Тип выгружаемых проектов
    projType = req.params.projectType;
    if (["projects", "design", "landscape"].indexOf(projType) < 0) { res.render(404); }
    
    offset = 0; // смещение выгружаемых проектов
    count = 12; // кол-во выгружаемых за раз проектов 
    
    filterOff(req, res, function(req, res, projects){
        res.render('user/project.ejs', {
            title: "Art object",
            projects: projects
        });
    });
});

// get price and space bounds
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
                            
                            console.log("rooms");
                            console.log(rooms);
                            console.log("mats");
                            console.log(mats);
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


// enable filter
router.post('/view/filterEnable', function(req, res){
    
    offset = 0; // смещение выгружаемых проектов
    count = 12; // кол-во выгружаемых за раз проектов 
    
    // установка критериев фильтра
    sMinFilter = req.body.sMin;
    sMaxFilter = req.body.sMax;
    pMinFilter = req.body.pMin;
    pMaxFilter = req.body.pMax;
    roomsFilter = req.body.rooms;
    materialFilter = req.body.mat;
    
    console.log('sMin=' + sMinFilter + '&sMax=' + sMaxFilter + '&pMin=' + pMinFilter + '&pMax=' + pMaxFilter);

    // выгрузка с фильтром
    filterOn(req, res, sendData);
});

// disable filter
router.post('/view/filterDisable', function(req, res){
    
    offset = 0; // смещение выгружаемых проектов
    count = 12; // кол-во выгружаемых за раз проектов 
    
    // выгрузка без фильтра
    filterOff(req, res, sendData);
});

// load next project pack
router.post('/view/loadNext', function(req, res){
    
    if (filtered) {
        // выгрузка без фильтра
        filterOn(req, res, sendData);
    } else {
        // выгрузка без фильтра
        filterOff(req, res, sendData);
    }
});


module.exports = router;
