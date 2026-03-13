window.addEventListener('load', () => {
    const boiler = document.getElementById('hero-boiler');
    if (boiler) {
        boiler.style.transform = 'rotate(0deg) scale(1.1)';
    }
});

document.addEventListener('mousemove', (e) => {
    const boiler = document.getElementById('hero-boiler');
    if (!boiler) return;
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;
    boiler.style.transform = `translate(${x}px, ${y}px) rotate(${-x/5}deg)`;
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

// Универсальный хелпер: выполнить сразу, если DOM уже загружен,
// иначе дождаться DOMContentLoaded (нужно для внутренних страниц,
// где script.js подгружается после события).
function onReady(cb) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cb);
    } else {
        cb();
    }
}

onReady(function() {
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

// Поиск по старым карточкам каталога (если поле есть на странице)
const legacyCatalogSearch = document.getElementById('catalog-search');
if (legacyCatalogSearch) {
    legacyCatalogSearch.addEventListener('input', function(e) {
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
}

onReady(function() {
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

onReady(() => {
    const modal = document.getElementById('gallery-modal');
    const fullImg = document.getElementById('full-img');
    const prevBtn = document.getElementById('prev-js');
    const nextBtn = document.getElementById('next-js');
    const galleryImages = document.querySelectorAll('.gallery-item img');

    if (!modal || !fullImg || !prevBtn || !nextBtn || !galleryImages.length) {
        return;
    }

    let currentIndex = 0;
    const imagesSrc = Array.from(galleryImages).map(img => img.src);

    function showImage(index) {
        if (index >= imagesSrc.length) currentIndex = 0;
        if (index < 0) currentIndex = imagesSrc.length - 1;
        fullImg.src = imagesSrc[currentIndex];
    }

    galleryImages.forEach((img, index) => {
        img.onclick = () => {
            currentIndex = index;
            showImage(currentIndex);
            modal.style.display = "block";
        };
    });

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

    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            modal.style.display = "none";
        };
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});

const contactModal = document.getElementById('contact-modal');

onReady(() => {
  const openButtons = document.querySelectorAll('.open-modal-trigger');
  const closeBtn = document.querySelector('.close-modal-btn');

  if (!contactModal) return;

  const titleEl = contactModal.querySelector('.modal-title');
  const subtitleEl = contactModal.querySelector('.modal-subtitle');

  const setModalTexts = (type) => {
    if (!titleEl || !subtitleEl) return;

    if (type === 'contact') {
      titleEl.textContent = 'СВЯЗАТЬСЯ';
      subtitleEl.textContent = 'Оставьте контакты, и специалист НПП «КПК» свяжется с вами.';
    } else if (type === 'question') {
      titleEl.textContent = 'ЗАДАТЬ ВОПРОС';
      subtitleEl.textContent = 'Опишите ваш вопрос — специалист НПП «КПК» подготовит ответ.';
    } else {
      titleEl.textContent = 'ОСТАВИТЬ ЗАЯВКУ';
      subtitleEl.textContent = 'Специалист НПП «КПК» свяжется с вами и уточнит детали заказа.';
    }
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const product = btn.getAttribute('data-item-title');
      const form = document.getElementById('modal-form');

      if (form) {
        const ta = form.querySelector('textarea');
        if (ta) {
          if (product) {
            ta.value = 'Заказ: ' + product;
          } else {
            ta.value = '';
          }
        }
      }

      const typeAttr = btn.getAttribute('data-modal-type');
      const type = typeAttr || (product ? 'order' : 'contact');

      setModalTexts(type);

      contactModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(() => contactModal.classList.add('active'), 10);
    });
  });

  const closeModal = () => {
    contactModal.classList.remove('active');
    setTimeout(() => {
      contactModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 400);
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

// Отправка формы заявки на почту (mailto)
onReady(() => {
    const modalForm = document.getElementById('modal-form');
    if (!modalForm) return;

    modalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const nameInput = modalForm.querySelector('input[type="text"]');
        const phoneInput = modalForm.querySelector('input[type="tel"]');
        const emailInput = modalForm.querySelector('input[type="email"]');
        const msgInput = modalForm.querySelector('textarea');

        const name = (nameInput || {}).value || '';
        const phone = (phoneInput || {}).value || '';
        const email = (emailInput || {}).value || '';
        const msg = (msgInput || {}).value || '';

        const subject = 'Заявка с сайта НПП КПК';
        const body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nEmail: ' + email + '\n\nСообщение/заказ:\n' + msg;
        window.location.href = 'mailto:info@nppkpk.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        if (contactModal) {
            contactModal.classList.remove('active');
            setTimeout(() => { 
                contactModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 400);
        }
    });
});