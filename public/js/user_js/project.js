var sMin, sMax, pMin, pMax;
var defsmin, defsmax, defpmin, defpmax;
var rooms, materials;
var currentIndex = 0;
var allProjectsAreLoaded = false;

// Слайдер по площади
function initSpaceSlider(smin, smax){

    var spaceSlider = document.getElementById('space');
    noUiSlider.create(spaceSlider, {
        range: {
            'min': smin,
            'max': smax
        },
        start: [smin, smax],
        connect: true,
        step: 1
    });
    spaceSlider.noUiSlider.on('update', function( values, handle ) {
        var value = values[handle];
        if ( handle ) { sMax = value; } else { sMin = value; }
    });
}

// Слайдер для цены
function initPriceSlider(pmin, pmax){
    
    var priceSlider = document.getElementById('price');
    noUiSlider.create(priceSlider, {
        range: {
            'min': pmin,
            'max': pmax
        },
        start: [pmin, pmax],
        connect: true,
        step: 1
    });
    priceSlider.noUiSlider.on('update', function( values, handle ) {
        var value = values[handle];
        if ( handle ) { pMax = value; } else { pMin = value; }
    });    
}

$(document).ready(function(){
    
    $.ajax({
        type: "POST",
        url: '/view/getBounds/',
        success: function (bounds) {
            
            defsmin = bounds.minSpace;
            defsmax = bounds.maxSpace;
            defpmin = bounds.minPrice;
            defpmax = bounds.maxPrice;
            
            initPriceSlider(defpmin, defpmax); // установка priceSlider с диапазоном [pMin; pMax]
            initSpaceSlider(defsmin, defsmax); // установка spaceSlider с диапазоном [sMin; sMax]

            rooms = bounds.rooms.sort(function (a, b){
                if (+a < +b) { return -1; }
                else if (+a > +b) { return 1; }
                else { return 0; }
            });
            materials = bounds.materials.sort();

            // Заполнение combobox с кол-вом комнат 
            rooms.forEach(function(item, i, arr){
                $('#rooms')
                    .append($("<option></option>")
                    .attr("value",item)
                    .text(item)); 
            });

            // Заполнение combobox с материалами
            materials.forEach(function(item, i, arr){
                $('#mats').append(
                    $("<option></option>").attr("value",item).text(item)
                ); 
            });

            $('select').material_select();
        }
    });
});

// очистить блок с проектами
function ClearBox(){
    $("#cards_container").empty();
    currentIndex = 0;
}

// Сбсросить фильтр
function resetFilter(){
    // reset search
    $(".search>input").val("");

    // reset price and space sliders
    var priceSlider = document.getElementById('price');
    priceSlider.noUiSlider.set([defpmin, defpmax]);
    var spaceSlider = document.getElementById('space');
    spaceSlider.noUiSlider.set([defsmin, defsmax]);

    $('select').material_select("destroy");

    // reset number rooms
    $('#rooms').empty();
    $('#rooms')
        .append($("<option></option>")
        .attr("value", "")
        .attr("disabled", "")
        .text("Любой вариант"));   
    rooms.forEach(function(item, i, arr){
        $('#rooms')
            .append($("<option></option>")
            .attr("value",item)
            .text(item)); 
    });

    // reset materials
    $('#mats').empty();
    $('#mats')
        .append($("<option></option>")
        .attr("value", "")
        .attr("disabled", "")
        .text("Любой вариант")); 
    materials.forEach(function(item, i, arr){
        $('#mats').append(
            $("<option></option>").attr("value",item).text(item)
        ); 
    });

    $('select').material_select();
}

// добавить новые проекты в блок
function addDivs(projects){
    var currentLength = currentIndex + projects.length;
    for (var i = 0; i < projects.length; i++, currentIndex++){
        var newCard = document.createElement('div');
        newCard.setAttribute('id', currentIndex + 1);
        newCard.setAttribute('class', "col s12 m4 l4");
        var newCardHTML = '<div class="card waves-light waves-effect waves-block" onclick="moreInfo('+ projects[i].id + ', '  + currentIndex + ', ' + currentLength + ')">';
        newCardHTML += '<div class="card-image">';
        newCardHTML += '<img src="/images/uploaded_files/' + projects[i].mini_name + '" class="responsive-img"/>';
        newCardHTML += '<span class="card-title">' + projects[i].name + '</span>';
        newCardHTML += '</div>';
        newCardHTML += '<ul class="card-action-buttons">';
        newCardHTML += '<li><a onclick="moreInfo(' + projects[i].id + ', ' + i + ', ' + projects.length + ')" class="btn-floating waves-effect waves-light brown lighten-2"><i class="material-icons">more_horiz</i></a></li>'
        newCardHTML += '</ul>';
        newCardHTML += '<div class="card-content">';
        if(projects[i].type == 'design') {
            newCardHTML += '<div><b>Площадь: </b> ' + projects[i].space + ' </div>';
            newCardHTML += '<div><b>Количество комнат: </b> ' + projects[i].number_room + ' </div>';
        } else if (projects[i].type == 'projects') { 
            newCardHTML += '<div><b>Площадь: </b> ' + projects[i].space + ' </div>';
            newCardHTML += '<div><b>Количество комнат: </b> ' + projects[i].number_room + ' </div>';
            newCardHTML += '<div><b>Материал изделий: </b> ' + projects[i].material + ' </div>';
        }
        newCardHTML += '<div><b>Цена: </b> ' + projects[i].price + ' руб.</div>';
        newCardHTML += '</div>';
        newCardHTML += '</div>';
        newCard.innerHTML = newCardHTML;
        document.getElementById("cards_container").appendChild(newCard);
    }
}

// подгрузка по скроллу
function tryLoad(){
    if (!allProjectsAreLoaded){
        var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
        if (Math.floor(scrollBottom) == 0){
            $.ajax({
                type: "POST",
                url: '/view/loadNext/',
                success: function (projects) {
                    if (!projects){ Materialize.toast('Ошибка', 1000);}
                    else {
                        allProjectsAreLoaded = projects.length == 0;
                        addDivs(projects);
                    }
                }
            }); 
        }
    }
}

// Применение/отмена фильтра
function filterSwitch(switchOn){
    var key = $(".search>input").val();
    var rooms = []; 
    var mats = []; 
    if (switchOn) {
        $('#rooms')
            .prev()
                .find("li.active")
                .each(function(i, selected){ 
                    rooms[i] = $(selected).text(); 
                });
        $('#mats')
            .prev()
                .find("li.active")
                .each(function(i, selected){ 
                    mats[i] = $(selected).text(); 
                });
    }
    $.ajax({
        type: "POST",
        url: '/view/useFilter',
        data: 'use=' + (+switchOn) + (switchOn ? ('&sMin=' + sMin + '&sMax=' + sMax + '&pMin=' + pMin + '&pMax=' + pMax 
            + (rooms != "" ? '&rooms=' + rooms : "") + (mats != "" ? '&mat=' + mats : "") + '&key=' + key) : ''),
        success: function (projects) {
            
            if (!projects){ Materialize.toast('Ошибка', 1000);}
            else {
                allProjectsAreLoaded = projects.length == 0;
                ClearBox();
                addDivs(projects);
            }
        }
    }); 
};

function search(){
    $("#cards_container>div").each(function(i, item){
        var name = $(item).children().children().children(".card-title").text();
        var acceptable = name.indexOf(key) > -1;
        $(item).css('display', acceptable ? 'block' : 'none');
    });
}

//$(".search>input").change(filterSwitch(true));
window.onscroll = tryLoad;