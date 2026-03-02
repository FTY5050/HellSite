// Функции без создания коллекции
$(function() {
    
      //Слайдер с таблицей характеристик
        function mobileOnlySlider() {
                $('.detail-box__properties .divTableBody').slick({
                  infinite: true,
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  rows: 5,
                  arrows: false,
                  dots: true
                });
        }
        if(window.innerWidth < 768) {
            mobileOnlySlider();
        }
        $(window).resize(function(e){
                if(window.innerWidth < 768) {
                    if(!$('.divTableBody').hasClass('slick-initialized')){
                        mobileOnlySlider();
                    }
            
                }else{
                    if($('.divTableBody').hasClass('slick-initialized')){
                        $('.divTableBody').slick('unslick');
                    }
                }
        });
    
    	$.extend({
        changePrice: function(object)
		{
			var jInput = $(object),
				id = jInput.val(),
				price = jInput.data('price');
				name = jInput.data('name');
                img_path = jInput.data('large-src');
				
			// Подмена для корзины
			$('button#cart').data('item-id', id);

			// Подмена для быстрого заказа
			$('button#fast_order').data('item-id', id).data('target', '#oneStepCheckout' + id);

			// Подмена для цены
			$('.item-price').text(price);
            $('#zakaz-btn').attr('data-name', name);
            $('#zoom').attr('src', img_path);
		}
	});
});
$(document).ready(function() {
    
   

	$('.media-thumbnail').on('click', '.media-thumbnail__link-box', function(e) {
		e.preventDefault();

		var $mediaBox = $('.media-box'),
			$mediaThumbnail = $('.media-thumbnail'),
			$this = $(this);

		$mediaBox.find('.media-box__link-box')
			.removeClass('active')
			.filter('[data-index="' + $this.data('index') + '"]').addClass('active');

		//$mediaBox.find('.media-box__link-box[data-index="' + $this.data('index') + '"]').addClass('active');

		$mediaThumbnail.find('.media-thumbnail__link-box').removeClass('active');
		$this.addClass('active');
	});

});