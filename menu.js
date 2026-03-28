// Плавное появление контента
document.addEventListener('DOMContentLoaded', () => {
    // Плавное появление текста
    const menuTitle = document.querySelector('.menu-title');
    const placeholderText = document.querySelector('.placeholder-text');
    
    if (menuTitle) {
        menuTitle.style.opacity = '0';
        menuTitle.style.transform = 'translateY(20px)';
        menuTitle.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            menuTitle.style.opacity = '1';
            menuTitle.style.transform = 'translateY(0)';
        }, 200);
    }
    
    if (placeholderText) {
        placeholderText.style.opacity = '0';
        placeholderText.style.transform = 'translateY(20px)';
        placeholderText.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            placeholderText.style.opacity = '1';
            placeholderText.style.transform = 'translateY(0)';
        }, 400);
    }
});
