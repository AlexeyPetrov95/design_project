$(document).ready(function () {
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    $(".scrollBottomArrow").on("click", "a", function (event) {                     // скрол по кнопке
        event.preventDefault();
        var id = $(this).attr('href'), top = $(id).offset().top;
        $('body,html').animate({scrollTop: top + 1}, 400);
    });
});

// в row вычисляется куда вставить div с фотографияем (в какую строку) **** возможно требует оптимизации ******
// offset смещение треугольника к карточкам
// оптимизировать, если строка такая же как и была, то не удалить а просто перебить контент
// при ресайзе подгон]ть ли???

function mathForDivPositionAndTraingle (i, length){
    var objectPostition = {row: undefined, offsetTrinagle: undefined}
    if ($(window).width() <= 600) {
        objectPostition.row = i + 1;
        objectPostition.offsetTrinagle = 6;
    } else {
        if ((i + 1) % 3 == 0) { objectPostition.row = i + 1, objectPostition.offsetTrinagle = 10; }
        else {
            objectPostition.row = Math.min(length, ((i + 1) + (3 - ((i + 1) % 3))));
            if (3 - (i + 1) % 3 == 1) { objectPostition.offsetTrinagle = 6; }
            else { objectPostition.offsetTrinagle = 2; }
        }
    }
    return objectPostition;
}

function imageCompare(a, b){
    var types = ['main', 'plan', 'plan1', 'plan2', 'plan3', 'facade', 'view', 'design', 'default'];
    var ta = types.indexOf(a.type);
    var tb = types.indexOf(b.type);

    if (ta < tb) { return -1; }
    else if (ta > tb) { return 1; }
    else { return 0; }
}

// сортировка

function moreInfo(projectId, i, length) {
    var objectPostion = mathForDivPositionAndTraingle(i,length);
    $.ajax({
        type: "GET",
        url: '/get_project_information/',
        data: "id=" + projectId,
        success: function (data) {
            data.sort(imageCompare);
            var miniPhotoSection = '<div id="preview" > <div class="popup-gallery">'
            for (var i = 0; i < data.length; i++) {
                miniPhotoSection += '<div class="divMiniPhoto"> <a href="images/uploaded_files/' + data[i].image_name + '" title="'+ data[i].type_name +'"> <img src="images/uploaded_files/' + data[i].mini_name + '" alt="'+ data[i].type_name +'" style="height: 100px;" class="responsive-img miniImg"/> </a> </div>'
            }
            miniPhotoSection += '</div>';

            if ($('#moreInfoSection').hasClass(objectPostion.row)){
                $("#preview").remove();
                $("#triangleSection").remove();
                $("#moreInfoSection").append( '<div class="col s1 offset-l' + objectPostion.offsetTrinagle + ' offset-m' + objectPostion.offsetTrinagle + ' offset-s'+ objectPostion.offsetTrinagle+ ' triangle" id="triangleSection"> </div> ');
                $("#containerDiv").append(miniPhotoSection);

            } else {
                $("#moreInfoSection").remove();
                $("#" + objectPostion.row).after('<div class="col s12 '+ objectPostion.row + '" id="moreInfoSection" style="clear: both; height: 550px;"> ' +
                    '<div class="col s1 offset-l' + objectPostion.offsetTrinagle + ' offset-m' + objectPostion.offsetTrinagle + ' offset-s'+ objectPostion.offsetTrinagle+ ' triangle" id="triangleSection"> </div>  ' +
                    '<div id="moreInfoAbsoluteSection" class="z-depth-1" style="position: absolute; left: 0; right: 0px;"> ' +
                    '<div id="moreImg" class="right-align"> ' +
                     '<a class="btn-floating right brown lighten-2" onclick="removeBlock()"> <i class="material-icons white-text">close</i> </a>' +
                    '<div class="container" id="containerDiv">' +
                    miniPhotoSection +
                    '</div> ' +
                    '</div> ' +
                    '</div> ' +
                    '</div>');
            }

           // $("#moreInfoSection").fadeIn();
            var top = $("#moreInfoSection").offset().top;
            $('body,html').animate({scrollTop: top - 300}, 300);
            setSize(data.length);
            activateSlider();
        }
    });
}

function removeBlock(){
    $("#moreInfoSection").remove();
}

function setSize(size){
    var loadPhoto = 0;
    $(".miniImg").load(function () {
        loadPhoto++;
        if (loadPhoto == size) {
            var height = $("#moreInfoAbsoluteSection").height();
            $('#moreInfoSection').css("height", height + 20 + 'px');
        }
    });
}

function activateSlider(){
    $('.popup-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Загрузка изображения #%curr%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
            tError: '<a href="%url%">Изображение #%curr%</a> не может быть загружено.',
        }
    });
}

// ********** вынести в css классы !!!!!!!!! ***************
window.onscroll = function () {
    var height = $(window).height();
    var stylesFixed = {
        position: 'fixed',
        background: 'rgba(255, 255, 255, 1)',
        color: 'black'
    }
    if (height < $(window).scrollTop()) {
        $("nav").css(stylesFixed);
        $('nav ul li a').css('color', 'black');
        $('.activeCustom').css('border-bottom', '2px solid black');
        $("nav").addClass("z-depth-1");
        $("nav").addClass("customNavigation");
        $("nav").removeClass("z-depth-0");
    } else if (height > $(window).scrollTop()) {
        $('nav').css('position', 'absolute');
        $('nav ul li a ').css('color', 'white');
        $('.activeCustom').css('border-bottom', '2px solid white');
        $('nav').css('background', 'transparent');
        $("nav").removeClass("customNavigation");
        $("nav").removeClass("z-depth-1");
        $("nav").addClass("z-depth-0");
    }
};

$(window).resize(function () {
    var height = $("#moreInfoAbsoluteSection").height();
    $('#moreInfoSection').css("height", height + 'px');
});