$(function() {

	$(".accordion-item__trigger").click(function() {
		$(this).next(".accordion-item__content").slideToggle(300);
	});

	$(".slider").owlCarousel({
		autoplay: true,
		items: 1,
		loop: true,
		nav: true,
		smartSpeed: 200,
		navText: ['<i class="fas fa-angle-left"></i>', '<i class="fas fa-angle-right"></i>'],
		responsiveClass: true,
		dots: true,
		itemClass: "slide"
	});

	$('.sf-menu li').removeClass('active'); //берём li и удаляем класс active если он у нас есть
	var path = window.location.pathname; // берём текущий pathname, проходимся по всем ссылкам меню
	$('.sf-menu li a').each(function() {
	var href = $(this).attr('href');
	if(path.slice(1).substring(0, href.length) === href) { // если у нас ссылка какого-то пункта совпадает с ссылкой или содержит ссылку, которая у нас здесь в браузере
	$(this).parent('li').addClass('active'); // то мы раздаём родительскому классу li раздаём класс active
} // при помощи (path.slice(1).substring(0, href.length) подсвечивается родительская категория в меню, в которой открыта текущая страница подменю
});

$('.mnu-self li'); //берём li и удаляем класс active если он у нас есть
	var path = window.location.pathname; // берём текущий pathname, проходимся по всем ссылкам меню
	$('.mnu-self li a').each(function() {
	var href = $(this).attr('href');
	if(path === href) { // если у нас ссылка какого-то пункта совпадает с ссылкой или содержит ссылку, которая у нас здесь в браузере
	$(this).parent('li').addClass('active'); // то мы раздаём родительскому классу li раздаём класс active
	}// при помощи (path.slice(1).substring(0, href.length) подсвечивается родительская категория в меню, в которой открыта текущая страница подменю
});

	$(".sf-menu").after("<div id='my-menu'>");
	$(".sf-menu").clone().appendTo("#my-menu");
	$("#my-menu").find("*").attr("style", "");
	$("#my-menu").find("ul").removeClass("sf-menu");
	$("#my-menu").mmenu({
		extensions: [ 'widescreen', 'theme-light', 'pagedim-black', 'fx-menu-slide' ],
		navbar: {
			title: "Меню"
		}
	});

	$(".mobile-mnu").click(function() {
		var mmAPI = $("#my-menu").data( "mmenu" );
		mmAPI.open();
		// var thiss = $(this).find(".toggle-mnu");
		// thiss.toggleClass("on");
		$(".main-mnu").slideToggle();
		return false;
	});

	var api = $("#my-menu").data("mmenu");
	api.bind("closed", function () {
		$(".toggle-mnu").removeClass("on");
	});

	$(".callback").magnificPopup({
		mainClass: 'mfp-zoom-in',
		removalDelay: 100
	});

	$(".service-item h4").equalHeights();
	$(".new-item-text").equalHeights();
	$(".link-item").equalHeights();

	$('.parent-container').magnificPopup({
		mainClass: 'mfp-fade',
		delegate: 'a.new-item-img, a.service-item-image',
		type: 'image',
		gallery: {
			enabled: true,
			navigateByImgClick: true,
			preload: [0,1] // Will preload 0 - before current, and 1 after the current image
		}
		// other options
	});

	
	$('.button-top').click(function(){

		$('html, footer').stop().animate({scrollTop: 0}, 'slow', 'swing');

	});

	// $("body").prognroll({
	// 	height: 3,
	// 	color: "#f9ce20",
	// 	custom: false
	// });


	//E-mail Ajax Send
	$(".ajax-form").submit(function() { 
		var th = $(this);
		$.ajax({
			type: "POST",
			url: "mail.php", 
			data: th.serialize()
		}).done(function() {
			var popup_success = th.closest('.popup-form').find('.success');
			popup_success.fadeIn();
			setTimeout(function() {
				th.trigger("reset");
				popup_success.fadeOut();
				$.magnificPopup.close();
			}, 2000);
		});
		return false;
	});

});
