// Управление стопкой карточек
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.recipe-card');
    let currentIndex = 0;
    
    // Данные для разных категорий
    const recipesByCategory = {
        first: [
            { name: "Суп Фо бо", description: "Ароматный бульон, нежная говядина, свежий лайм и охлаждающая мята создают невероятный баланс — насыщенный, яркий и гармоничный. Это не просто суп, это кулинарное путешествие во Вьетнам!", image: "1.png" },
            { name: "Борщ", description: "Наваристый красный борщ со сметаной и пампушками", image: "2.png" },
            { name: "Тыквенный крем-суп", description: "Нежный крем-суп из печёной тыквы со сливочными нотками", image: "3.png" }
        ],
        second: [
            { name: "Чахохбили ", description: "Простое, но очень вкусное грузинское блюдо - курочка, тушёная с помидорами и специями. Мясо получается мягким и сочным, а томатный соус - ароматным. Хмели-сунели, кориандр и зелень добавляют характерный грузинский колорит.", image: "4.png" },
            { name: "Минтай с черри помидорками", description: "Нежное филе минтая, обжаренное до золотистой корочки, сочетается с яркими черри-томатами, которые лопаются во рту, оставляя сладковатый след. Лёгкая лимонная нотка завершает вкус — свежо, просто и изысканно.", image: "l5.png" },
            { name: "Курочка в кисло-сладком соусе", description: "Нежная курочка по-гонконгски в хрустящей корочке, политая кисло-сладким соусом с кусочками спелого ананаса. Взрыв вкуса: острое, сладкое и пикантное в каждом укусе. Просто бомба!", image: "l6.png" }
        ],
        sweet: [
            { name: "Мясная пицца", description: "Нежное филе грудки индейки, ароматный бекон и тягучая моцарелла на томатном соусе. Итальянские травы раскрывают каждый вкус, создавая идеальную гармонию. Настоящая мясная бомба!", image: "Рисунок8.png" },
            { name: "Пицца камамбер", description: "Нежная груша, томленый камамбер с благородной плесенью и горный мёд создают гармонию сладкого, пикантного и сливочного. Хрустящая основа, тающая начинка – это не просто пицца, а десерт для гурманов!", image: "9.png" },
            { name: "Лимончелло", description: "Освежающий десерт с лимонным кремом и обожжённой меренгой", image: "l4.png" }
        ],
        salads: [
            { name: "Цезарь", description: "Классический салат с курицей, пармезаном и соусом цезарь", image: "l4.png" },
            { name: "Вителло-тоннато", description: "Изысканная говядина су-вид с соусом тоннато", image: "l4.png" },
            { name: "Салат с ростбифом", description: "Сочный ростбиф с миксом салата и печёным перцем", image: "l4.png" }
        ],
        drinks: [
            { name: "Эспрессо", description: "Крепкий и ароматный кофе для бодрости", image: "l4.png" },
            { name: "Капучино", description: "Нежный кофе с пышной молочной пенкой", image: "l4.png" },
            { name: "Масала", description: "Пряный индийский чай с молоком и специями", image: "l4.png" }
        ],
        snacks: [
            { name: "Хачапури", description: "Грузинская лепёшка с расплавленным сыром и яйцом", image: "l4.png" },
            { name: "Курица чили", description: "Пикантная курица с чеддером и халапеньо", image: "l4.png" },
            { name: "С креветками", description: "Нежные креветки с авокадо и айоли", image: "l4.png" }
        ],
        preps: [
            { name: "Соленья", description: "Домашние солёные огурчики и помидорчики", image: "l4.png" },
            { name: "Варенье", description: "Ароматное варенье из ягод и фруктов", image: "l4.png" },
            { name: "Маринады", description: "Пряные маринады для мяса и овощей", image: "l4.png" }
        ],
        combo: [
            { name: "Комбо №1", description: "Сытный обед: суп + второе + салат", image: "l4.png" },
            { name: "Комбо №2", description: "Перекус: закуска + напиток + десерт", image: "l4.png" },
            { name: "Семейный обед", description: "Большой набор для всей семьи на 4 персоны", image: "l4.png" }
        ]
    };
    
    let currentRecipes = recipesByCategory.first;
    let isAnimating = false;
    let isBouncing = false;
    
    function showCard(index) {
        const recipe = currentRecipes[index];
        const cardContent = document.querySelector('.recipe-card .card-content');
        
        if (cardContent && recipe) {
            cardContent.innerHTML = `
                <div style="display: flex; flex-direction: column; height: 100%; position: relative;">
                    <h3 style="font-family: 'New', sans-serif; color: #5a3921; margin-bottom: 8px; font-size: 20px; margin-top: 5px;">${recipe.name}</h3>
                    <p style="font-family: 'Mon'; color: #5a3921; opacity: 0.8; font-size: 11px; text-align: right; line-height: 1.4; margin-bottom: 12px;">${recipe.description}</p>
                    <img src="${recipe.image}" style="width: 304px; height: 250px; object-fit: cover; border-radius: 16px; position: absolute; bottom: -70px; right: -20px; opacity: 0.9;" alt="${recipe.name}">
                </div>
            `;
        }
    }
    
    function changeCategory(category) {
        if (recipesByCategory[category]) {
            currentRecipes = recipesByCategory[category];
            currentIndex = 0;
            showCard(currentIndex);
        }
    }
    
    function nextCard() {
        if (isAnimating || isBouncing) return;
        if (currentIndex < currentRecipes.length - 1) {
            isAnimating = true;
            const card = document.querySelector('.recipe-card');
            card.classList.add('fade-out-up');
            
            setTimeout(() => {
                currentIndex++;
                showCard(currentIndex);
                card.classList.remove('fade-out-up');
                isAnimating = false;
            }, 350);
        }
    }
    
    function prevCard() {
        if (isAnimating || isBouncing) return;
        if (currentIndex > 0) {
            isAnimating = true;
            const card = document.querySelector('.recipe-card');
            card.classList.add('fade-out-down');
            
            setTimeout(() => {
                currentIndex--;
                showCard(currentIndex);
                card.classList.remove('fade-out-down');
                isAnimating = false;
            }, 350);
        }
    }
    
    // Функция "пружинного" эффекта при достижении границы
    function bounceCard(direction) {
        if (isBouncing) return;
        isBouncing = true;
        const card = document.querySelector('.recipe-card');
        
        if (direction === 'up') {
            // Свайп вверх на первой карточке — дёргаем вверх
            card.style.transform = 'translateY(-15px)';
            setTimeout(() => {
                card.style.transform = '';
                setTimeout(() => { isBouncing = false; }, 50);
            }, 100);
        } else if (direction === 'down') {
            // Свайп вниз на последней карточке — дёргаем вниз
            card.style.transform = 'translateY(15px)';
            setTimeout(() => {
                card.style.transform = '';
                setTimeout(() => { isBouncing = false; }, 50);
            }, 100);
        }
    }
    
    // Кнопки категорий
    const categoryBtns = document.querySelectorAll('.cat-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            if (category) {
                changeCategory(category);
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Избранное
    const favoritePhoto = document.getElementById('favoriteIcon');
    if (favoritePhoto) {
        favoritePhoto.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'favorites.html';
        });
    }
    
    // ЛИСТАНИЕ КАРТОЧЕК С BOUNCE-ЭФФЕКТОМ
    let touchStartY = 0;
    let touchStartX = 0;
    let isSwiping = false;
    let swipeThreshold = 40;
    const cardEl = document.querySelector('.recipe-card');
    
    function onTouchStart(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
    }
    
    function onTouchMove(e) {
        if (!isSwiping || isAnimating || isBouncing) return;
        
        const deltaY = e.touches[0].clientY - touchStartY;
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        
        if (deltaX < 30 && Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0) {
                // Свайп вниз
                if (currentIndex > 0) {
                    prevCard();
                } else {
                    bounceCard('down');
                }
            } else {
                // Свайп вверх
                if (currentIndex < currentRecipes.length - 1) {
                    nextCard();
                } else {
                    bounceCard('up');
                }
            }
            isSwiping = false;
        }
    }
    
    function onTouchEnd() {
        isSwiping = false;
    }
    
    if (cardEl) {
        cardEl.addEventListener('touchstart', onTouchStart, { passive: false });
        cardEl.addEventListener('touchmove', onTouchMove, { passive: false });
        cardEl.addEventListener('touchend', onTouchEnd);
    }
    
    // Клик по карточке
    const recipeCard = document.querySelector('.recipe-card');
    if (recipeCard) {
        recipeCard.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentRecipe = currentRecipes[currentIndex];
            if (currentRecipe) {
                const recipeName = currentRecipe.name.trim();
                localStorage.setItem('selectedRecipe', recipeName);
                
                let targetPage = '';
                if (recipeName === 'Мясная пицца') targetPage = 'pizzasuper.html';
                else if (recipeName === 'Суп Фо бо') targetPage = 'phobo.html';
                else if (recipeName === 'Борщ') targetPage = 'borsh.html';
                else if (recipeName === 'Тыквенный крем-суп') targetPage = 'pumpkin.html';
                else if (recipeName === 'Чахохбили') targetPage = 'chahohbili.html';
                else if (recipeName === 'Минтай с черри помидорками') targetPage = 'mintai.html';
                else if (recipeName === 'Курочка в кисло-сладком соусе') targetPage = 'kurochka.html';
                else if (recipeName === 'Пицца камамбер') targetPage = 'kamamber.html';
                else if (recipeName === 'Лимончелло') targetPage = 'limonchello.html';
                else targetPage = 'recipe-default.html';
                
                window.location.href = targetPage;
            }
        });
    }
    
    // Инициализация
    changeCategory('first');
    const firstBtn = document.querySelector('.cat-btn[data-category="first"]');
    if (firstBtn) firstBtn.classList.add('active');
});
