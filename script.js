const phrases1 = ["We cook", "We love"];
const phrases2 = ["Recipe book", "Рецепты"];
const phrases3 = ["Je t'aime", "cooking", "WE"];

const text1 = document.getElementById('text1');
const text2 = document.getElementById('text2');
const text3 = document.getElementById('text3');
const photo = document.getElementById('photo');
const button = document.getElementById('recipeButton');
const pageFade = document.getElementById('pageFade');

// Плавное появление страницы и фото
requestAnimationFrame(() => {
    if (pageFade) pageFade.classList.add('is-hidden');
    if (photo) setTimeout(() => photo.classList.add('is-in'), 150);
});

// Смена фраз: каждая строка живёт своим ритмом
function animateText(element, phrases, delay) {
    let index = 0;
    setTimeout(function animate() {
        element.classList.add('is-out');
        setTimeout(() => {
            index = (index + 1) % phrases.length;
            element.textContent = phrases[index];
            element.classList.remove('is-out');
            setTimeout(animate, 5000 + Math.floor(Math.random() * 4000));
        }, 900);
    }, delay);
}

if (text1) animateText(text1, phrases1, 2000);
if (text2) animateText(text2, phrases2, 4500);
if (text3) animateText(text3, phrases3, 7000);

// Кнопка: короткое нажатие, затухание и переход к рецептам
if (button) {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        if (pageFade) pageFade.classList.remove('is-hidden');
        setTimeout(() => { window.location.href = button.getAttribute('href'); }, 380);
    });
}

// Возврат кнопкой «назад» в Safari показывает страницу из кэша - снимаем затемнение
window.addEventListener('pageshow', () => {
    if (pageFade) pageFade.classList.add('is-hidden');
});
