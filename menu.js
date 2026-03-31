// Управление стопкой карточек
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.recipe-card');
    let currentIndex = 0;
    
    // Данные для разных категорий с названиями, описаниями и фото
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
            { name: "Мясная пицца", description: "Нежное филе грудки индейки, ароматный бекон и тягучая моцарелла на томатном соусе. Итальянские травы раскрывают каждый вкус, создавая идеальную гармонию. Настоящая мясная бомба!", image: "8.png" },
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
    
    // Функция отображения карточки по индексу
    // Функция отображения карточки по индексу
function showCard(index) {
    const recipe = currentRecipes[index];
    const cardContent = document.querySelector('.card-content');
    
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
    
    // Функция смены категории
    function changeCategory(category) {
        currentRecipes = recipesByCategory[category];
        currentIndex = 0;
        showCard(currentIndex);
    }
    
    // Функция следующей карточки
    function nextCard() {
        if (currentIndex < currentRecipes.length - 1) {
            // Анимация исчезновения
            const card = document.querySelector('.recipe-card');
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateY(-30px)';
            
            setTimeout(() => {
                currentIndex++;
                showCard(currentIndex);
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300);
        }
    }
    
    // Функция предыдущей карточки
    function prevCard() {
        if (currentIndex > 0) {
            // Анимация исчезновения
            const card = document.querySelector('.recipe-card');
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                currentIndex--;
                showCard(currentIndex);
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300);
        }
    }
    
    // Обработчики для кнопок категорий
    const categoryBtns = document.querySelectorAll('.cat-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            if (category) {
                changeCategory(category);
                
                // Анимация активной кнопки
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Свайп для карточки
    let startY = 0;
    let isSwiping = false;
    const cardElement = document.querySelector('.recipe-card');
    
    function handleTouchStart(e) {
        startY = e.touches[0].clientY;
        isSwiping = true;
    }
    
    function handleTouchMove(e) {
        if (!isSwiping) return;
        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextCard();
            } else {
                prevCard();
            }
            isSwiping = false;
        }
    }
    
    function handleTouchEnd() {
        isSwiping = false;
    }
    
    if (cardElement) {
        cardElement.addEventListener('touchstart', handleTouchStart);
        cardElement.addEventListener('touchmove', handleTouchMove);
        cardElement.addEventListener('touchend', handleTouchEnd);
    }
    
    // Инициализация
    changeCategory('first');
    
    // Добавляем стиль для активной кнопки
    const style = document.createElement('style');
    style.textContent = `
        .cat-btn.active {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: scale(0.98);
        }
        
        .recipe-card {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
