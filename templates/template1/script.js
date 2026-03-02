function cookieClose() {
var node = document.getElementById("popup_cookie");
	if (node.parentNode) {
		node.parentNode.removeChild(node);
		//Set cookie
		localStorage.setItem('agree_cookie', 'true');
		$('#popup_cookie').fadeOut(400, 'swing');
 
	}	
			}
$(document).ready(function() {
    //Если человек не потдверждал cookie
    if (!localStorage.getItem('agree_cookie')) {
 
  
         $('#popup_cookie').show();


        $("#popup_cookie .close").on("click", function(e) {
            e.preventDefault();
            $("#popup_cookie").fadeOut(function() {

            });
        });

    }
});
function grecaptcha() {
	$('form[data-grecaptcha]').grecaptcha({
		sitekey: '6LdQNtMZAAAAAEDj029KHOStiN4gh91KaIOB0hiS',
        size : 'invisible',
	}).on('submitAjax.grecaptcha', function() {
		// обрабатываем ajax форму
	}).on('error.grecaptcha', function() {
		// событие об ошибке
	}).on('success.grecaptcha', function() {
		// событие об успешной валидации
	});
}



$(document).ready(function () {
    
    $('[data-toggle="tooltip"]').tooltip();
    
	$("body").on('submit', '[data-ajax]', function (e) {
         
		e.preventDefault();
		var form = $(this);
        formData = new FormData(form.get(0));
        formData.append($(form).data('ajax')+'Submit', 1);
		$.ajax({
			data: formData,
			type: "POST",
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (data) {
				form.find('.preloader-holder').hide();
				swal({
					title: data.title,
					text: data.text,
					type: data.type,
					confirmButtonColor: data.color
				});
				if (data.type == 'success') {
					form.trigger( 'reset' );
				}
			}
		});
		return false;
	});	
	
		$("body").on('mouseover click', '.zoom-photo-list .item-photo-holder a', function(e){
		var img=$(this).attr('href');
		$('.zoom-photo-view').find('.item-photo').css('background-image', 'url("'+img+'")').attr('href', img);
		return false;
	});
    function formatStr(str) {
        str = str.replace(/(\.(.*))/g, '');
        var arr = str.split('');
        var str_temp = '';
        if (str.length > 3) {
            for (var i = arr.length - 1, j = 1; i >= 0; i--, j++) {
                str_temp = arr[i] + str_temp;
                if (j % 3 == 0) {
                    str_temp = ' ' + str_temp;
                }
            }
            return str_temp;
        } else {
            return str;
        }
    }

    if ($('.product-materials').length && $('[data-product-area]').length) {
        let dataMaterialPrice,
            dataProductArea = $('[data-product-area]').data('product-area');
        $('.product-materials [data-material-price]').each(function () {
            dataMaterialPrice = $(this).data('material-price');
            $(this).html(formatStr(String(dataMaterialPrice * dataProductArea)));
        });

    }

	/* Компенсация скроллбара при фиксированном body */
    let scrollBarWidth = (screen.width - $(window).width());

    function scrollbarCompensation(bodyFixingElement, bodyFixingElementClass){
        if($(bodyFixingElement).hasClass(bodyFixingElementClass)){
            $('body').css('padding-right', scrollBarWidth);
        } else {
            $('body').css('padding-right', 0);            
        }
    }
    /* Компенсация скроллбара при фиксированном body - end */	
    
    /* Form submit */
    $.mask.definitions['X']='9';
    $('input[type="tel"]').mask('+7 (X99) 999-99-99').on('click', function () {
        if ($(this).val() === '+7 (___) ___-__-__') {
            $(this).get(0).setSelectionRange(4, 4);
        }
    });
// 21.12
    // $('form[data-ajax]').validator().submit(function(e) {
	// 	if (e.isDefaultPrevented()) {
	// 		return false;
	// 	}
	// 	e.preventDefault();
	// 	var $that = $(this);
	// 	var id = $that.data('ajax');
	// 	// console.log(id);
	// 	formData = new FormData($that.get(0));
    //     formData.append('submit' + id, 1);
	// 	$.ajax({
	// 		type: 'POST',
	// 		contentType: false,
	// 		processData: false,
	// 		data: formData,
	// 		success: function(data) { 
    //             // console.log('успешно ' + id);
	// 			var item = $that.find("[type='submit']");
	// 			item.addClass("active");
	// 			setTimeout(function () {
	// 				item.addClass("sent");
    //             }, 1000);
	// 			// item.prop("disabled", true);
	// 			setTimeout(function () {
    //                 $that.find(".form__input").val("");
	// 				item.removeClass("clicked");
	// 			    item.removeClass("active");
	// 				item.removeClass("sent");
    //             }, 4000);
	// 		},
	// 		error: function(data) {
	// 			item.prop("disabled", true).val("Заявка не отправлена");
	// 		}
	// 	});
    // });
    /* Form submit - end */

    /* Form style for input-file  */
    let inputs = document.querySelectorAll('input[type="file"]');
    Array.prototype.forEach.call(inputs, function(input){
    let label	 = input.nextElementSibling,
        labelVal = label.innerHTML;
        input.addEventListener('change', function(e){
            let fileName = '';
            if( this.files && this.files.length > 1 )
            fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
            else
            fileName = e.target.value.split( '\\' ).pop();
                if( fileName )
            label.querySelector( 'span' ).innerHTML = fileName;
            else
            label.innerHTML = labelVal;
        });
    });
    /* Form style for input-file - end */
    
    var portfolioSlider = $('.portfolio-wrapper')
		portfolioSlider.owlCarousel({
			nav: false,
			loop: false,
            lazyLoad : true,
			margin: 10,
			responsiveClass: true,
			responsive: {
				0: {
					items: 1,
				},
				600: {
					items: 2,
				},
				1000: {
					items: 3,
				}
			}
		});
        $('.portfolio-categories > li > a').on('click', function (e) {
			e.preventDefault();
			var filter = $(this).data('filter');
			portfolioSlider.owlcarousel2_filter(filter);
		});

		$('.portfolio-select').on('change', function (e) {
			var filter = $(this).find(':selected').data('filter');
			portfolioSlider.owlcarousel2_filter(filter);
		});



    /* Sliders */
    let sliderContainer;
    function sliderInit(){
        $(sliderContainer).find('.slider__container').addClass('swiper-container');
        $(sliderContainer).find('.slider__wrapper').addClass('swiper-wrapper');
        $(sliderContainer).find('.slider__item').addClass('swiper-slide');
    }

    if($('.popular-slider__wrapper > .shop-item').length > 4) {
        sliderContainer = $('.popular');
        $(sliderContainer).find('.popular-slider__container').addClass('swiper-container');
        $(sliderContainer).find('.popular-slider__wrapper').addClass('swiper-wrapper');
        $(sliderContainer).find('.popular-slider__wrapper > .shop-item').addClass('swiper-slide');

        let popularSwiper = new Swiper('.popular-slider__container', {
            slidesPerView: 4,
            loop: false,
            spaceBetween: 18,
            scrollbar: {
                el: '.swiper-scrollbar',
                hide: false,
            },
            breakpoints: {
                0: {
                    slidesPerView: 2,
                    spaceBetween: 3,
                },
                767: {
                    slidesPerView: 2,
                    spaceBetween: 18,
                },
                991: {
                    slidesPerView: 3,
                },
                1200: {
                    slidesPerView: 4,
                }
            }
        })
    }
    /*$(function() {
        $('.lazy').lazy({
            effect: 'fadeIn',
            visibleOnly: false
        });
    });*/
   setTimeout(function(){ 
    let photogallerySwiper = new Swiper ('.photogallery-tabs__slider', {
        slidesPerView: 3,
        loop: false,
        spaceBetween: 18,
        scrollbar: {
            el: '.swiper-scrollbar',
            hide: false,
            },
        breakpoints: {
            0: {
                slidesPerView: 2,
                spaceBetween: 3,
            },
            767: {
                slidesPerView: 3,
                spaceBetween: 18,
            },
            990: {
                slidesPerView: 3,
            }            
        }
    })

 
    if($('.reviews__container .slider__item').length > 1){
        sliderContainer = $('.reviews');
        sliderInit();

        let reviewsSwiper = new Swiper ('.reviews__container', {
            slidesPerView: 2.8,
            loop: true,
            spaceBetween: 100,
            centeredSlides: true,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                0: {
                    slidesPerView: 1.2,
                    spaceBetween: 30,
                },
                990: {
                    slidesPerView: 1.6,
                    spaceBetween: 30,
                },
                1200: {
                    slidesPerView: 2.4,
                    spaceBetween: 60,
                },
                1440: {
                    slidesPerView: 2.8,
                    spaceBetween: 100,
                }            
            }
        })
    }
    }, 2000);

    let licensesSliderMinItems = 5;
    if($(window).width() < 768){
        licensesSliderMinItems = 3;        
    }

    if($('.licenses__container .slider__item').length > licensesSliderMinItems){
        sliderContainer = $('.licenses');
        sliderInit();

        let licensesSwiper = new Swiper ('.licenses__container', {
            slidesPerView: 4,
            loop: false,
            lazyLoading: true,
        //    centerInsufficientSlides:true,
            spaceBetween: 18,
            scrollbar: {
                el: '.swiper-scrollbar',
                hide: false,
                },
            breakpoints: {
                0: {
                    slidesPerView: 3,
                    spaceBetween: 3,
                },
                768: {
                    slidesPerView: 5,
                    spaceBetween: 18,
                }           
            }
        })
    }

    if($('.shop-item__slider .slider__item').length > 0) {
        sliderContainer = $('.shop-item__slider');
        sliderInit();

        let swiperInstances = [];
        $('.shop-item__slider .swiper-container').each(function(index, element){ //some-slider-wrap-in
            const $this = $(this);
            $this.addClass("instance-" + index); //instance need to be unique (ex: some-slider)
            // $this.parent('.shop-item__slider').find(".swiper-pagination").addClass("pagination-" + index);
            $this.parent().find(".swiper-button-prev").addClass("prev-" + index); //prev must be unique (ex: some-slider-prev)
            $this.parent().find(".swiper-button-next").addClass("next-" + index); //next must be unique (ex: some-slider-next)
            swiperInstances[index] = new Swiper(".instance-" + index, { //instance need to be unique (ex: some-slider)
                direction: 'vertical',
                slidesPerView: 4,
                loop: false,
                spaceBetween: 6,
                navigation: {
                    prevEl: ".prev-" + index,  //prev must be unique (ex: some-slider-prev)
                    nextEl: ".next-" + index, //next must be unique (ex: some-slider-next)
                },
                watchOverflow: true,
            });
        });

        // Now you can call the update on a specific instance in the "swiperInstances" object
        // e.g.
        // swiperInstances[3].update();
        //or all of them
        setTimeout(function () {
            for (const slider of swiperInstances) {
                slider.update();
            }
        }, 50);
    }

    function productSliderInit() {
        if ($('.product-slider__big').length) {
            console.log('111');
            let galleryThumbs = new Swiper('.product-slider__thumbs .swiper-container', {
                spaceBetween: 10,
                slidesPerView: 5,
                watchOverflow: true,
                navigation: {
                    nextEl: '.product-slider__thumbs .swiper-button-next',
                    prevEl: '.product-slider__thumbs .swiper-button-prev',
                },
                breakpoints: {
                    0: {
                        slidesPerView: 4.5,
                    },
                    768: {
                        slidesPerView: 3,
                    },
                    990: {
                        slidesPerView: 4,
                    },
                    1440: {
                        slidesPerView: 5,
                    }
                }
            });
            let galleryTop = new Swiper('.product-slider__big', {
                spaceBetween: 0,
                watchOverflow: true,
                thumbs: {
                    swiper: galleryThumbs
                },
            });
        }
    }
    productSliderInit();
    /* Sliders - end */
    
    /* Tabs main */
    $('body').on('click', '.photogallery-tabs__caption', function(){
        let tabNameCurrent = $(this).parents('.photogallery-tabs').find('.photogallery-tabs__caption.active').data('tab-name');
        let tabNameClicked = $(this).data('tab-name');

        $(this).parents('.photogallery-tabs').find('.photogallery-tabs__caption[data-tab-name="' + tabNameCurrent +'"]').removeClass('active');
        $(this).parents('.photogallery-tabs').find('.photogallery-tabs__table[data-tab-name="' + tabNameCurrent +'"]').removeClass('active');
        
        $(this).parents('.photogallery-tabs').find('.photogallery-tabs__caption[data-tab-name="' + tabNameClicked +'"]').addClass('active');
        $(this).parents('.photogallery-tabs').find('.photogallery-tabs__table[data-tab-name="' + tabNameClicked +'"]').addClass('active');
    })
    /* Tabs main - end */

    /* Modal */
    // forms
    let dataModalName;
    $(document).on('click', '[data-modal]', function(){
        dataModalName = $(this).data('modal');
        //console.log(dataModalName);
       
        $(document).find('[data-modal-form="' + dataModalName + '"] [name="url"]').attr('value', location.href);
        $(document).find('[data-modal-form="' + dataModalName + '"]').addClass('active');
        $('body').addClass('fixed');
        scrollbarCompensation('[data-modal-form="' + dataModalName + '"]', 'active');

        if ($($(this).parents('.shop-item')).length != 0) {
            let shopItemName = $(this).parents('.shop-item').find('.shop-item__title').text();
            let shopItemUrl = $(this).parents('.shop-item').find('.shop-item__title').attr('href');
            let shopItemEquipment = $(this).parents('.shop-item').find('.product-price__tabs-item.active').text();
            let shopItemPrice = $(this).parents('.shop-item').find('.product-price__tabs-item.active').data('value');
            console.log('parents shop-item');
            console.log(location.protocol + '//' + location.hostname);
            $(document).find('[data-modal-form="' + dataModalName + '"] .form__title .shop-order-name').html(shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-name"]').attr('value', shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-url"]').attr('value', location.protocol + '//' + location.hostname + shopItemUrl);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-equipment"]').attr('value', shopItemEquipment);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-price"]').attr('value', shopItemPrice);
        }

        if ($($(this).parents('.quick-view')).length != 0) {
            let shopItemName = $(this).parents('.quick-view').find('.product__title').text();
            let shopItemUrl = $(this).parents('.quick-view').find('.product__title').attr('href');
            let shopItemEquipment = $(this).parents('.quick-view').find('.product-price__tabs-item.active').text();
            let shopItemPrice = $(this).parents('.quick-view').find('.product-price__tabs-item.active').data('value');
            console.log('parents quick-view');
            console.log(location.protocol + '//' + location.hostname);
            $(document).find('[data-modal-form="' + dataModalName + '"] .form__title .shop-order-name').html(shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-name"]').attr('value', shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-url"]').attr('value', location.protocol + '//' + location.hostname + shopItemUrl);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-equipment"]').attr('value', shopItemEquipment);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-price"]').attr('value', shopItemPrice);
        }

        if ($($(this).parents('.product__page')).length != 0) {
            console.log('parents product__page');
            let shopItemName = $(this).parents('.product__page').find('h1').text();
            let shopItemEquipment = $(this).parents('.product__page').find('.product-price__tabs-item.active').text();
            let shopItemPrice = $(this).parents('.product__page').find('.product-price__tabs-item.active').data('value');
            $(document).find('[data-modal-form="' + dataModalName + '"] .form__title .shop-order-name').html(shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-name"]').attr('value', shopItemName);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-equipment"]').attr('value', shopItemEquipment);
            $(document).find('[data-modal-form="' + dataModalName + '"] [name="shop-item-price"]').attr('value', shopItemPrice);

        }
    });

    $('.form__close').on('click', function(){
        
        $(this).parents('.modal-form ').removeClass('active');
        $('body').removeClass('fixed');
				scrollbarCompensation('[data-modal-form="' + dataModalName + '"]', 'active');
    });
    
    $(document).mouseup(function (e){
        var dataModal = $('[data-modal-form="' + dataModalName + '"] .form__wrap');
        if (!dataModal.is(e.target)
            && dataModal.has(e.target).length === 0) {
                $(dataModal).parents('.modal-form ').removeClass('active');
                $('body').removeClass('fixed');
				scrollbarCompensation('[data-modal-form="' + dataModalName + '"]', 'active');
        }
    });

	$('.portfolio-categories > li > a').on('click', function (e) {
        e.preventDefault();
        var filter = $(this).data('filter');
        portfolioSlider.owlcarousel2_filter(filter);
    });

    $('.portfolio-select').on('change', function (e) {
        var filter = $(this).find(':selected').data('filter');
        portfolioSlider.owlcarousel2_filter(filter);
    });


    $('.quick-view-link').fancybox({
        // type : 'ajax',
        // autoFocus: false,
        // trapFocus: false,
        // afterShow : function(instance, current ) {
        //     productSliderInit();
        // }
    });

    /* Modal - end */

    $('.accessories__btn').on('click', function(){
        let formName = $(this).data('name');
        let formLink = $(this).data('link');
        $('.form-item-name').val(formName);
        $('.form-item-link').val(formLink);
    });



    $('.accessories__link').on('click', function(e){
        if ($(e.target).is($('.accessories__icon')) || $(e.target).is($('svg')) || $(e.target).is($('path')) || $(e.target).is($('circle'))) { 
           e.preventDefault();
           
           $(this).next('.accessories__image').addClass('active');
        };

        
     });
     $('.accessories__image-close').on('click', function(e){
        e.preventDefault();
        $(this).parent('.accessories__image').removeClass('active');
     });
     
     $(document).mouseup(function (e){
        let accessoriesImg = $('.accessories__image.active');
        if (!accessoriesImg.is(e.target)
            && accessoriesImg.has(e.target).length === 0) {
                $(accessoriesImg).removeClass('active');
        }
    });
    
    $('a[href^="mailto:"]').each(function(i, el) {
        var $el = $(el),
            text = $.trim($el.text());

        $el.tooltip({
            title: 'Адрес электронной почты скопирован',
            trigger: 'manual'
        });

        $el.on('click', function(e) {
            e.preventDefault();

            navigator.clipboard.writeText(text).then(() => {
                $el.tooltip('show');
                
                setTimeout(function() {
                    $el.tooltip('hide');
                }, 3000);
            });
        });
    });
   
        

        
     
    


    // $('.accessories__icon'){
        
    // };
    /* Order form shop item inner */
    if ($('.order-form')) {
        $('.order-form').find('[name="url"]').attr('value', location.href);
    }
    
    if ($('.callback-form')) {
        $('.callback-form').find('[name="url"]').attr('value', location.href);
    }
    /* Order form shop item inner - end */

    /* Header sticky */
    /*$('header').clone().prependTo('body').addClass('sticky');*/

    $(window).on('scroll', function(){
        if($(window).scrollTop() > $('header').height()){
            $('header.sticky').addClass('show');
        } else {
            $('header.sticky').removeClass('show'); 
        }
    })
    /* Header sticky - end */

     /* Mobile menu and header */
     if($(window).width() <= '767'){
        $('header:not(.sticky) .header__phone-item').prependTo('header:not(.sticky) .header__phone-block');
        $('header.sticky .header__phone-item').prependTo('header.sticky .header__phone-block');
        $('.header__phone-arrow').remove();
        $($('.header__phone-item svg')[0]).prependTo('.header__phone');

        $('.header__phone svg').click(function(){
            $(this).parents('.header__phone').find('.header__phone-block').toggleClass('active');
        });

        $(document).mouseup(function (e){
            var headerPhone = $('.header__phone');
            if (!headerPhone.is(e.target)
                && headerPhone.has(e.target).length === 0) {
                    $(headerPhone).find('.header__phone-block').removeClass('active');
            }
        });
     };

    /* Mobile menu */
    if($(window).width() <= '990'){
        $('.burger-button').on('click', function(){
            $('.mobile-menu').addClass('active');
            $('body').addClass('fixed');
        })
        $('.mobile-menu__close').on('click', function(){
            $('.mobile-menu').removeClass('active');
            $('body').removeClass('fixed');
        })
        
        $('header:not(.sticky)').find('.header__logo').clone().prependTo('.mobile-menu .header__wrap');
        $('header.sticky').find('.header__nav').remove();
        $('.header__nav').appendTo('.mobile-menu__wrap');
        $('.footer-column__contact .footer-column__block').clone().appendTo('.mobile-menu__wrap').addClass('mobile-menu__contacts');
        $('.mobile-menu__contacts .footer__btn').parents('.footer-column__item').remove();

        let mobileMenuWaWrap = $('.mobile-menu__contacts .footer-column__item-subtitle:contains("Whatsapp")').parents('.footer-column__item');
        $(mobileMenuWaWrap).find('svg').remove();
        $(mobileMenuWaWrap).find('.footer-column__link').prepend('<img src="/img/whatsapp.svg"/>');

        $('header.sticky').find('.header__btn').remove();
        $('.header__btn').appendTo('.mobile-menu__wrap');
        $('header:not(.sticky)').find('.header__soc').clone().appendTo('.mobile-menu__wrap');
        $('.mobile-menu .header-soc__item.whatsapp-icon').remove();                
    }

    $('.top-menu__link svg').on('click', false, function(e){
        e.preventDefault();
        $(this).parents('.top-menu__link').toggleClass('active');
        $(this).parents('.top-menu__link').next('.submenu').slideToggle('slow');
        $('body').toggleClass('fixed');
    })
    /* Mobile menu - end */

   // $(".fancybox").fancybox();

    if ($('.type-table_1').length) {
        $('.table-group__head').click(function() {
            $(this).parents('.table-group').toggleClass('opened');
            $(this).siblings('.table-group__body').slideToggle(300);
        });
    }

    let productPriceValue;
    $(document).on('click', '.product-price__tabs-item', function() {
        $(this).parents('.product-price__tabs-list').find('.product-price__tabs-item').removeClass('active');
        $(this).addClass('active');
        productPriceValue = $(this).data('value');

        $(this).parents('.product-info').find('.product-price__value').html(productPriceValue);
    });

    if ($('.product-materials__block').length) {
        let materialBlock,
            materialProduct,
            materialItemsCount = 4;

        if (screen.width < 768) {
            materialItemsCount = 4;
        } else if (screen.width < 991) {
            materialItemsCount = 2;
        } else if (screen.width < 1440) {
            materialItemsCount = 3;
        }

        $('.product-material__help').each(function() {
            materialProduct = $(this).data('material');

            $('.product-materials__block').each(function() {
                materialBlock = $(this).data('material-block');
                if (materialBlock == materialProduct) {
                    $(this).remove();
                }
            });
        });

        if ($('.product-materials__block').length > materialItemsCount) {
            $('.product-materials__wrap').after('<div class="product-materials__hide product-materials__wrap"></div>');
            $('.product-materials__block').each(function(index) {
                if (index >= materialItemsCount) {
                    $(this).appendTo('.product-materials__hide');
                }
            });
            $('.product-materials__hide').after('<div class="product-materials__toggle">Показать еще</div>');
            $('.product-materials__toggle').click(function() {
                $(this).siblings('.product-materials__hide').slideToggle(300).toggleClass('opened');
                if ($('.product-materials__hide').hasClass('opened')) {
                    $(this).html('Скрыть');
                    $('.product-materials__hide').css('display', 'grid');
                } else {
                    $(this).html('Показать еще');
                }
            });
        }

    }


    
	$('.reviews__tab-container').each(function () {
		var tabs = $(this);
		var tab = $(this).find('.reviews__tab-content');
		var captions = $('<div class="reviews__tab-captions">');
		tab.hide();
		tab.each(function () {
			var index = tab.index($(this));
			var caption = $('<div class="reviews__tab-caption">' + $(this).attr('data-caption') + '</div>');
			captions.append(caption);
			if (index == 0) {
				caption.addClass('reviews__tab-caption_current');
				$(this).show();
			}
		});
		tabs.prepend(captions);
		captions.find('.reviews__tab-caption').click(function () {
			tabs.find('.reviews__tab-caption').removeClass('reviews__tab-caption_current');
			$(this).addClass('reviews__tab-caption_current');
			var index = $(this).index();
			tabs.find('.reviews__tab-content').hide();
			tabs.find('.reviews__tab-content:eq(' + index + ')').show();
		});
    });
    
	$(".add-stars .stars__item").hover(function () {
        $(this).addClass("active");
    }, function () {
        $(this).removeClass("active");
    });
    $(".add-stars .stars__item").click(function () {
        $(".add-stars .stars__item").each(function () {
            $(this).removeClass("active-fix");
        });
        $(this).addClass("active-fix");
    });

    var count_stars = $('.reviews-list__item .stars__list');	  
    $.each(count_stars, function(){
        var number_star = $(this).data('countstar') - 1;
    $.each($(this).find('.stars__item'), function (i) {			
        if(i > number_star){
            return;
        } else{
            i++;
            $(this).addClass('selected');
        }
    
        });
    });

    
    var readMoreText = $('.read-more__text');
    $.each(readMoreText, function(){
        if ( $(this).children('p').height() > 70 ) {
            $(this).next(".read-more__toggler").show();
        }
        $(this).next(".read-more__toggler").on('click', function(){
                 $(this).prev('.read-more__text').toggleClass('show');
                    if ($(this).prev('.read-more__text').hasClass('show')) {
                     $(this).html('Скрыть');
                     } else {
                         $(this).html('Читать далее');
                     }		
         return false;
        })
    });

    $('.questions__item-caption').click(function() {
        // let container = $(this).parent('.questions__item'),
        //     content = $(container).find('.questions__item-content');

        // if ($(container).hasClass('active')) {
        //     $(container).removeClass('active');
        //     $(content).slideUp(300);

        // } else {
        //     $('.questions__item.active .questions__item-content').slideUp(300);
        //     $('.questions__item.active').removeClass('active');
        //     $(container).addClass('active');
        //     $(content).slideDown(300);

        // }

        $(this).toggleClass('active');
        $(this).next('.questions__item-content').slideToggle(300);
    });


    /* Adaptive */

    /* shop-item left slider */
    function catalogShopSliderToRight(numb) {
        if($('.catalog__list .shop-item').length){
            $('.catalog__list .shop-item:nth-child(' + numb + 'n + 1)').addClass('shop-item_left');
        }
        if($('.hits__list .shop-item').length){
            $('.hits__list .shop-item:nth-child(' + numb + 'n + 1)').addClass('shop-item_left');
        }
        if($('.popular__list .shop-item').length < 4){
            $('.popular__list .shop-item:nth-child(' + numb + 'n + 1)').addClass('shop-item_left');
        }
    }

    if(screen.width < 1600){
        catalogShopSliderToRight(4);
    }

    if(screen.width < 1440 && screen.width >= 990){
        catalogShopSliderToRight(3);
    }
    /* shop-item left slider - end */
    
    /* Catalog sorting */
    if(screen.width < 768){
        $('.catalog-sort__price .catalog-sort__name').click(function(){
            $(this).parents('.catalog-sort__price').toggleClass('active');
            $(this).parents('.catalog-sort__price').find('.catalog-sort__list').slideToggle();
        })
    }    
    /* Catalog sorting - end */

    /* Catalog filter */
    if ($('.tag-group_tabs').length) {
        if ($('.tag-group_tabs .tag-group__item.active').length) {
            let activeTabName = $('.tag-group_tabs .tag-group__item.active').parents('.tag-group__block').data('tab');

            $('.tag-group_tabs .tag-group__title[data-tab="' + activeTabName + '"]').addClass('show');
            $('.tag-group_tabs .tag-group__block[data-tab="' + activeTabName + '"]').addClass('show');
        } else {
            $($('.tag-group_tabs .tag-group__title')[0]).addClass('show');
            $($('.tag-group_tabs .tag-group__block')[0]).addClass('show');
        }

        $('.tag-group_tabs .tag-group__title').click(function () {
            let tabName = $(this).data('tab');
            $(this).parents('.tag-group_tabs').find('.tag-group__title').removeClass('show');
            $(this).parents('.tag-group_tabs').find('.tag-group__block').removeClass('show');
            $(this).addClass('show');
            $(this).parents('.tag-group_tabs').find('.tag-group__block[data-tab="' + tabName + '"]').addClass('show');
        });
    }

    if(screen.width < 768){
        if ($('.catalog__filter')) {

            $('.filter__content').attr('style', '--filter-content-minus: ' + $('.filter__head').outerHeight() + 'px;');
            // $('.filter__content').attr('style', '--filter-content-minus: ' + ($('.filter__head').outerHeight() + $('.filter__btns').outerHeight()) + 'px;');

            $('body').on('click', '.catalog-filter__btn', function(){
                $('.catalog__filter').addClass('show');
                $('body').addClass('fixed');
            });
            $('body').on('click', '.filter__close', function(){
                $('.catalog__filter').removeClass('show');
                $('body').removeClass('fixed');
            });
        }
    }        
    /* Catalog filter - end */


    /* Adaptive - end */
  



});





