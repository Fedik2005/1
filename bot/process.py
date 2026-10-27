"""Обработчик сообщения ВК-бота. Запускается в GitHub Actions (.github/workflows/vk-bot.yml).

Берёт сообщение из события, меняет data/recipes.json и фото в img/,
пересобирает recipes.js, коммитит и пушит, а потом отвечает в ВК.

Проверка без сети и коммитов:
    python bot/process.py --dry-run --text-file сообщение.txt [--image фото.png]
"""

import argparse
import io
import json
import os
import random
import subprocess
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build  # noqa: E402
import recipe_text as rt  # noqa: E402

ROOT = build.ROOT
SITE_URL = os.environ.get('SITE_URL', 'https://fedik2005.github.io/1/')
VK_API = 'https://api.vk.com/method/'
VK_VERSION = '5.199'

HELP = """Как добавить рецепт: пришли одним сообщением фото блюда файлом (PNG с прозрачным фоном) и текст:

Тыквенный крем-суп
Нежный суп из запечённой тыквы со сливками.
Раздел: Первое
КБЖУ: 62/1,4/3,2/7
Ингредиенты: тыква 1шт, сливки 20% 200мл, лук 1шт, соль по вкусу
Приготовление: 1. Почистите тыкву (понадобится тыква) 2. Обжарьте лук (понадобится лук) 3. ...

КБЖУ - на 100 г: ккал/белки/жиры/углеводы.
Граммовки приведу к виду 10г, 1кг, 310мл, 1л, 2 ст.л., 1 ч.л., 3шт, 0,5уп.
В скобках (понадобится ...) - что показать в подсказке к шагу.

Как изменить рецепт (меняется только то, что написано):
Изменить: Шарлотка
КБЖУ: 183/5,7/4,7/29
Ингредиент: сахар 80г
Шаг 2: Выпекайте 25 минут (понадобится сахар)

Ещё можно: Название, Описание, Раздел, Ингредиенты (весь список), Приготовление (все шаги), Добавить шаг, Удалить шаг: 3, Убрать ингредиент: корица. Новое фото - прикрепи файл к сообщению «Изменить».

Удалить: Шарлотка - убрать рецепт
Список - все рецепты"""


# ---------- ВК ----------

def vk_send(peer_id, text):
    token = os.environ.get('VK_TOKEN')
    if not token or not peer_id:
        print('--- ответ в ВК ---\n' + text)
        return
    for chunk in [text[i:i + 3900] for i in range(0, len(text), 3900)] or ['']:
        data = urllib.parse.urlencode({
            'access_token': token, 'v': VK_VERSION, 'peer_id': peer_id,
            'random_id': random.randint(1, 2 ** 31 - 1), 'message': chunk, 'dont_parse_links': 1,
        }).encode()
        with urllib.request.urlopen(urllib.request.Request(VK_API + 'messages.send', data=data), timeout=30) as resp:
            answer = json.load(resp)
        if 'error' in answer:
            print('Ошибка ВК:', answer['error'])


# ---------- Фото ----------

