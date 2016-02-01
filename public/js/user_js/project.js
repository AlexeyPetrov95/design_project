var sMin, sMax, pMin, pMax;
var currentIndex = 0;
var allProjectsAreLoaded = false;

// Слайдер по площади
function initSpaceSlider(){

    var spaceSlider = document.getElementById('space');
    noUiSlider.create(spaceSlider, {
        range: {
            'min': sMin,
            'max': sMax
        },
        start: [sMin, sMax],
        connect: true,
        step: 1
    });
    spaceSlider.noUiSlider.on('update', function( values, handle ) {
        var value = values[handle];
        if ( handle ) { sMax = value; } else { sMin = value; }
    });
}

// Слайдер для цены
function initPriceSlider(){
    
    var priceSlider = document.getElementById('price');
    noUiSlider.create(priceSlider, {
        range: {
            'min': pMin,
            'max': pMax
        },
        start: [pMin, pMax],
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
            
            sMin = bounds.minSpace;
            sMax = bounds.maxSpace;
            pMin = bounds.minPrice;
            pMax = bounds.maxPrice;
            
            initPriceSlider(); // установка priceSlider с диапазоном [pMin; pMax]
            initSpaceSlider(); // установка spaceSlider с диапазоном [sMin; sMax]

            // Заполнение combobox с кол-вом комнат 
            bounds.rooms.sort(function (a, b){
                if (+a < +b) { return -1; }
                else if (+a > +b) { return 1; }
                else { return 0; }
            }).forEach(function(item, i, arr){
                $('#rooms')
                    .append($("<option></option>")
                    .attr("value",item)
                    .text(item)); 
            });

            // Заполнение combobox с материалами
            bounds.materials.sort().forEach(function(item, i, arr){
                $('#mats').append(
                    $("<option></option>").attr("value",item).text(item)
                ); 
            });

            $('select').material_select();
        }
    });
});

// очистить блок с проектами
function Reset(){
    $("#cards_container").empty();
    currentIndex = 0;
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
    search();
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
    var rooms = $("#rooms").val();
    var mat = $("#mats").val();

    //var foo = []; 
    //$('#mats :selected').each(function(i, selected){ 
    //  foo[i] = $(selected).text();  <-- возвращает лишние пункты!
    //});
    //console.log(foo);

    $.ajax({
        type: "POST",
        url: '/view/filter' + (switchOn ? 'Enable' : 'Disable'),
        data: (switchOn ? ('sMin=' + sMin + '&sMax=' + sMax + '&pMin=' + pMin + '&pMax=' + pMax 
            + (rooms != "" ? '&rooms=' + rooms : "") + (mat != "" ? '&mat=' + mat : "")) : ''),
        success: function (projects) {
            
            alert(projects.length);
            if (!projects){ Materialize.toast('Ошибка', 1000);}
            else {
                allProjectsAreLoaded = projects.length == 0;
                Reset();
                addDivs(projects);
            }
        }
    }); 
};

function search(){
    var key = $(".search>input").val();
    $("#cards_container>div").each(function(i, item){
        var name = $(item).children().children().children(".card-title").text();
        var acceptable = name.indexOf(key) > -1;
        $(item).css('display', acceptable ? 'block' : 'none');
    });
}

$(".search>input").on('keyup', search);
window.onscroll = tryLoad;