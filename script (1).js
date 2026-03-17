// ФИКС ДЛЯ Z-INDEX И ПРОЗРАЧНОСТИ
function fixBackgroundIssues() {
    console.log('🔧 Fixing background and z-index issues...');
    
    // Принудительно устанавливаем прозрачность для секций
    const sections = document.querySelectorAll('.hero, .project-showcase, .section');
    sections.forEach(section => {
        section.style.background = 'transparent';
        section.style.backgroundColor = 'transparent';
    });
    
    // Принудительно устанавливаем z-index для фона
    const background = document.querySelector('.floating-background');
    if (background) {
        background.style.zIndex = '-100';
        background.style.background = 'transparent';
    }
    
    // Принудительно устанавливаем z-index для форм
    const shapes = document.querySelectorAll('.organic-shape, .organic-shapes-container');
    shapes.forEach(shape => {
        shape.style.zIndex = '-99';
    });
    
    console.log('✅ Background issues fixed');
}

// ВЫЗОВИТЕ ЭТУ ФУНКЦИЮ В DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing animations...');
    
    // Сначала фиксим фон и z-index
    fixBackgroundIssues();
    
    // Потом инициализируем анимации
    const organicBg = new OrganicBackground();
    new TextAnimator();
    new ProjectShowcase();
    new HeaderScroll();
    new SectionNavigation();
    
    // Плавное появление body
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.classList.add('loaded');
        
        // Повторно фиксим после загрузки
        setTimeout(fixBackgroundIssues, 100);
    }, 100);
    
    // Экстренный фикс через 2 секунды
    setTimeout(fixBackgroundIssues, 2000);
});

// Остальной код оставьте как был...
class TextAnimator {
    constructor() {
        this.lines = document.querySelectorAll('.title-line');
        this.subtitles = document.querySelectorAll('.subtitle-line');
        this.currentIndex = 0;
        this.interval = null;
        this.init();
    }
    
    init() {
        // Set initial active states
        this.lines[0].style.opacity = '1';
        this.lines[0].style.transform = 'translateY(0)';
        this.subtitles[0].style.opacity = '1';
        this.subtitles[0].style.transform = 'translateY(0)';
        
        this.startRotation();
        
        // Pause on hover
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.addEventListener('mouseenter', () => this.stopRotation());
            heroContent.addEventListener('mouseleave', () => this.startRotation());
        }
    }
    
    rotateText() {
        // Hide current lines
        this.lines[this.currentIndex].style.opacity = '0';
        this.lines[this.currentIndex].style.transform = 'translateY(-40px)';
        this.subtitles[this.currentIndex].style.opacity = '0';
        this.subtitles[this.currentIndex].style.transform = 'translateY(-30px)';
        
        // Calculate next index
        this.currentIndex = (this.currentIndex + 1) % this.lines.length;
        
        // Show next lines
        setTimeout(() => {
            this.lines[this.currentIndex].style.opacity = '1';
            this.lines[this.currentIndex].style.transform = 'translateY(0)';
            this.subtitles[this.currentIndex].style.opacity = '1';
            this.subtitles[this.currentIndex].style.transform = 'translateY(0)';
        }, 600);
    }
    
    startRotation() {
        if (!this.interval) {
            this.interval = setInterval(() => {
                this.rotateText();
            }, 3500);
        }
    }
    
    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

class ProjectShowcase {
    constructor() {
        this.items = document.querySelectorAll('.project-showcase-item');
        this.container = document.querySelector('.project-showcase');
        this.scrollArea = document.querySelector('.project-showcase-scroll');
        this.totalItems = this.items.length;
        this.currentIndex = 0;
        this.scrollProgress = 0;
        this.init();
    }
    
