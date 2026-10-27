"""Разбор сообщений для ВК-бота книги рецептов.

Здесь нет сети и файлов: только текст на входе и данные на выходе,
поэтому всё это легко проверить тестами (test_recipe_text.py).

Формат граммовок: 10г, 1,5кг, 310мл, 1л, 3шт, 0,5уп - без пробела;
2 ст.л., 1 ч.л. - с пробелом; дробная часть через запятую.
"""

import re

# ---------- Числа и единицы ----------

FRACTIONS = {'½': '0,5', '¼': '0,25', '¾': '0,75', '⅓': '0,33', '⅔': '0,67'}

# единицы, которые пишутся слитно с числом
TIGHT_UNITS = [
    ('кг', r'кг|килограмм(?:а|ов)?'),
    ('мг', r'мг|миллиграмм(?:а|ов)?'),
    ('г', r'гр|грамм(?:а|ов)?|г'),
    ('мл', r'мл|миллилитр(?:а|ов)?'),
    ('л', r'литр(?:а|ов)?|л'),
    ('шт', r'шт|штук(?:а|и)?'),
    ('уп', r'уп|упак|упаковк(?:а|и)?|упаковок'),
]

# ложки пишутся через пробел
SPOON_UNITS = [
    ('ст.л.', r'ст\.?\s*л|столов(?:ая|ые|ых)\s+ложк(?:а|и|ек)?|ст\s*л|стл'),
    ('ч.л.', r'ч\.?\s*л|чайн(?:ая|ые|ых)\s+ложк(?:а|и|ек)?|ч\s*л|чл'),
]

# слова, которые означают количество без числа
FREE_AMOUNTS = [
    'по вкусу', 'по желанию', 'щепотка', 'щепотку', 'для жарки', 'для подачи', 'для посыпки',
    'для формовки', 'для украшения', 'несколько капель', 'на кончике ножа',
]

NUMBER = r'\d+(?:[.,]\d+)?(?:\s*[-–/]\s*\d+(?:[.,]\d+)?)?|[½¼¾⅓⅔]'
UNIT_RE = '|'.join('(?:%s)' % pat for _, pat in TIGHT_UNITS + SPOON_UNITS)

# количество в конце строки: число + (единица или слово вроде «зубчика»)
AMOUNT_TAIL = re.compile(
    r'(?P<num>' + NUMBER + r')\s*(?P<unit>(?:' + UNIT_RE + r')\.?|[а-яё]+\.?)?\s*$',
    re.IGNORECASE,
)


def format_number(raw):
    """«0.5» -> «0,5», «1/2» -> «0,5», «2-3» остаётся диапазоном."""
    raw = raw.strip()
    if raw in FRACTIONS:
        return FRACTIONS[raw]
    m = re.fullmatch(r'(\d+)\s*/\s*(\d+)', raw)
    if m and int(m.group(2)) in (2, 3, 4) and int(m.group(1)) < int(m.group(2)):
        value = int(m.group(1)) / int(m.group(2))
        return ('%.2f' % value).rstrip('0').rstrip('.').replace('.', ',')
    raw = re.sub(r'\s*[-–]\s*', '-', raw)
    return raw.replace('.', ',')


def normalize_unit(word):
    """Возвращает (единица, слитно ли) или (None, None), если это не единица."""
    w = word.strip().lower().rstrip('.')
    w = re.sub(r'\s+', ' ', w)
    for unit, pat in TIGHT_UNITS:
        if re.fullmatch(pat, w):
            return unit, True
    for unit, pat in SPOON_UNITS:
        if re.fullmatch(pat, w.replace(' ', '')) or re.fullmatch(pat, w):
            return unit, False
    return None, None


def normalize_amount(text):
    """Приводит количество к формату книги: «310 мл» -> «310мл», «2ст.л» -> «2 ст.л.»."""
    t = text.strip().strip(',;').strip()
    if not t:
        return ''
    low = t.lower()
    for free in FREE_AMOUNTS:
        if low == free:
            return free
    m = re.fullmatch(r'(?P<num>' + NUMBER + r')\s*(?P<rest>.*)', t, re.IGNORECASE)
    if not m:
        return low if low in FREE_AMOUNTS else t
    num = format_number(m.group('num'))
    rest = m.group('rest').strip()
    if not rest:
        return num
    unit, tight = normalize_unit(rest)
    if unit:
        return num + unit if tight else num + ' ' + unit
    return num + ' ' + rest.rstrip('.').lower()


