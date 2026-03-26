const phrases1 = ["We cook", "We love"];
const phrases2 = ["Recipe book", "Рецепты"];
const phrases3 = ["Je t'aime", "i kiss you", "WE"];

let index1 = 0, index2 = 0, index3 = 0;
const text1 = document.getElementById('text1');
const text2 = document.getElementById('text2');
const text3 = document.getElementById('text3');
const photo = document.getElementById('photo');
const button = document.getElementById('recipeButton');

photo.style.opacity = '0';
setTimeout(() => {
    photo.style.transition = 'opacity 2.5s ease';
    photo.style.opacity = '0.7';
}, 100);

function animateText(element, phrases, currentIndex, delay) {
    setTimeout(function animate() {
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

index1 = animateText(text1, phrases1, index1, 2000);
index2 = animateText(text2, phrases2, index2, 4500);
index3 = animateText(text3, phrases3, index3, 7000);

button.addEventListener('click', () => {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => { button.style.transform = ''; }, 100);
    alert('Переход к рецептам');
});