const phrases1 = ["We cook", "We love"];
const phrases2 = ["Recipe book", "Рецепты"];
const phrases3 = ["Je t'aime", "i kiss you", "WE"];

let index1 = 0, index2 = 0, index3 = 0;
const text1 = document.getElementById('text1');
const text2 = document.getElementById('text2');
const text3 = document.getElementById('text3');
const photo = document.getElementById('photo');
const button = document.getElementById('recipeButton');

// Плавное появление фото
if (photo) {
    photo.style.opacity = '0';
    setTimeout(() => {
        photo.style.transition = 'opacity 2.5s ease';
        photo.style.opacity = '0.8';
    }, 100);
}

function animateText(element, phrases, currentIndex, delay) {
    setTimeout(function animate() {
        if (!element) return;
        element.style.transition = 'opacity 1s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % phrases.length;
            element.textContent = phrases[currentIndex];
            element.style.opacity = '1';
            
            const nextDelay = 5000 + Math.floor(Math.random() * 4000);
            setTimeout(animate, nextDelay);
        }, 1000);
    }, delay);
    
    return currentIndex;
}

// Запуск анимации текста
if (text1) index1 = animateText(text1, phrases1, index1, 2000);
if (text2) index2 = animateText(text2, phrases2, index2, 4500);
if (text3) index3 = animateText(text3, phrases3, index3, 7000);

// Обработчик кнопки - переход на menu.html
if (button) {
    button.addEventListener('click', () => {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
            window.location.href = 'menu.html';
        }, 100);
    });
}

// ===== ПРОКРУТКА С ТОЧКАМИ (только для веб-версии) =====
function isDesktop() {
    return window.innerWidth > 768;
}

function createSectionDots() {
    const sections = document.querySelectorAll('.section');
    const navDots = document.getElementById('navDots');
    if (!navDots || sections.length === 0) return;
    
    navDots.innerHTML = '';
    sections.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('nav-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => scrollToSection(index));
        navDots.appendChild(dot);
    });
}

function scrollToSection(index) {
    const sections = document.querySelectorAll('.section');
    if (index < 0 || index >= sections.length) return;
    sections[index].scrollIntoView({ behavior: 'smooth' });
}

function updateActiveDot() {
    const sections = document.querySelectorAll('.section');
    const dots = document.querySelectorAll('.nav-dot');
    const progressBar = document.getElementById('progressBar');
    
    if (sections.length === 0 || dots.length === 0) return;
    
    let currentIndex = 0;
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentIndex = i;
            break;
        }
    }
    
    dots.forEach((dot, i) => {
        if (i === currentIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    if (progressBar) {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
        progressBar.style.height = scrollPercent + '%';
    }
    
    const prevBtn = document.getElementById('prevSection');
    const nextBtn = document.getElementById('nextSection');
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === sections.length - 1;
}

function initNavButtons() {
    const prevBtn = document.getElementById('prevSection');
    const nextBtn = document.getElementById('nextSection');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const sections = document.querySelectorAll('.section');
            let currentIndex = 0;
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentIndex = i;
                    break;
                }
            }
            scrollToSection(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const sections = document.querySelectorAll('.section');
            let currentIndex = 0;
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentIndex = i;
                    break;
                }
            }
            scrollToSection(currentIndex + 1);
        });
    }
}

function initDesktopNav() {
    const sectionNav = document.getElementById('sectionNav');
    if (!sectionNav) return;
    
    if (!isDesktop()) {
        sectionNav.style.display = 'none';
        return;
    }
    
    sectionNav.style.display = 'flex';
    createSectionDots();
    initNavButtons();
    
    window.addEventListener('scroll', updateActiveDot);
    window.addEventListener('resize', () => {
        if (!isDesktop()) {
            sectionNav.style.display = 'none';
        } else {
            sectionNav.style.display = 'flex';
            createSectionDots();
            updateActiveDot();
        }
    });
    
    updateActiveDot();
}

// Запуск навигации после загрузки страницы
setTimeout(initDesktopNav, 100);
