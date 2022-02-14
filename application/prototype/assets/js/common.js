$(function() {

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

	$('.sf-menu li').removeClass('active');
	var path = window.location.pathname;
	$('.sf-menu li a').each(function() {
	var href = $(this).attr('href');
	if(path.slice(1).substring(0, href.length) === href) {
	$(this).parent('li').addClass('active');
}
});

$('.mnu-self li');
	var path = window.location.pathname;
	$('.mnu-self li a').each(function() {
	var href = $(this).attr('href');
	if(path === href) {
	$(this).parent('li').addClass('active');
	}
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

  $(".chat-room-question").click(function() {
		$(this).next(".accordion-item__content").slideToggle(300);
	});

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
