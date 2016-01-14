var express = require('express');
var router = express.Router();

// рендеринг на 'View_list.ejs'
router.get('/admin/view_list/', function (req, res) {
    
    knexSQL('projects').select()
        .then(function (projects) {
        
        res.render('adminView/view_list.ejs', {
           title: "Внешний вид",
           projects: projects 
        });
    });
});

//---ajax--- Изменение выбора проектов, отображаемых на главной странице
router.post('/admin/viewList/changeSelection', function(req, res){
    
    var projectId = req.body.id; // id изменяемого проекта
    var selection = req.body.selected ? 1 : 0; // выбор
    
    knexSQL('projects').select()
        .where({id: projectId})
        .update({selected: selection})
        .then(function(data){
        
        res.send(data ? true : 500);
    });
});

module.exports = router;