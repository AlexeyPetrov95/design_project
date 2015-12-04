var express = require('express');
var router = express.Router();

router.get('/admin_design', function(req, res){
    res.render('adminView/admin_design.ejs', {title: "Внешний вид"});
});


module.exports = router;