jQuery(function($){
	
	$.fancybox.defaults.infobar = false;
	$.fancybox.defaults.afterShow = function() {
		$(this.$content).find("input[type=tel]").attr("placeholder","+7 (___) ___-__-__").mask("+7 (999) 999-99-99");
	};
	$.fancybox.defaults.baseTpl =
        '<div class="fancybox-container" role="dialog" tabindex="-1">' +
        '<div class="fancybox-bg"></div>' +
        '<div class="fancybox-inner">' +
        '<div class="fancybox-infobar">' +
        "<span data-fancybox-index></span>&nbsp;/&nbsp;<span data-fancybox-count></span>" +
        "</div>" +
        '<div class="fancybox-toolbar">{{buttons}}</div>' +
        '<div class="fancybox-stage"><div class="fancybox-navigation">{{arrows}}</div></div>' +
        '<div class="fancybox-caption"></div>' +
        "</div>" +
        "</div>";
	$("input[type=tel]").attr("placeholder","+7 (___) ___-__-__").mask("+7 (999) 999-99-99");
	
	$("body").on('submit', '[data-ajax]', function (e) {
       
		e.preventDefault();
		var form = $(this);
        formData = new FormData(form.get(0));
        formData.append($(form).data('ajax')+'Submit', 1);
		$.ajax({
			data: formData,
			type: "POST",
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (data) {
				form.find('.preloader-holder').hide();
				swal({
					title: data.title,
					text: data.text,
					type: data.type,
					confirmButtonColor: data.color
				});
				if (data.type == 'success') {
					form.trigger( 'reset' );
				}
			}
		});
		return false;
	});	




    if(document.documentElement.clientWidth > 991) {
        $('.menu-footer__parent').hover(function(){
        $('.menu-footer__parent').removeClass('active');
        $(this).addClass('active');
    })
  } else{
      $('.menu-footer__arrow').on('click', function(e){
        e.preventDefault();
          $(this).closest('.menu-footer__parent').toggleClass('mob-active');
          $(this).closest('.menu-footer__parent').find('.menu-footer__sub').slideToggle()

      });
  };



  $('.header__search-input').autocomplete({
    serviceUrl: '/search/?autocomplete=1',
    delimiter: ',',
    appendTo: '.search-head',
    noCache: true,
    minChars: 2,
    onSelect: function (suggestion) {
        $(this).closest("form").submit();
                    //еСЛИ ХОТИМ ПЕРЕЗОД В КАРТОЧКУ ТОВАРА
        window.location.href = suggestion.path;
    },
    maxHeight: 800,
    deferRequestBy: 500
});
$('.header__search-fixed').autocomplete({
    serviceUrl: '/search/?autocomplete=1',
    delimiter: ',',
    appendTo: '.search-fixed',
    noCache: true,
    minChars: 2,
    onSelect: function (suggestion) {
        $(this).closest("form").submit();
                    //еСЛИ ХОТИМ ПЕРЕЗОД В КАРТОЧКУ ТОВАРА
        window.location.href = suggestion.path;
    },
    maxHeight: 800,
    deferRequestBy: 500
});
$('.header__search-mob').autocomplete({
    serviceUrl: '/search/?autocomplete=1',
    delimiter: ',',
    appendTo: '.search-mob',
    noCache: true,
    minChars: 2,
    onSelect: function (suggestion) {
        $(this).closest("form").submit();
                    //еСЛИ ХОТИМ ПЕРЕЗОД В КАРТОЧКУ ТОВАРА
        window.location.href = suggestion.path;
    },
    maxHeight: 800,
    deferRequestBy: 500
});





// $('.show_form').on('click', function(){

// })


if ($('.order-form')) {
        $('.order-form').find('[name="url"]').attr('value', location.href);
    }






});



