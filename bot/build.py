"""Собирает recipes.js для сайта из data/recipes.json.

Источник правды - data/recipes.json: его правит ВК-бот (или человек руками),
а recipes.js после этого пересобирается: python bot/build.py
"""

import hashlib
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'recipes.json')
OUT = os.path.join(ROOT, 'recipes.js')

HEADER = '''// Книга рецептов: категории и все блюда.
// Этот файл собирается автоматически из data/recipes.json - правьте рецепты через ВК-бота
// или в data/recipes.json, а потом запустите python bot/build.py.
// Шаг с полем detail открывает подсказку с нужными ингредиентами.
// nutrition можно оставить пустым {} - тогда КБЖУ не показывается.
'''


def J(v):
    return json.dumps(v, ensure_ascii=False)


def load():
    with open(DATA, encoding='utf8') as f:
        return json.load(f)


def save(data):
    with open(DATA, 'w', encoding='utf8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')


def render(data):
    o = [HEADER, 'const CATEGORIES = [']
    cats = data['categories']
    for i, c in enumerate(cats):
        o.append("    { id: '%s', name: '%s' }%s" % (c['id'], c['name'], ',' if i < len(cats) - 1 else ''))
    o.append('];\n')
    o.append('const RECIPES = [')
    recipes = data['recipes']
    for i, r in enumerate(recipes):
        o.append('    {')
        o.append('        id: %s,' % J(r['id']))
        o.append('        name: %s,' % J(r['name']))
        o.append('        category: %s,' % J(r['category']))
        o.append('        image: %s, width: %d, height: %d,' % (J(r['image']), r['width'], r['height']))
        o.append('        description: %s,' % J(r.get('description', '')))
        n = r.get('nutrition') or {}
        o.append('        nutrition: %s,' % ('{ ' + ', '.join('%s: %s' % (k, J(v)) for k, v in n.items()) + ' }' if n else '{}'))
        o.append('        ingredients: [')
        o.append(',\n'.join('            ' + J(x) for x in r['ingredients']))
        o.append('        ],')
        o.append('        steps: [')
        st = []
        for s in r['steps']:
            if s.get('detail'):
                st.append('            { text: %s,\n              detail: %s }' % (J(s['text']), J(s['detail'])))
            else:
                st.append('            { text: %s }' % J(s['text']))
        o.append(',\n'.join(st))
        o.append('        ]')
        o.append('    }' + (',' if i < len(recipes) - 1 else ''))
    o.append('];')
    return '\n'.join(o) + '\n'


PAGES = [os.path.join(ROOT, 'menu.html')]


def build(data=None):
    """Пишет recipes.js и меняет ?v= в ссылке на него, чтобы браузеры сразу взяли новый список."""
    data = data or load()
    text = render(data)
    with open(OUT, 'w', encoding='utf8', newline='\n') as f:
        f.write(text)
    version = hashlib.sha1(text.encode('utf8')).hexdigest()[:8]
    for page in PAGES:
        with open(page, encoding='utf8', newline='') as f:
            html = f.read()
        new = re.sub(r'recipes\.js\?v=[\w-]+', 'recipes.js?v=' + version, html)
        if new != html:
            with open(page, 'w', encoding='utf8', newline='') as f:
                f.write(new)


if __name__ == '__main__':
    build()
    print('recipes.js собран, рецептов: %d' % len(load()['recipes']))