def download(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 recipe-bot'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def save_image(raw, recipe_id):
    """Обрезает прозрачные поля, уменьшает до 900px и сохраняет в img/<id>.webp."""
    from PIL import Image, ImageOps
    warnings = []
    im = Image.open(io.BytesIO(raw))
    im = ImageOps.exif_transpose(im)
    im = im.convert('RGBA')
    alpha = im.getchannel('A')
    lo, _hi = alpha.getextrema()
    if lo > 250:
        warnings.append('У фото нет прозрачного фона - похоже, ВК его сжал. Пришли PNG как файл '
                        '(скрепка → Файл), тогда тарелка будет без фона, как у остальных блюд.')
    else:
        box = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
        if box:
            im = im.crop(box)
    im.thumbnail((900, 900), Image.LANCZOS)
    rel = 'img/%s.webp' % recipe_id
    im.save(os.path.join(ROOT, rel), 'WEBP', quality=82, method=6)
    return rel, im.size[0], im.size[1], warnings


def pick_image(files):
    """Предпочитает файл (сохраняет прозрачность), иначе самое большое фото."""
    docs = [f for f in files if f.get('kind') == 'doc' and (f.get('ext') or '').lower() in ('png', 'webp', 'jpg', 'jpeg')]
    photos = [f for f in files if f.get('kind') == 'photo']
    chosen = (docs or photos or [None])[0]
    return chosen


# ---------- git ----------

def git(*args, check=True):
    return subprocess.run(['git', *args], cwd=ROOT, check=check, capture_output=True, text=True)


def publish(message, paths):
    git('config', 'user.name', 'ВК-бот книги рецептов')
    git('config', 'user.email', 'recipe-bot@users.noreply.github.com')
    git('add', '--all', '--', *paths)
    if not git('diff', '--cached', '--quiet', check=False).returncode:
        return False
    git('commit', '-m', message + '\n\nОтправлено через ВК-бота.')
    for _ in range(3):
        if git('push', check=False).returncode == 0:
            break
        git('pull', '--rebase', check=False)
    else:
        raise RuntimeError('не получилось отправить изменения на GitHub')
    request_pages_build()
    return True


def request_pages_build():
    token, repo = os.environ.get('GITHUB_TOKEN'), os.environ.get('GITHUB_REPOSITORY')
    if not token or not repo:
        return
    req = urllib.request.Request('https://api.github.com/repos/%s/pages/builds' % repo, method='POST',
                                 headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json'})
    try:
        urllib.request.urlopen(req, timeout=30)
    except Exception as e:  # сборка всё равно запустится от пуша, это только подстраховка
        print('Запрос сборки Pages:', e)


# ---------- Команды ----------

def plural(n, one, few, many):
    m10, m100 = n % 10, n % 100
    if m10 == 1 and m100 != 11:
        return '%d %s' % (n, one)
    if 2 <= m10 <= 4 and not 12 <= m100 <= 14:
        return '%d %s' % (n, few)
    return '%d %s' % (n, many)


def recipe_link(recipe_id):
    return SITE_URL + 'menu.html#' + recipe_id


def category_name(data, cat_id):
    return next((c['name'] for c in data['categories'] if c['id'] == cat_id), cat_id)


def list_text(data):
    lines = []
    for c in data['categories']:
        names = [r['name'] for r in data['recipes'] if r['category'] == c['id']]
        if names:
            lines.append('%s (%d): %s' % (c['name'], len(names), ', '.join(names)))
    return 'Все рецепты (%d):\n\n%s' % (len(data['recipes']), '\n\n'.join(lines))


def not_found_text(name, similar):
    if similar:
        return 'Нашла несколько похожих на «%s»: %s. Напиши название точнее.' % (name, ', '.join(r['name'] for r in similar))
    return 'Не нашла рецепт «%s». Напиши «Список», чтобы увидеть все названия.' % name


def handle(text, files, image_raw=None):
    """Возвращает (ответ, сообщение коммита или None, изменённые пути)."""
    data = build.load()
    text = (text or '').strip()
    if not text:
        if files:
            return ('Фото получила, но без текста не знаю, к какому блюду его отнести. '
                    'Ответь на это сообщение с фото текстом рецепта или строкой «Изменить: Название».'), None, []
        return HELP, None, []

    command, arg = rt.detect_command(text)
    if command == 'help':
        return HELP, None, []
    if command == 'list':
        return list_text(data), None, []

    recipes = data['recipes']
    get_image = (lambda: image_raw) if image_raw is not None else (
        lambda: download(pick_image(files)['url']) if pick_image(files) else None)

    if command == 'delete':
        recipe, similar = rt.find_recipe(arg, recipes)
        if not recipe:
            return not_found_text(arg, similar), None, []
        recipes.remove(recipe)
        paths = ['data/recipes.json', 'recipes.js', 'menu.html']
        img = os.path.join(ROOT, recipe['image'])
        if recipe['image'].startswith('img/') and os.path.exists(img) and not any(r['image'] == recipe['image'] for r in recipes):
            os.remove(img)
            paths.append(recipe['image'])
        build.save(data)
        build.build(data)
        return ('Удалила «%s». Если передумаешь - напиши, вернём из истории.' % recipe['name'],
                'Удалить рецепт «%s»' % recipe['name'], paths)

    if command == 'edit':
        recipe, similar = rt.find_recipe(arg, recipes)
        if not recipe:
            return not_found_text(arg, similar), None, []
        changes, errors = rt.apply_edit(recipe, text, data['categories'])
        warnings, paths = [], ['data/recipes.json', 'recipes.js', 'menu.html']
        raw = get_image()
        if raw:
            rel, w, h, warnings = save_image(raw, recipe['id'])
            recipe['image'], recipe['width'], recipe['height'] = rel, w, h
            paths.append(rel)
            changes.append('фото')
        if errors and not changes:
            return 'Ничего не поменяла:\n' + '\n'.join(errors), None, []
        if not changes:
            return 'Не нашла, что поменять в «%s». Пример:\n\nИзменить: %s\nКБЖУ: 120/5/6/12' % (recipe['name'], recipe['name']), None, []
        build.save(data)
        build.build(data)
        reply = 'Готово, в «%s» поменяла: %s.\n%s' % (recipe['name'], ', '.join(changes), recipe_link(recipe['id']))
        if errors or warnings:
            reply += '\n\nОбрати внимание:\n' + '\n'.join(errors + warnings)
        return reply, 'Изменить рецепт «%s»: %s' % (recipe['name'], ', '.join(changes)), paths

    # новый рецепт
    recipe, errors, warnings = rt.parse_new_recipe(text, data['categories'])
    existing, _ = rt.find_recipe(recipe['name'], recipes)
    if existing and rt.norm_name(existing['name']) == rt.norm_name(recipe['name']):
        return ('Рецепт «%s» уже есть. Чтобы поменять его, начни сообщение со строки «Изменить: %s».'
                % (existing['name'], existing['name'])), None, []
    raw = get_image()
    if not raw:
        errors.append('Нет фото: прикрепи фото блюда файлом (PNG с прозрачным фоном).')
    if errors:
        return 'Не добавила рецепт:\n' + '\n'.join('- ' + e for e in errors) + '\n\nНапиши «Помощь», чтобы увидеть шаблон.', None, []

    recipe_id = rt.make_id(recipe['name'], {r['id'] for r in recipes})
    rel, w, h, img_warnings = save_image(raw, recipe_id)
    entry = {'id': recipe_id, 'name': recipe['name'], 'category': recipe['category'], 'image': rel,
             'width': w, 'height': h, 'description': recipe['description'], 'nutrition': recipe['nutrition'],
             'ingredients': recipe['ingredients'], 'steps': recipe['steps']}
    recipes.append(entry)
    build.save(data)
    build.build(data)
    with_detail = sum(1 for s in recipe['steps'] if s.get('detail'))
    reply = ('Добавила «%s» в раздел «%s»: %s, %s (с подсказками: %d).\n'
             'На сайте появится через 1-2 минуты:\n%s') % (
        recipe['name'], category_name(data, recipe['category']),
        plural(len(recipe['ingredients']), 'ингредиент', 'ингредиента', 'ингредиентов'),
        plural(len(recipe['steps']), 'шаг', 'шага', 'шагов'), with_detail, recipe_link(recipe_id))
    reply += '\n\nИнгредиенты так:\n' + '\n'.join(recipe['ingredients'])
    notes = warnings + img_warnings
    if notes:
        reply += '\n\nОбрати внимание:\n' + '\n'.join('- ' + n for n in notes)
    return reply, 'Новый рецепт «%s»' % recipe['name'], ['data/recipes.json', 'recipes.js', 'menu.html', rel]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='без git и без ответа в ВК')
    ap.add_argument('--text-file')
    ap.add_argument('--image')
    args = ap.parse_args()

    if args.text_file:
        with open(args.text_file, encoding='utf8') as f:
            payload = {'text': f.read(), 'files': []}
    else:
        with open(os.environ['GITHUB_EVENT_PATH'], encoding='utf8') as f:
            event = json.load(f)
        payload = event.get('client_payload') or {'text': (event.get('inputs') or {}).get('text', ''), 'files': []}
    image_raw = None
    if args.image:
        with open(args.image, 'rb') as f:
            image_raw = f.read()

    peer_id = payload.get('peer_id')
    try:
        reply, commit_msg, paths = handle(payload.get('text', ''), payload.get('files') or [], image_raw)
        if commit_msg and not args.dry_run:
            publish(commit_msg, paths)
    except Exception as e:  # человеку - понятное сообщение, в лог - подробности
        import traceback
        traceback.print_exc()
        reply = 'Что-то пошло не так, сайт не изменился. Ошибка: %s' % e
    if args.dry_run:
        print(reply)
    else:
        vk_send(peer_id, reply)


if __name__ == '__main__':
    main()