def capitalize(s):
    s = s.strip()
    return s[:1].upper() + s[1:] if s else s


def split_ingredient(item):
    """«тыква 1шт» / «Тыква - 1 шт.» / «соль по вкусу» -> («Тыква», «1шт»)."""
    item = re.sub(r'\s+', ' ', item.strip().strip('.,;').strip())
    if not item:
        return '', ''
    # явный разделитель: тире или двоеточие
    m = re.match(r'^(.+?)\s+[—–-]\s+(.+)$', item) or re.match(r'^(.+?)\s*:\s*(.+)$', item)
    if m:
        return capitalize(m.group(1)), normalize_amount(m.group(2))
    low = item.lower()
    for free in sorted(FREE_AMOUNTS, key=len, reverse=True):
        if low.endswith(' ' + free):
            return capitalize(item[:-len(free)].strip()), free
    # количество в конце; «Сливки 20% 400мл» - проценты остаются в названии
    m = AMOUNT_TAIL.search(item)
    if m and m.start() > 0:
        return capitalize(item[:m.start()].strip()), normalize_amount(item[m.start():])
    return capitalize(item), ''


def format_ingredient(name, amount):
    return name + ' — ' + amount if amount else name


def normalize_ingredient_line(line):
    """Строка ингредиента в формате книги «Название — количество»."""
    name, amount = split_ingredient(line)
    return format_ingredient(name, amount)


def split_list(text):
    """Делит перечень по запятым, точкам с запятой и строкам, не трогая «0,5»."""
    parts, buf = [], ''
    for i, ch in enumerate(text):
        if ch in ';\n':
            parts.append(buf)
            buf = ''
            continue
        if ch == ',':
            prev = text[i - 1] if i > 0 else ''
            nxt = text[i + 1] if i + 1 < len(text) else ''
            if prev.isdigit() and nxt.isdigit():
                buf += ch
                continue
            parts.append(buf)
            buf = ''
            continue
        buf += ch
    parts.append(buf)
    out = []
    for p in parts:
        p = re.sub(r'^\s*(?:[-–—•*]|\d+[.)])\s*', '', p).strip()
        if p:
            out.append(p)
    return out


# ---------- КБЖУ ----------

def format_nutrient(value):
    v = float(value.replace(',', '.'))
    if v >= 10 or v == int(v):
        return str(int(round(v)))
    return ('%.1f' % v).replace('.', ',')


def parse_kbju(text):
    """«120/5/6/12» (ккал/белки/жиры/углеводы) или «120 ккал, б 5, ж 6, у 12»."""
    t = text.lower()
    named = {}
    for key, pat in (('kcal', r'(\d+(?:[.,]\d+)?)\s*ккал|ккал\s*(\d+(?:[.,]\d+)?)'),
                     ('protein', r'б(?:елки|елок)?\s*[:=-]?\s*(\d+(?:[.,]\d+)?)'),
                     ('fat', r'ж(?:иры)?\s*[:=-]?\s*(\d+(?:[.,]\d+)?)'),
                     ('carbs', r'у(?:глеводы)?\s*[:=-]?\s*(\d+(?:[.,]\d+)?)')):
        m = re.search(pat, t)
        if m:
            named[key] = next(g for g in m.groups() if g)
    if len(named) == 4:
        return {k: format_nutrient(v) for k, v in named.items()}
    nums = re.findall(r'\d+(?:[.,]\d+)?', t)
    if len(nums) == 4:
        keys = ('kcal', 'protein', 'fat', 'carbs')
        return {k: format_nutrient(v) for k, v in zip(keys, nums)}
    return None


# ---------- Шаги ----------

NEED_RE = re.compile(
    r'\(\s*(?:понадоб(?:ится|ятся)|нужн(?:о|ы|а)|потребу(?:ется|ются)|возьмите|для этого)\s*:?\s*([^)]*)\)',
    re.IGNORECASE,
)


