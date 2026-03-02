function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Очищаем на случай, если что-то уже есть
    mapContainer.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = "https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A7d6750a142fefb8011a5a409a74e685daa5ce0cb023da07ed1a7d94305075b1d&width=100%25&height=600&lang=ru_RU&scroll=true";
    
    mapContainer.appendChild(script);
}

document.addEventListener('DOMContentLoaded', initMap);