    init() {
        if (this.items.length === 0) return;
        
        // Set initial active item
        this.updateItemStates();
        
        // Add scroll event listener with throttling
        this.throttledScroll = this.throttle(() => this.handleScroll(), 16);
        window.addEventListener('scroll', this.throttledScroll);
        
        // Add resize event listener
        window.addEventListener('resize', () => this.handleResize());
        
        // Smooth scroll for hero indicator
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator && this.container) {
            scrollIndicator.addEventListener('click', () => {
                this.container.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    handleScroll() {
        if (!this.container || !this.scrollArea) return;
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const containerStart = this.container.offsetTop;
        const containerHeight = this.scrollArea.offsetHeight;
        
        // Calculate scroll progress through the showcase section (0 to 1)
        const maxScroll = containerStart + containerHeight - windowHeight;
        this.scrollProgress = Math.max(0, Math.min(1, (scrollY - containerStart) / (containerHeight - windowHeight)));
        
        // Calculate which item should be active based on scroll position
        const itemScrollHeight = (containerHeight - windowHeight) / (this.totalItems - 1);
        let newIndex = 0;
        
        if (scrollY >= containerStart) {
            const scrollWithinSection = scrollY - containerStart;
            newIndex = Math.floor(scrollWithinSection / itemScrollHeight);
        }
        
        const clampedIndex = Math.max(0, Math.min(this.totalItems - 1, newIndex));
        
        if (clampedIndex !== this.currentIndex) {
            this.currentIndex = clampedIndex;
            this.updateItemStates();
        }
    }
    
    updateItemStates() {
        this.items.forEach((item, index) => {
            const distance = index - this.currentIndex;
            
            // Remove all state classes
            item.classList.remove('active', 'previous', 'next', 'far');
            
            if (distance === 0) {
                // Current active item
                item.classList.add('active');
            } else if (distance === -1) {
                // Previous item
                item.classList.add('previous');
            } else if (distance === 1) {
                // Next item
                item.classList.add('next');
            } else {
                // Far items
                item.classList.add('far');
            }
        });
    }
    
    handleResize() {
        // Reset on resize
        this.updateItemStates();
    }
}

// Header scroll effect
class HeaderScroll {
    constructor() {
        this.header = document.querySelector('.header');
        this.lastScrollY = window.scrollY;
        this.init();
    }
    
    init() {
        if (!this.header) return;
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            if (scrollY > 100) {
                this.header.style.background = 'rgba(255, 255, 255, 0.98)';
                this.header.style.boxShadow = '0 1px 20px rgba(0, 0, 0, 0.08)';
            } else {
                this.header.style.background = 'rgba(255, 255, 255, 0.95)';
                this.header.style.boxShadow = 'none';
            }
            
            // Hide header on scroll down
            if (scrollY > this.lastScrollY && scrollY > 100) {
                this.header.style.transform = 'translateY(-100%)';
            } else {
                this.header.style.transform = 'translateY(0)';
            }
            
            this.lastScrollY = scrollY;
        });
    }
}

// Section Navigation System
class SectionNavigation {
    constructor() {
        this.progressBar = document.getElementById('progressBar');
        this.navDots = document.querySelectorAll('.nav-dot');
        this.prevButton = document.getElementById('prevSection');
        this.nextButton = document.getElementById('nextSection');
        
        this.sections = document.querySelectorAll('.section');
        this.currentSectionIndex = 0;
        this.isScrolling = false;
        this.init();
    }
    