def split_steps(text):
    """«1. Почистите тыкву 2. Нарежьте...» -> список шагов. Номера идут по порядку."""
    text = text.strip()
    candidates = list(re.finditer(r'(?:^|(?<=[\s.!?)…]))(\d{1,2})\s*[.)](?!\d)', text))
    picked, expected = [], 1
    for m in candidates:
        if int(m.group(1)) == expected:
            picked.append(m)
            expected += 1
    if len(picked) >= 2 or (len(picked) == 1 and picked[0].start() == 0):
        steps = []
        for i, m in enumerate(picked):
            end = picked[i + 1].start() if i + 1 < len(picked) else len(text)
            steps.append(text[m.end():end].strip())
        return [s for s in steps if s]
    return [s.strip(' -–—•') for s in text.split('\n') if s.strip(' -–—•')]


def stem(word):
    w = word.lower().replace('ё', 'е')
    return w[:max(4, len(w) - 2)] if len(w) > 4 else w


def find_ingredient(name, ingredients):
    """Ищет ингредиент рецепта по слову из подсказки к шагу («тыкву» -> «Тыква — 1шт»)."""
    target = [stem(w) for w in re.findall(r'[а-яёa-z]+', name.lower()) if len(w) > 2]
    if not target:
        return None
    best, best_score = None, 0
    for line in ingredients:
        ing_name = line.split(' — ')[0].lower().replace('ё', 'е')
        words = [stem(w) for w in re.findall(r'[а-яёa-z]+', ing_name)]
        score = sum(1 for t in target if any(w.startswith(t) or t.startswith(w) for w in words))
        if score > best_score:
            best, best_score = line, score
    return best if best_score else None


def parse_step(text, ingredients):
    """Шаг с подсказкой «(понадобится тыква, сливки 200мл)» -> {text, detail}."""
    detail = []
    for m in NEED_RE.finditer(text):
        for item in re.split(r',|;|\sи\s', m.group(1)):
            item = item.strip()
            if not item:
                continue
            name, amount = split_ingredient(item)
            if amount:
                detail.append(format_ingredient(name, amount))
                continue
            found = find_ingredient(item, ingredients)
            detail.append(found if found else capitalize(item))
    clean = NEED_RE.sub('', text)
    clean = re.sub(r'\s+([.,!?])', r'\1', re.sub(r'\s{2,}', ' ', clean)).strip()
    if clean and clean[-1] not in '.!?…':
        clean += '.'
    step = {'text': capitalize(clean)}
    if detail:
        step['detail'] = detail
    return step


# ---------- Сообщение целиком ----------

LABELS = {
    'название': 'name', 'описание': 'description', 'раздел': 'category', 'категория': 'category',
    'кбжу': 'kbju', 'ингредиенты': 'ingredients', 'состав': 'ingredients',
    'приготовление': 'steps', 'шаги': 'steps', 'рецепт': 'steps',
    'ингредиент': 'ingredient', 'убрать ингредиент': 'remove_ingredient',
    'удалить ингредиент': 'remove_ingredient', 'добавить шаг': 'add_step',
    'удалить шаг': 'remove_step', 'убрать шаг': 'remove_step',
}
LABEL_RE = re.compile(
    r'^[ \t]*(?P<label>убрать ингредиент|удалить ингредиент|добавить шаг|удалить шаг|убрать шаг|'
    r'шаг\s*(?P<num>\d{1,2})|название|описание|раздел|категория|кбжу|ингредиенты|ингредиент|состав|'
    r'приготовление|шаги)[ \t]*:?',
    re.IGNORECASE | re.MULTILINE,
)


def split_sections(text):
    """Возвращает (текст до первой метки, [(ключ, номер шага или None, значение), ...])."""
    matches = list(LABEL_RE.finditer(text))
    head = text[:matches[0].start()] if matches else text
    sections = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        label = re.sub(r'\s+', ' ', m.group('label').lower())
        if m.group('num'):
            key, num = 'step', int(m.group('num'))
        else:
            key, num = LABELS[label], None
        sections.append((key, num, text[m.end():end].strip()))
    return head, sections


