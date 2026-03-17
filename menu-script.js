// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    // Fix for direct anchor navigation
    function handleAnchorNavigation() {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(function() {
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 140;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'instant'
                    });
                    
                    // Update active filter
                    const filterItems = document.querySelectorAll('.filter-item');
                    filterItems.forEach(item => {
                        item.classList.remove('selected-item');
                        if (item.getAttribute('href') === hash) {
                            item.classList.add('selected-item');
                        }
                    });
                }
            }, 100);
        }
    }

    // Initial anchor handling
    handleAnchorNavigation();

    // Smooth scroll for filter links
    const filterLinks = document.querySelectorAll('.filter-item');
    
    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 140;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active filter
                filterLinks.forEach(item => item.classList.remove('selected-item'));
                this.classList.add('selected-item');
                
                // Update URL hash without scrolling
                history.pushState(null, null, targetId);
            }
        });
    });

    // Update active filter on scroll
    let sections = document.querySelectorAll('.products-block');
    let filterItems = document.querySelectorAll('.filter-item');
    
    function updateActiveFilter() {
        let current = '';
        let scrollPosition = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.querySelector('.category-anchor').getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = sectionId;
            }
        });
        
        filterItems.forEach(item => {
            item.classList.remove('selected-item');
            if (item.getAttribute('href').substring(1) === current) {
                item.classList.add('selected-item');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveFilter);
});

// Simple image loading
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.photo');
    images.forEach(img => {
        img.style.opacity = '1';
    });
});
