
$(document).ready(function(){
    $('ul.tabs').tabs();
    $('.modal-trigger').leanModal();
    $('select').material_select();
    $(".button-collapse").sideNav();
});

function tryLoad(){
    var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
    if (Math.floor(scrollBottom) == 0){
        if ($('#designLink').hasClass('active')){
            loadInteriors();
        } else if ($('#projectsLink').hasClass('active')){
            loadProjects();
        } else {
            loadLandscape();
        }
    }
}
// подгрузка по скроллу
window.onscroll = tryLoad;

var project = {id: undefined, name: undefined}
function getProject (projectID, projectName){
    project.id = projectID;
    project.name = projectName;
    deleteProject();
}


// изменение Избранности проекта
function changeFavourite(id, checked, checkedClass, uncheckedClass) {
    $.ajax({
        type:"POST",
        url:'/admin/projects/changeFavourite',
        data: "id="+id+"&checked="+(+checked),
        success: function(data){
            $("#favBtn"+id).removeClass(checked?uncheckedClass:checkedClass);
            $("#favBtn"+id).addClass(checked?checkedClass:uncheckedClass);
            $("#favBtn"+id).attr("onclick", "changeFavourite(" + id +", "+ !checked +", '"+ checkedClass +"', '"+ uncheckedClass + "')");
            console.log($("#favBtn"+id).attr('class'));
        }
    });
}

function deleteProject(id) {
    $.ajax({
        type:"DELETE",
        url:'/admin/projects/delete',
        data: "id="+id,
        success: function(data){
            if (data){
                $('#'+id+"card").remove();
                tryLoad();
                Materialize.toast('Проект/интерьер был упсешно удален', 1000);
            }
        }
    });
}

function avaliable() {
    var type = $("#type").val();
    if (type == 'projects') {
        $('#material').css("display", 'block');
        $('#space').css("display", "block");
        $('#room').css("display", "block");
    } else if (type == 'design') {
        $('#material').css("display", 'none');
        $('#space').css("display", "block");
        $('#room').css("display", "block");
    } else {
        $('#material').css("display", 'none');
        $('#space').css("display", "none");
        $('#room').css("display", "none");
    }
}