def match_category(text, categories):
    t = text.strip().lower().replace('ё', 'е')
    if not t:
        return None
    aliases = {
        'суп': 'first', 'супы': 'first', 'первое': 'first',
        'второе': 'second', 'горячее': 'second', 'основное': 'second',
        'выпечка': 'baking', 'несладкая выпечка': 'baking', 'выпечка несладкая': 'baking',
        'десерт': 'sweet', 'десерты': 'sweet', 'сладкое': 'sweet', 'выпечка сладкая': 'sweet', 'сладкая выпечка': 'sweet',
        'салат': 'salads', 'салаты': 'salads', 'напиток': 'drinks', 'напитки': 'drinks',
        'закуска': 'snacks', 'закуски': 'snacks', 'заготовка': 'preps', 'заготовки': 'preps',
    }
    if t in aliases:
        return aliases[t]
    for c in categories:
        name = c['name'].lower().replace('ё', 'е')
        if name == t or name.startswith(t) or t.startswith(name):
            return c['id']
    return None


def detect_command(text):
    """Что хочет человек: help, list, delete, edit, new."""
    first = text.strip().split('\n', 1)[0].strip()
    low = first.lower().rstrip('!.?')
    if low in ('помощь', 'help', 'старт', 'start', 'начать', 'привет', 'шаблон', 'как писать', '/start'):
        return 'help', None
    if low in ('список', 'все рецепты', 'рецепты', 'что есть'):
        return 'list', None
    m = re.match(r'^(удалить|убрать)\s*(?:рецепт)?\s*:\s*(.+)$', first, re.IGNORECASE)
    if m:
        return 'delete', m.group(2).strip()
    m = re.match(r'^(изменить|исправить|редактировать|поменять)\s*(?:рецепт)?\s*:?\s*(.+)$', first, re.IGNORECASE)
    if m:
        return 'edit', m.group(2).strip()
    return 'new', None


def parse_new_recipe(text, categories):
    """Новый рецепт: первая строка - название, дальше описание и метки."""
    errors, warnings = [], []
    lines = text.strip().split('\n')
    name = lines[0].strip().strip('.')
    rest = '\n'.join(lines[1:])
    head, sections = split_sections(rest)
    recipe = {'name': capitalize(name), 'description': '', 'category': None, 'nutrition': {},
              'ingredients': [], 'steps': []}

    desc = re.sub(r'^\s*описание\s*:?', '', head.strip(), flags=re.IGNORECASE).strip()
    recipe['description'] = re.sub(r'\s*\n\s*', ' ', desc)

    raw_steps = None
    for key, _num, value in sections:
        if key == 'name':
            recipe['name'] = capitalize(value.split('\n')[0].strip())
        elif key == 'description':
            recipe['description'] = re.sub(r'\s*\n\s*', ' ', value)
        elif key == 'category':
            recipe['category'] = match_category(value, categories)
            if not recipe['category']:
                errors.append('Не поняла раздел «%s». Есть: %s.' % (value, ', '.join(c['name'] for c in categories)))
        elif key == 'kbju':
            n = parse_kbju(value)
            if n:
                recipe['nutrition'] = n
            else:
                errors.append('Не поняла КБЖУ «%s». Пиши четыре числа: ккал/белки/жиры/углеводы, например 120/5/6/12.' % value)
        elif key == 'ingredients':
            recipe['ingredients'] = [normalize_ingredient_line(x) for x in split_list(value)]
        elif key == 'steps':
            raw_steps = value

    if raw_steps:
        recipe['steps'] = [parse_step(s, recipe['ingredients']) for s in split_steps(raw_steps)]

    if not recipe['name']:
        errors.append('Нет названия: напиши его первой строкой.')
    if not recipe['ingredients']:
        errors.append('Нет ингредиентов: добавь строку «Ингредиенты: ...».')
    if not recipe['steps']:
        errors.append('Нет шагов: добавь «Приготовление: 1. ... 2. ...».')
    if not recipe['category'] and not any(k == 'category' for k, _, _ in sections):
        errors.append('Нет раздела: добавь строку «Раздел: Первое» (или Второе, Десерты...).')
    if not recipe['nutrition'] and not any(k == 'kbju' for k, _, _ in sections):
        warnings.append('КБЖУ не указаны - на сайте этот блок просто не покажется.')
    if not recipe['description']:
        warnings.append('Описания нет - на сайте будет только название.')
    for line in recipe['ingredients']:
        if ' — ' not in line:
            warnings.append('У «%s» нет количества - проверь.' % line)
    return recipe, errors, warnings


