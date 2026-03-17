document.addEventListener('DOMContentLoaded', function() {
    // Получаем все необходимые элементы
    const progressBar = document.getElementById('progressBar');
    const navDots = document.querySelectorAll('.nav-dot');
    const prevButton = document.getElementById('prevSection');
    const nextButton = document.getElementById('nextSection');
    const organicShapes = document.querySelectorAll('.organic-shape');
    
    const sections = document.querySelectorAll('.section');
    let currentSectionIndex = 0;
    let isScrolling = false;

    // Функция для обновления навигации
    function updateNavigation() {
        // Обновляем прогресс-бар
        const progress = (currentSectionIndex / (sections.length - 1)) * 100;
        progressBar.style.height = `${progress}%`;
        
        // Обновляем точки
        navDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSectionIndex);
        });
        
        // Обновляем кнопки стрелок
        prevButton.disabled = currentSectionIndex === 0;
        nextButton.disabled = currentSectionIndex === sections.length - 1;
        
        // Управляем прозрачностью фона в зависимости от секции
        updateBackgroundOpacity();
    }

    // Функция для обновления прозрачности фона
    function updateBackgroundOpacity() {
        if (currentSectionIndex === 0) {
            // На главной странице - полная прозрачность
            organicShapes.forEach(shape => {
                shape.style.opacity = '0.15';
                shape.style.filter = 'blur(8px) brightness(1.1)';
            });
        } else {
            // На странице рецептов - приглушенная прозрачность
            organicShapes.forEach(shape => {
                shape.style.opacity = '0.08';
                shape.style.filter = 'blur(12px) brightness(0.9)';
            });
        }
    }

    // Функция для плавного перехода к секции
    function goToSection(index) {
        if (index >= 0 && index < sections.length && !isScrolling) {
            isScrolling = true;
            currentSectionIndex = index;
            
            sections[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Обновляем навигацию после завершения скролла
            setTimeout(() => {
                isScrolling = false;
                updateNavigation();
            }, 800);
        }
    }

    // Обработчик для навигационной точки
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSection(index);
        });
    });

    // Обработчики для стрелок навигации
    prevButton.addEventListener('click', () => {
        goToSection(currentSectionIndex - 1);
    });

    nextButton.addEventListener('click', () => {
        goToSection(currentSectionIndex + 1);
    });

    // Обработчик скролла для определения текущей секции
    window.addEventListener('scroll', function() {
        if (isScrolling) return;

        // Определяем текущую активную секцию на основе скролла
        let newIndex = 0;
        let minDistance = Infinity;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionMiddle = sectionTop + sectionHeight / 2;
            const distanceFromMiddle = Math.abs(window.scrollY + window.innerHeight / 2 - sectionMiddle);
            
            if (distanceFromMiddle < minDistance) {
                minDistance = distanceFromMiddle;
                newIndex = index;
            }
        });
        
        if (newIndex !== currentSectionIndex) {
            currentSectionIndex = newIndex;
            updateNavigation();
        }
    });

    // Обработчик клавиатуры для навигации
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSection(currentSectionIndex - 1);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            goToSection(currentSectionIndex + 1);
        } else if (e.key === '1') {
            e.preventDefault();
            goToSection(0); // Главная
        } else if (e.key === '2') {
            e.preventDefault();
            goToSection(1); // Рецепты
        }
    });

    // Функция для добавления случайных вариаций анимациям органических форм
    function addRandomVariations() {
        organicShapes.forEach((shape, index) => {
            // Случайные вариации скорости анимации (±20%)
            const randomSpeed = 1 + (Math.random() - 0.5) * 0.4;
            const currentAnimations = shape.style.animationDuration;

            if (currentAnimations) {
                // Обновляем длительность всех анимаций для этой формы
                const newDurations = currentAnimations.split(',')
                    .map(duration => {
                        const baseTime = parseFloat(duration);
                        return `${baseTime * randomSpeed}s`;
                    })
                    .join(', ');
                
                shape.style.animationDuration = newDurations;
            }
        });
    }

    // Функция для наблюдения за появлением карточек при скролле
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Наблюдаем за карточками
        const cards = document.querySelectorAll('.category-card');
        cards.forEach(card => {
            observer.observe(card);
        });

        // Наблюдаем за заголовком
        const title = document.querySelector('.recipes-title');
        const subtitle = document.querySelector('.recipes-subtitle');
        if (title) observer.observe(title);
        if (subtitle) observer.observe(subtitle);
    }

    // Функция для параллакс эффекта
    function initParallaxEffect() {
        const shapes = document.querySelectorAll('.organic-shape');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.3;
            
            shapes.forEach((shape, index) => {
                const speed = 0.2 + (index * 0.08);
                const y = rate * speed;
                shape.style.transform = `translateY(${y}px) ${shape.style.transform}`;
            });
        });
    }

    // Функция для обработки свайпов на мобильных устройствах
    let touchStartY = 0;
    let touchStartX = 0;

    function handleTouchStart(event) {
        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
    }

    function handleTouchEnd(event) {
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndX = event.changedTouches[0].clientX;
        
        const deltaY = touchStartY - touchEndY;
        const deltaX = touchStartX - touchEndX;
        
        // Определяем, был ли это вертикальный свайп (скролл) или горизонтальный (навигация)
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            // Вертикальный свайп - обрабатывается скроллом браузера
            return;
        }
        
        // Горизонтальный свайп для навигации
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Свайп влево - следующая секция
                goToSection(currentSectionIndex + 1);
            } else {
                // Свайп вправо - предыдущая секция
                goToSection(currentSectionIndex - 1);
            }
        }
    }

    // Добавляем обработчики для свайпов
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Функция для ресайза окна
    function handleResize() {
        // При ресайзе обновляем позиции секций
        setTimeout(updateNavigation, 100);
    }

    window.addEventListener('resize', handleResize);

    // Инициализация сайта
    function initSite() {
        // Устанавливаем начальную секцию
        currentSectionIndex = 0;
        updateNavigation();
        
        // Добавляем случайные вариации анимациям
        addRandomVariations();
        
        // Инициализируем анимации при скролле
        initScrollAnimations();
        
        // Инициализируем параллакс эффект
        initParallaxEffect();
        
        // Периодически обновляем анимации для большего хаоса
        setInterval(addRandomVariations, 30000);
        
        // Добавляем плавное появление элементов при загрузке
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }

    // Запускаем инициализацию
    initSite();
});