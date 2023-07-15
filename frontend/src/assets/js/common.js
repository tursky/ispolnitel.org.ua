$(function () {
  $('.slider').owlCarousel({
    autoplay: true,
    items: 1,
    loop: true,
    nav: true,
    smartSpeed: 2000,
    navText: [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"/></svg>',
    ],
    responsiveClass: true,
    dots: true,
    itemClass: 'slide',
  });

  $('.sf-menu li').removeClass('active');
  var path = window.location.pathname;
  $('.sf-menu li a').each(function () {
    var href = $(this).attr('href');
    if (path.slice(1).substring(0, href.length) === href) {
      $(this).parent('li').addClass('active');
    }
  });

  $('.mnu-self li');
  var path = window.location.pathname;
  $('.mnu-self li a').each(function () {
    var href = $(this).attr('href');
    if (path === href) {
      $(this).parent('li').addClass('active');
    }
  });

  $('.sf-menu').after("<div id='my-menu'>");
  $('.sf-menu').clone().appendTo('#my-menu');
  $('#my-menu').find('*').attr('style', '');
  $('#my-menu').find('ul').removeClass('sf-menu');
  $('#my-menu').mmenu({
    extensions: ['widescreen', 'theme-light', 'pagedim-black', 'fx-menu-slide'],
    navbar: {
      title: 'Меню',
    },
  });

  $('.mobile-mnu').click(function () {
    var mmAPI = $('#my-menu').data('mmenu');
    mmAPI.open();
    $('.main-mnu').slideToggle();
    return false;
  });

  var api = $('#my-menu').data('mmenu');
  api.bind('closed', function () {
    $('.toggle-mnu').removeClass('on');
  });

  $('.callback').magnificPopup({
    mainClass: 'mfp-zoom-in',
    removalDelay: 100,
  });

  $('.service-item .title').equalHeights();
  $('.new-item-text').equalHeights();
  $('.link-item').equalHeights();

  $('.chat-room-question').click(function () {
    $(this).next('.accordion-item__content').slideToggle(300);
  });

  $('#comment').emojioneArea({
    pickerPosition: 'bottom',
    search: false,
    placeholder: "",
    filtersPosition: "bottom",
    tones: false,
    buttonTitle: "Щоб швидше вставити емодзі, натисніть TAB",
    autocomplete: false,
    filters: {
      recent : false,
      smileys_people: {
        title: "Смайлики"
      }
    }
  });

  //E-mail Ajax Send
  $('.ajax-form').submit(function () {
    var th = $(this);
    $.ajax({
      type: 'POST',
      url: 'mail.php',
      data: th.serialize(),
    }).done(function () {
      var popup_success = th.closest('.popup-form').find('.success');
      popup_success.fadeIn();
      setTimeout(function () {
        th.trigger('reset');
        popup_success.fadeOut();
        $.magnificPopup.close();
      }, 2000);
    });
    return false;
  });
});