def apply_edit(recipe, text, categories):
    """Правка существующего рецепта: меняются только указанные метки. Возвращает (изменения, ошибки)."""
    _first, _, rest = text.strip().partition('\n')
    _head, sections = split_sections(rest)
    changes, errors = [], []
    for key, num, value in sections:
        if key == 'name' and value:
            recipe['name'] = capitalize(value.split('\n')[0].strip())
            changes.append('название')
        elif key == 'description':
            recipe['description'] = re.sub(r'\s*\n\s*', ' ', value)
            changes.append('описание')
        elif key == 'category':
            cat = match_category(value, categories)
            if cat:
                recipe['category'] = cat
                changes.append('раздел')
            else:
                errors.append('Не поняла раздел «%s».' % value)
        elif key == 'kbju':
            n = parse_kbju(value)
            if n:
                recipe['nutrition'] = n
                changes.append('КБЖУ')
            else:
                errors.append('Не поняла КБЖУ «%s» - нужно 4 числа: ккал/белки/жиры/углеводы.' % value)
        elif key == 'ingredients':
            recipe['ingredients'] = [normalize_ingredient_line(x) for x in split_list(value)]
            changes.append('все ингредиенты')
        elif key == 'ingredient':
            for item in split_list(value):
                name, amount = split_ingredient(item)
                line = format_ingredient(name, amount)
                found = find_ingredient(name, recipe['ingredients'])
                if found:
                    recipe['ingredients'][recipe['ingredients'].index(found)] = line
                    changes.append('ингредиент «%s»' % line)
                else:
                    recipe['ingredients'].append(line)
                    changes.append('новый ингредиент «%s»' % line)
        elif key == 'remove_ingredient':
            for item in split_list(value):
                found = find_ingredient(item, recipe['ingredients'])
                if found:
                    recipe['ingredients'].remove(found)
                    changes.append('убран ингредиент «%s»' % found)
                else:
                    errors.append('Не нашла ингредиент «%s».' % item)
        elif key == 'steps':
            recipe['steps'] = [parse_step(s, recipe['ingredients']) for s in split_steps(value)]
            changes.append('все шаги')
        elif key == 'step':
            if 1 <= num <= len(recipe['steps']):
                recipe['steps'][num - 1] = parse_step(value, recipe['ingredients'])
                changes.append('шаг %d' % num)
            elif num == len(recipe['steps']) + 1:
                recipe['steps'].append(parse_step(value, recipe['ingredients']))
                changes.append('новый шаг %d' % num)
            else:
                errors.append('В рецепте %d шагов, шага %d нет.' % (len(recipe['steps']), num))
        elif key == 'add_step':
            recipe['steps'].append(parse_step(value, recipe['ingredients']))
            changes.append('новый шаг %d' % len(recipe['steps']))
        elif key == 'remove_step':
            m = re.search(r'\d+', value)
            n = int(m.group()) if m else 0
            if 1 <= n <= len(recipe['steps']):
                recipe['steps'].pop(n - 1)
                changes.append('убран шаг %d' % n)
            else:
                errors.append('Не нашла шаг «%s».' % value)
    return changes, errors


# ---------- Поиск рецепта по названию ----------

def norm_name(s):
    return re.sub(r'[^a-zа-я0-9]+', ' ', s.lower().replace('ё', 'е')).strip()


def find_recipe(name, recipes):
    """Точное совпадение названия, иначе единственное частичное. Возвращает (рецепт, похожие)."""
    target = norm_name(name)
    for r in recipes:
        if norm_name(r['name']) == target:
            return r, []
    partial = [r for r in recipes if target and (target in norm_name(r['name']) or norm_name(r['name']) in target)]
    if len(partial) == 1:
        return partial[0], []
    return None, partial


# ---------- id для нового блюда ----------

TRANSLIT = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
                    ['a', 'b', 'v', 'g', 'd', 'e', 'e', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p',
                     'r', 's', 't', 'u', 'f', 'h', 'ts', 'ch', 'sh', 'sch', '', 'y', '', 'e', 'yu', 'ya']))


def make_id(name, taken):
    s = ''.join(TRANSLIT.get(ch, ch) for ch in name.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:48].strip('-') or 'recipe'
    base, i = s, 2
    while s in taken:
        s = '%s-%d' % (base, i)
        i += 1
    return s
