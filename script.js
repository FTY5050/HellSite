window.addEventListener('load', () => {
    const boiler = document.getElementById('hero-boiler');
    boiler.style.transform = 'rotate(0deg) scale(1.1)';
});

document.addEventListener('mousemove', (e) => {
    const boiler = document.getElementById('hero-boiler');
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;
    boiler.style.transform = `translate(${x}px, ${y}px) rotate(${-x/5}deg)`;
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("gallery-modal");
    const modalImg = document.getElementById("full-img");
    const captionText = document.getElementById("caption");
    const closeModal = document.querySelector(".close-modal");

    if (modal && modalImg) {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                const title = this.querySelector('h3');
                
                modal.style.display = "flex";
                modal.style.alignItems = "center";
                modal.style.justifyContent = "center";
                modal.style.flexDirection = "column";
                
                modalImg.src = img.src;
                captionText.innerHTML = title ? title.innerHTML : "";
                document.body.style.overflow = 'hidden';
            });
        });
    }

    if (closeModal) {
        closeModal.onclick = function() {
            modal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
    }
});

function reveal() {
    const reveals = document.querySelectorAll(".reveal, .tech-box, .service-block");
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 100;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add("active");
        }
    });
}

window.addEventListener("scroll", reveal);

document.addEventListener("DOMContentLoaded", reveal);

document.querySelectorAll('.service-block').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // БЫЛО: / 15 (агрессивно)
        // СТАЛО: / 40 (мягко и солидно)
        const rotateX = (y - centerY) / 40; 
        const rotateY = (centerX - x) / 40; 
        
        // Добавляем небольшой подъем (translateY), чтобы выделить активную карточку
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        // Плавный возврат в исходное состояние
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const observerOptions = {
        root: null,
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const targets = document.querySelectorAll('.accordion-section, .data-section, .services-section, .gallery-section, .main-footer, .section-header');
    
    targets.forEach(target => {
        target.classList.add('fade-in-section');
        observer.observe(target);
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.querySelector('.close-modal-btn');
    
    // Ищем ВСЕ кнопки, которые должны открывать форму
    // Добавь класс .open-modal-trigger на кнопки в HTML
    const openButtons = document.querySelectorAll('.btn-contact, .btn-footer-static, .footer-action-btn');

    openButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Запрет скролла
        });
    });

    // Закрытие по крестику
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Закрытие при клике вне формы
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
});
document.getElementById('catalog-search').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.catalog-card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.4s ease';
        } else {
            card.style.display = 'none';
        }
    });
});
document.addEventListener("DOMContentLoaded", function() {
    const revealSection = document.querySelector('.reveal-section');
    const searchInput = document.getElementById('catalog-search');
    const cards = document.querySelectorAll('.prod-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appeared');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    if (revealSection) observer.observe(revealSection);

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase().trim();
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(term)) {
                    card.style.display = 'flex'; 
                    card.style.opacity = '1';
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const contactModal = document.getElementById('contact-modal');
    const openBtn = document.querySelector('.open-modal-trigger');
    const closeBtn = document.querySelector('.close-modal-btn');

    // Функция ОТКРЫТЬ
    if (openBtn) {
        openBtn.onclick = function(e) {
            e.preventDefault();
            contactModal.classList.add('active');
        };
    }

    // Функция ЗАКРЫТЬ
    const doClose = () => {
        contactModal.classList.remove('active');
    };

    if (closeBtn) closeBtn.onclick = doClose;

    // Закрытие по клику на фон
    contactModal.onclick = function(e) {
        if (e.target === contactModal) doClose();
    };

    // Закрытие по ESC
    document.onkeydown = function(e) {
        if (e.key === 'Escape') doClose();
    };
});
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('gallery-modal');
    const fullImg = document.getElementById('full-img');
    const prevBtn = document.getElementById('prev-js');
    const nextBtn = document.getElementById('next-js');
    const galleryImages = document.querySelectorAll('.gallery-item img');

    let currentIndex = 0;

    // 1. Собираем все пути к картинкам в массив
    const imagesSrc = Array.from(galleryImages).map(img => img.src);

    // 2. Открытие при клике на фото
    galleryImages.forEach((img, index) => {
        img.onclick = () => {
            currentIndex = index;
            showImage(currentIndex);
            modal.style.display = "block";
        };
    });

    // 3. Функция показа
    function showImage(index) {
        if (index >= imagesSrc.length) currentIndex = 0;
        if (index < 0) currentIndex = imagesSrc.length - 1;
        fullImg.src = imagesSrc[currentIndex];
        console.log("Сейчас фото №:", currentIndex); // Для отладки в F12
    }

    // 4. Кнопки (явное назначение через onclick)
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex++;
        showImage(currentIndex);
    };

    prevBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex--;
        showImage(currentIndex);
    };

    // 5. Закрытие
    document.querySelector('.close-modal').onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});
const contactModal = document.getElementById('contact-modal');
const openButtons = document.querySelectorAll('.open-modal-trigger');
const closeBtn = document.querySelector('.close-modal-btn');

// Открытие
openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        contactModal.style.display = 'flex'; // Сначала показываем блок
        setTimeout(() => {
            contactModal.classList.add('active'); // Затем включаем анимацию
        }, 10);
    });
});

// Закрытие
const closeModal = () => {
    contactModal.classList.remove('active'); // Убираем анимацию
    setTimeout(() => {
        contactModal.style.display = 'none'; // Скрываем блок после завершения анимации
    }, 400); // 400мс — время из CSS transition
};

closeBtn.addEventListener('click', closeModal);

// Закрытие по клику на фон
contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeModal();
});