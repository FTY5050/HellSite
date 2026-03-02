(function(jQuery){
	// Функции без создания коллекции
	jQuery.extend({
		applyAddressSuggestion: function(cartUrl, suggestion)
		{
			if (suggestion.data.city.length)
			{
				$.loadingScreen('show');

				var $address = $('input[name = address], .hostcms-dadata-address'),
					$form = $address.closest('form'),
					$selectCountry = $('select[name = shop_country_id]', $form),
					$postCode = $('input[name = postcode], .hostcms-dadata-postcode', $form);
					$country = $('.hostcms-dadata-country', $form),
					$city = $('.hostcms-dadata-city', $form);

				// Country
				$selectCountry
					.find('option:contains("' + suggestion.data.country + '")')
					.prop("selected", true);

				// Reload country locations and cities
				$.loadLocations(cartUrl, $selectCountry.val(), function(){
					$.loadCityByName($selectCountry.val(), suggestion.data.city, cartUrl);
				});


				$country.length && $country.val(suggestion.data.country);
				$city.length && $city.val(suggestion.data.city);

				$postCode.val(suggestion.data.postal_code);

				$.loadingScreen('hide');
			}
		},
		applyCompanySuggestion: function(cartUrl, suggestion)
		{
			var $address = $('input[name = address], .hostcms-dadata-address');

			if ($address.val() == '')
			{
				$.applyAddressSuggestion(cartUrl, suggestion.data.address);
			}

			var $inn = $('input[name = tin], input[name = inn], .hostcms-dadata-inn'),
				$surname = $('input[name = surname], .hostcms-dadata-surname'),
				$name = $('input[name = name], .hostcms-dadata-name'),
				$patronymic = $('input[name = patronymic], .hostcms-dadata-patronymic')
			;

			$inn.val() == '' && $inn.val(suggestion.data.inn);

			if (suggestion.data.hasOwnProperty('kpp'))
			{
				var $kpp = $('input[name = kpp], .hostcms-dadata-kpp');

				$kpp.val() == '' && $kpp.val(suggestion.data.kpp);
			}

			if (suggestion.data.hasOwnProperty('fio')) 	// ИП
			{
				if ($surname.val() == '' && $name.val() == '' && $patronymic.val() == '')
				{
					$surname.val(suggestion.data.fio.surname);
					$name.val(suggestion.data.fio.name);
					$patronymic.val(suggestion.data.fio.patronymic);
				}
			}
			else if (suggestion.data.hasOwnProperty('management'))
			{
				if ($address.val() == '')
				{
					var address = suggestion.data.address.data,
						street = $.join([address.street_type, address.street], ' '),
						house = $.join([
							$.join([address.house_type, address.house], ' '),
							$.join([address.block_type, address.block], ' ')
						]),
						flat = $.join([address.flat_type, address.flat], ' '),
						fullAddress = $.join([street, house, flat], ', ');

					// У ИП адрес не заполняем.
					$address.val(fullAddress);
				}

				if (suggestion.data.management !== null)
				{
					var fio = suggestion.data.management.name.split(' ');

					if ($surname.val() == '' && $name.val() == '' && $patronymic.val() == '')
					{
						$surname.val(fio[0]);
						$name.val(fio[1]);
						$patronymic.val(fio[2]);
					}
				}
			}
			else
			{
				if ($surname.val() == '' && $name.val() == '' && $patronymic.val() == '')
				{
					$surname.val('');
					$name.val('');
					$patronymic.val('');
				}
			}
		},
		join: function(arr /*, separator */) {
			var separator = arguments.length > 1 ? arguments[1] : ", ";
			return arr.filter(function(n){return n}).join(separator);
		}
	});
})(jQuery);