    init() {
        if (this.sections.length === 0) return;
        
        this.updateNavigation();
        
        // Add event listeners
        this.navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSection(index);
            });
        });

        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.goToSection(this.currentSectionIndex - 1);
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.goToSection(this.currentSectionIndex + 1);
            });
        }

        // Scroll event for section detection
        window.addEventListener('scroll', () => {
            if (this.isScrolling) return;
            this.detectCurrentSection();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToSection(this.currentSectionIndex - 1);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.goToSection(this.currentSectionIndex + 1);
            }
        });
    }
    
    updateNavigation() {
        // Update progress bar
        if (this.progressBar) {
            const progress = (this.currentSectionIndex / (this.sections.length - 1)) * 100;
            this.progressBar.style.height = `${progress}%`;
        }
        
        // Update dots
        this.navDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSectionIndex);
        });
        
        // Update buttons
        if (this.prevButton) {
            this.prevButton.disabled = this.currentSectionIndex === 0;
        }
        if (this.nextButton) {
            this.nextButton.disabled = this.currentSectionIndex === this.sections.length - 1;
        }
    }
    
    goToSection(index) {
        if (index >= 0 && index < this.sections.length && !this.isScrolling) {
            this.isScrolling = true;
            this.currentSectionIndex = index;
            
            this.sections[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            setTimeout(() => {
                this.isScrolling = false;
                this.updateNavigation();
            }, 800);
        }
    }
    
    detectCurrentSection() {
        let newIndex = 0;
        let minDistance = Infinity;

        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionMiddle = sectionTop + sectionHeight / 2;
            const distanceFromMiddle = Math.abs(window.scrollY + window.innerHeight / 2 - sectionMiddle);
            
            if (distanceFromMiddle < minDistance) {
                minDistance = distanceFromMiddle;
                newIndex = index;
            }
        });
        
        if (newIndex !== this.currentSectionIndex) {
            this.currentSectionIndex = newIndex;
            this.updateNavigation();
        }
    }
}

// Organic Background Animation - ПЕРЕРАБОТАННЫЙ И ИСПРАВЛЕННЫЙ
class OrganicBackground {
    constructor() {
        this.shapes = document.querySelectorAll('.organic-shape');
        this.container = document.querySelector('.floating-background');
        this.init();
    }
    
    init() {
        if (this.shapes.length === 0) {
            console.error('❌ No organic shapes found!');
            return;
        }
        
        console.log('🔥 OrganicBackground initialized with', this.shapes.length, 'shapes');
        
        // Принудительно показываем контейнер
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.visibility = 'visible';
            this.container.style.opacity = '1';
        }
        
        // Принудительный запуск анимаций
        this.forceAnimations();
        
        // Запуск анимаций с задержкой для каждого элемента
        this.shapes.forEach((shape, index) => {
            shape.style.animationDelay = `${index * 0.3}s`;
        });
        
        // Перезапуск анимаций через секунду для надежности
        setTimeout(() => this.forceAnimations(), 1000);
        
        // Случайные вариации каждые 20 секунд
        setInterval(() => this.addRandomVariations(), 20000);
    }
    
    forceAnimations() {
        console.log('🎯 Forcing animations to start...');
        
        this.shapes.forEach((shape, index) => {
            // Гарантируем видимость
            shape.style.visibility = 'visible';
            shape.style.display = 'block';
            shape.style.opacity = '0.3';
            shape.style.willChange = 'transform, opacity';
            
            // Принудительно запускаем анимации
            shape.style.animationPlayState = 'running';
            
            // Если анимации не применяются, принудительно их задаем
            const computedStyle = window.getComputedStyle(shape);
            const animationName = computedStyle.animationName;
            
            if (!animationName || animationName === 'none') {
                console.log(`🔄 Applying forced animations to shape-${index + 1}`);
                this.applyForcedAnimations(shape, index);
            }
        });
    }
    
    applyForcedAnimations(shape, index) {
        const animations = [
            { float: 'float1', pulse: 'pulse1' },
            { float: 'float2', pulse: 'pulse2' },
            { float: 'float3', pulse: 'pulse3' },
            { float: 'float4', pulse: 'pulse4' },
            { float: 'float5', pulse: 'pulse5' },
            { float: 'float6', pulse: 'pulse6' }
        ];
        
        if (animations[index]) {
            const floatTime = 20 + index * 2;
            const pulseTime = 8 + index * 1;
            
            shape.style.animation = `
                ${animations[index].float} ${floatTime}s ease-in-out infinite,
                ${animations[index].pulse} ${pulseTime}s ease-in-out infinite
            `;
        }
    }
    
    addRandomVariations() {
        this.shapes.forEach((shape, index) => {
            const randomSpeed = 0.8 + Math.random() * 0.4;
            const currentAnimations = window.getComputedStyle(shape).animation;
            
            if (currentAnimations && currentAnimations !== 'none') {
                const newAnimations = currentAnimations.split(', ').map(animation => {
                    return animation.replace(/(\d+)(?=s)/g, (match) => {
                        const time = parseFloat(match);
                        return (time * randomSpeed).toFixed(1);
                    });
                }).join(', ');
                
                shape.style.animation = newAnimations;
            }
        });
    }
}

// ОБНОВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing SUPER animations...');
    
    // Инициализация анимационного фона ПЕРВОЙ
    const organicBg = new OrganicBackground();
    
    // Инициализация остальных компонентов
    new TextAnimator();
    new ProjectShowcase();
    new HeaderScroll();
    new SectionNavigation();
    
    // Плавное появление body с гарантией
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.classList.add('loaded');
        console.log('✅ Body made visible');
    }, 100);
    
    // Дополнительный запуск через задержку
    setTimeout(() => {
        console.log('🎯 Final animation force...');
        organicBg.forceAnimations();
    }, 500);
    
    // Экстренный запуск если всё еще не видно
    setTimeout(() => {
        const shapes = document.querySelectorAll('.organic-shape');
        const bg = document.querySelector('.floating-background');
        
        if (bg) {
            bg.style.display = 'block';
            bg.style.visibility = 'visible';
            bg.style.opacity = '1';
        }
        
        shapes.forEach(shape => {
            shape.style.visibility = 'visible';
            shape.style.display = 'block';
            shape.style.opacity = '0.3';
            shape.style.animationPlayState = 'running';
        });
        
        console.log('🆘 Emergency visibility fix applied');
    }, 2000);
});

// Fallback на случай если DOMContentLoaded не сработал
window.addEventListener('load', () => {
    console.log('🔄 Window loaded, applying fallback animations...');
    
    const shapes = document.querySelectorAll('.organic-shape');
    const bg = document.querySelector('.floating-background');
    
    if (bg) {
        bg.style.display = 'block';
        bg.style.visibility = 'visible';
    }
    
    shapes.forEach(shape => {
        shape.style.visibility = 'visible';
        shape.style.display = 'block';
        shape.style.opacity = '0.3';
        shape.style.animationPlayState = 'running';
    });
});

// Обновите часть инициализации в DOMContentLoaded:
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing SUPER animations...');
    
    // Инициализация анимационного фона ПЕРВОЙ
    const organicBg = new OrganicBackground();
    
    // Инициализация остальных компонентов
    new TextAnimator();
    new ProjectShowcase();
    new HeaderScroll();
    new SectionNavigation();
    
    // Плавное появление body
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.animation = 'fadeInUp 1s ease-out';
    }, 100);
    
    // Дополнительный запуск через задержку
    setTimeout(() => {
        console.log('🎯 Forcing animations to start...');
        organicBg.forceAnimations();
    }, 500);
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing animations...');
    
    // Initialize organic background first
    const organicBg = new OrganicBackground();
    
    // Initialize other components
    new TextAnimator();
    new ProjectShowcase();
    new HeaderScroll();
    new SectionNavigation();
    
    // Fade in body
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Additional force start after a short delay
    setTimeout(() => {
        console.log('Forcing animations to start...');
        organicBg.forceAnimations();
        
        // One more attempt to ensure animations are running
        const shapes = document.querySelectorAll('.organic-shape');
        shapes.forEach(shape => {
            shape.style.animationPlayState = 'running';
        });
    }, 500);
});

// Fallback: if DOMContentLoaded doesn't fire, try on window load
window.addEventListener('load', () => {
    console.log('Window loaded, checking animations...');
    
    const shapes = document.querySelectorAll('.organic-shape');
    shapes.forEach(shape => {
        if (shape.style.animationPlayState !== 'running') {
            shape.style.animationPlayState = 'running';
        }
    });
});