var block_show = null;
	function scrollTracking(){
		var wt = $(window).scrollTop();
		var wh = $(window).height();
		var et = $('.nav-visible').offset().top;
		var eh = $('.nav-visible').outerHeight();

		if (wt + wh >= et && wt + wh - eh * 2 <= et + (wh - eh)){
			if (block_show == null || block_show == false) {
				$('.fixed-head').removeClass('active');
			}
			block_show = true;
		} else {
			if (block_show == null || block_show == true) {
				$('.fixed-head').addClass('active');
			}
			block_show = false;
		}
	}

	$(window).scroll(function(){
		scrollTracking();
	});
	$(document).ready(function(){ 
		scrollTracking();
		$('.mob-menu__burger').on('click', function(){
			$(this).toggleClass('active');
			$('.mob-menu__content').toggleClass('active');
			$('body').toggleClass('no-scroll')
		})
		$('.mob-menu .arrows').on('click', function(e){
			e.preventDefault();
			$(this).closest('li').addClass('active');

		});
		$('.link__back').on('click', function(){
			$(this).closest('li').removeClass('active');

		});
	});
// Initialize Masonry JS

// $(document).ready(function(){
//     console.log('lasza');
// 	var $grid = $('.portfolio-grid').imagesLoaded( function() {
// 		// init Masonry after all images have loaded
// 		$grid.masonry({
// 			// options
// 			itemSelector: '.portfolio-grid-item',
// 			columnWidth: '.portfolio-grid-sizer',
// 			gutter: '.portfolio-gutter-sizer',
// 			percentPosition: true
// 		});
// 	});
// });

var productName,
productImg,
productUrl;
// register click event for anchor
$("[data-remodal-target='order']").click(function(){
// assign into global var
productName = $(this).data('name');
productImg = $(this).data('img');
productUrl = $(this).data('url');




});


$(document).on('opening', '.form-bay', function (e) {
    $(this).find('.title').text('Заказать: '+ productName);
    $(this).find('.form-bay__tovar').val(productName);
    $(this).find('.form-bay__link').val('https://bikzg.ru'+productUrl);
    $(this).find('.form-bay__info').html("<img src="+productImg+">");
});