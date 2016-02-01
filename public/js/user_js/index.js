$(document).ready(function () {
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    $(".scrollBottomArrow").on("click", "a", function (event) {                     // скрол по кнопке
        event.preventDefault();
        var id = $(this).attr('href'), top = $(id).offset().top;
        $('body,html').animate({scrollTop: top + 1}, 400);
    });
});

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