function validate (material, type, name, mark, price, space, number_room){
    if (!type){
        Materialize.toast('Выберите тип', 4000);
        return false;
    } else if (type == 'design'){
        if (!name || !mark || !price || !space || !number_room){
            Materialize.toast('Не все поля заполнены.', 4000);
            return false;
        } else if (!$.isNumeric(price) || !$.isNumeric(space) || !$.isNumeric(number_room)) {
            Materialize.toast('Неверный формат полей. Цена, плоащадь, кол-во комнат - число!', 1000);
            return false;
        } else { return true; }
    } else if (type == 'projects') {
        if (!name || !mark || !price || !space || !number_room){
            Materialize.toast('Не все поля заполнены.', 4000);
            return false;
        } else if (!$.isNumeric(price) || !$.isNumeric(space) || !$.isNumeric(number_room)) {
            Materialize.toast('Неверный формат полей. Цена, плоащадь, кол-во комнат - число!', 1000);
            return false;
        } else { return true; }
    } else if (type == 'landscape') {
        if ( !name || !mark || !price){
            Materialize.toast('Не все поля заполнены.', 4000);
            return false;
        } else if (!$.isNumeric(price)) {
            Materialize.toast('Неверный формат полей. Цена, плоащадь, кол-во комнат - число!', 1000);
            return false;
        } else { return true; }
    }
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function addDivs(data, type, images){
    var cardplace, materialDiv, spaceDiv, numberRoomDiv;
    var newcard = "";  // создать новый тег div
    for (var i = 0; i < data.length; i++){
        if (type == 'design'){
            cardplace = document.getElementById("interiors_place");
            materialDiv ="";
            spaceDiv = '<div> <b>Площадь: </b>'+ data[i].space + '</div>';
            numberRoomDiv = '<div> <b>Количество комнат: </b>'+ data[i].number_room +'</div>';
        } else if (type == 'projects') {
            cardplace = document.getElementById("project_place");
            materialDiv = '<div> <b>Материал изделий: </b>' + data[i].material + '</div>';
            spaceDiv = '<div> <b>Площадь: </b>'+ data[i].space + '</div>';
            numberRoomDiv = '<div> <b>Количество комнат: </b>'+ data[i].number_room +'</div>';
        } else {
            cardplace = document.getElementById("landscape_place");
            materialDiv = '';
            spaceDiv = '';
            numberRoomDiv = '';
        }
        
        newcard = '<div class="card" id="'+data[i].id+'card"> ';
        newcard += '<div class="card-image">';
        
        // поиск фотографии, соответствующей проекту
        var pic = images ? images.filter(function (x) { return x.projects_id == data[i].id; })[0] : false;
        var image_name = pic ? "uploaded_files/" + pic.mini_name : "default.jpg";
        
        newcard += '<div class="card-image">';
        newcard += '<img src="/images/' + image_name + '" class="responsive-img"/>';
        newcard += '</div>';
        newcard += '<span class="card-title">'+ data[i].name +'</span>';
        newcard += '</div>';
        newcard += '<ul class="card-action-buttons">';
        newcard += '<li><a href="/admin/projects/' + data[i].id + '" class="btn-floating waves-effect waves-light light-blue accent-2"><i class="material-icons">more_horiz</i></a></li>';
        newcard += '<li><a onclick="deleteProject(' + data[i].id + ')" class="btn-floating waves-effect waves-light red"><i class="material-icons">close</i></a></li>';
        newcard += '</ul>';        
        newcard += '<div class="card-content">';
        newcard += '<div><b>Маркировка: </b>'+ data[i].mark +'</div>';
        newcard += '<div><b>Цена: </b>'+ data[i].price +'</div>';
        newcard +=  spaceDiv;
        newcard +=  numberRoomDiv;
        newcard +=  materialDiv;
        newcard += '</div>';
        newcard += '</div>';
        var card = document.createElement('div');
        card.className = "col s12 m6 l4";
        card.innerHTML = newcard;
        cardplace.appendChild(card);
    }
    $("#material_text").val('')
    $("#type").val('');
    $('[name="name"]').val('');
    $('[name="mark"]').val('');
    $('[name="price"]').val('');
    $('[name="space"]').val('');
    $('[name="number_room"]').val('');
}

function addProject() {
    var material = null;
    var type = $("#type").val();
    var name = $('[name="name"]').val();
    var mark = $('[name="mark"]').val();
    var price = $('[name="price"]').val();
    var space = $('[name="space"]').val();
    var number_room = $('[name="number_room"]').val();

    if (type == 'projects'){ material = $("#material_text").val();}
    var valid = validate(material, type, name, mark, price, space, number_room);
    if (!valid){ return }

    $.ajax({
        type: "POST",
        url: '/admin/projects/new_project',
        data: 'type=' + type + '&name=' + name + '&mark=' + mark + '&price=' + price + '&space=' + space + '&number_room=' + number_room + '&material=' + material,
        success: function (data) {
            if (!data.check) { Materialize.toast('Такая марикровка уже существует.', 4000); }
            else {
                $('#modalAdd').closeModal();
                var dataValid = [{id: data.id, material: material, name: name, mark: mark, price: price, space: space, number_room: number_room}];
                addDivs(dataValid, type);
            }
        }
    });
}

var allInteriorsAreLoaded = false;
var allProjectsAreLoaded = false;
var allLandscapesAreLoaded = false;

function loadInteriors(){
<<<<<<< HEAD
    $.ajax({
        type:"GET",
        url: '/admin/projects/load_interiors/',
        success: function (interiors) {
            if (!interiors){ Materialize.toast('Ошибка', 1000);}
            else {
                addDivs(interiors.loaded, 'design', interiors.images);
=======
    if (!allInteriorsAreLoaded){
        $.ajax({
            type:"GET",
            url: '/admin/projects/load_interiors/',
            success: function (interiors) {
                if (!interiors){ Materialize.toast('Ошибка', 1000);}
                else {
                    allInteriorsAreLoaded = interiors.loaded.length == 0;
                    addDivs(interiors.loaded, 'design', interiors.images);
                }
>>>>>>> kirill
            }
        }); 
    }
}

function loadProjects(){
<<<<<<< HEAD
    $.ajax({
        type:"GET",
        url: '/admin/projects/load_projects/',
        success: function (projects) {
            if (!projects){ Materialize.toast('Невозможно загрузить проекты', 1000);}
            else {
                addDivs(projects.loaded, 'projects', projects.images);
=======
    if (!allProjectsAreLoaded){
        $.ajax({
            type:"GET",
            url: '/admin/projects/load_projects/',
            success: function (projects) {
                if (!projects){ Materialize.toast('Невозможно загрузить проекты', 1000);}
                else {
                    allProjectsAreLoaded = projects.loaded.length == 0;
                    addDivs(projects.loaded, 'projects', projects.images);
                }
>>>>>>> kirill
            }
        });
    }
}

function loadLandscape(){
<<<<<<< HEAD
    $.ajax({
        type:"GET",
        url: '/admin/projects/load_landscape/',
        success: function (landscape) {
            if (!landscape){ Materialize.toast('Невозможно загрузить проекты', 1000);}
            else {
                addDivs(landscape.loaded, 'landscape', landscape.images);
=======
    if (!allLandscapesAreLoaded){
        $.ajax({
            type:"GET",
            url: '/admin/projects/load_landscape/',
            success: function (landscape) {
                if (!landscape){ Materialize.toast('Невозможно загрузить проекты', 1000);}
                else {
                    allLandscapesAreLoaded = landscape.loaded.length == 0;
                    addDivs(landscape.loaded, 'landscape', landscape.images);
                }
>>>>>>> kirill
            }
        });
    }
}