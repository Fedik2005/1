"""Проверка разбора сообщений: python -m unittest bot/test_recipe_text.py"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import recipe_text as rt  # noqa: E402

CATEGORIES = [
    {'id': 'first', 'name': 'Первое'}, {'id': 'second', 'name': 'Второе'},
    {'id': 'baking', 'name': 'Выпечка несладкая'}, {'id': 'sweet', 'name': 'Десерты'},
    {'id': 'salads', 'name': 'Салаты'}, {'id': 'drinks', 'name': 'Напитки'},
    {'id': 'snacks', 'name': 'Закуски'}, {'id': 'preps', 'name': 'Заготовки'},
]

PUMPKIN = """Тыквенный крем-суп
Нежный бархатный суп из запечённой тыквы со сливками.
Раздел: Первое
КБЖУ: 62/1,4/3,2/7
Ингредиенты: тыква 1шт, сливки 20% 200 мл, лук репчатый 1 шт., масло сливочное 20 гр, соль по вкусу, мускатный орех 0.5 ч. л.
Приготовление: 1. Почистите тыкву и нарежьте кубиками (понадобится тыква)2. Обжарьте лук на масле (понадобится лук, масло) 3. Добавьте тыкву, залейте водой и варите 20 минут 4. Пробейте блендером, влейте сливки (понадобится сливки, мускатный орех)"""


class Amounts(unittest.TestCase):
    def test_rules_from_owner(self):
        cases = {
            '10 г': '10г', '10г': '10г', '1 кг': '1кг', '310 мл': '310мл', '1 л': '1л',
            '2 ст.л.': '2 ст.л.', '2ст.л': '2 ст.л.', '2 ст. л.': '2 ст.л.', '2 столовые ложки': '2 ст.л.',
            '1 ч.л': '1 ч.л.', '3 шт': '3шт', '3 шт.': '3шт', '3 штуки': '3шт',
            '0,5 уп': '0,5уп', '0.5уп': '0,5уп', '1 упаковка': '1уп', '20 грамм': '20г',
            '1/2 ст.л.': '0,5 ст.л.', '2-3 шт': '2-3шт', '3 зубчика': '3 зубчика',
            'по вкусу': 'по вкусу', '1 куп': '1 куп',
        }
        for raw, want in cases.items():
            self.assertEqual(rt.normalize_amount(raw), want, raw)

    def test_ingredient_lines(self):
        cases = {
            'тыква 1шт': 'Тыква — 1шт',
            'Сливки 20% 400 мл': 'Сливки 20% — 400мл',
            'соль по вкусу': 'Соль — по вкусу',
            'Лук репчатый - 3 шт.': 'Лук репчатый — 3шт',
            'Мука — 3ст.л.': 'Мука — 3 ст.л.',
            'Чеснок 3 зубчика': 'Чеснок — 3 зубчика',
            'Специи (чеснок + хмели-сунели) 2 ст.л.': 'Специи (чеснок + хмели-сунели) — 2 ст.л.',
            'Манка': 'Манка',
        }
        for raw, want in cases.items():
            self.assertEqual(rt.normalize_ingredient_line(raw), want, raw)

    def test_split_list_keeps_decimal_comma(self):
        self.assertEqual(rt.split_list('мука 0,5кг, сахар 100г; соль'), ['мука 0,5кг', 'сахар 100г', 'соль'])
        self.assertEqual(rt.split_list('- яйца 2шт\n- молоко 200мл'), ['яйца 2шт', 'молоко 200мл'])


class Kbju(unittest.TestCase):
    def test_formats(self):
        want = {'kcal': '120', 'protein': '5', 'fat': '6,5', 'carbs': '12'}
        self.assertEqual(rt.parse_kbju('120/5/6,5/12'), want)
        self.assertEqual(rt.parse_kbju('120 ккал, б 5, ж 6.5, у 12'), want)
        self.assertEqual(rt.parse_kbju('120 5 6,5 12'), want)
        self.assertIsNone(rt.parse_kbju('много'))


class Steps(unittest.TestCase):
    def test_numbers_without_space(self):
        steps = rt.split_steps('1. Почистите тыкву (понадобится тыква)2. Нарежьте 3. Варите при 220°C 1.5 часа')
        self.assertEqual(len(steps), 3)
        self.assertTrue(steps[2].endswith('1.5 часа'))

    def test_lines_without_numbers(self):
        self.assertEqual(rt.split_steps('Почистите\nНарежьте'), ['Почистите', 'Нарежьте'])

    def test_detail_from_ingredients(self):
        ings = ['Тыква — 1шт', 'Сливки 20% — 200мл', 'Лук репчатый — 1шт']
        step = rt.parse_step('Почистите тыкву (понадобится тыква)', ings)
        self.assertEqual(step, {'text': 'Почистите тыкву.', 'detail': ['Тыква — 1шт']})
        step = rt.parse_step('влейте (понадобятся сливки и лук)', ings)
        self.assertEqual(step['detail'], ['Сливки 20% — 200мл', 'Лук репчатый — 1шт'])
        step = rt.parse_step('посолите (понадобится соль 1 ч.л.)', ings)
        self.assertEqual(step['detail'], ['Соль — 1 ч.л.'])


class Messages(unittest.TestCase):
    def test_owner_example(self):
        recipe, errors, warnings = rt.parse_new_recipe(PUMPKIN, CATEGORIES)
        self.assertEqual(errors, [])
        self.assertEqual(recipe['name'], 'Тыквенный крем-суп')
        self.assertEqual(recipe['category'], 'first')
        self.assertEqual(recipe['nutrition'], {'kcal': '62', 'protein': '1,4', 'fat': '3,2', 'carbs': '7'})
        self.assertEqual(recipe['ingredients'], [
            'Тыква — 1шт', 'Сливки 20% — 200мл', 'Лук репчатый — 1шт', 'Масло сливочное — 20г',
            'Соль — по вкусу', 'Мускатный орех — 0,5 ч.л.'])
        self.assertEqual(len(recipe['steps']), 4)
        self.assertEqual(recipe['steps'][0]['detail'], ['Тыква — 1шт'])
        self.assertEqual(recipe['steps'][1]['detail'], ['Лук репчатый — 1шт', 'Масло сливочное — 20г'])
        self.assertNotIn('detail', recipe['steps'][2])
        self.assertTrue(recipe['description'].startswith('Нежный'))
        self.assertEqual(warnings, [])

    def test_missing_parts_are_reported(self):
        _r, errors, _w = rt.parse_new_recipe('Суп\nвкусный', CATEGORIES)
        self.assertEqual(len(errors), 3)

    def test_commands(self):
        self.assertEqual(rt.detect_command('Помощь'), ('help', None))
        self.assertEqual(rt.detect_command('список'), ('list', None))
        self.assertEqual(rt.detect_command('Удалить: Шарлотка'), ('delete', 'Шарлотка'))
        self.assertEqual(rt.detect_command('Изменить: Шарлотка\nКБЖУ: 1/2/3/4'), ('edit', 'Шарлотка'))
        self.assertEqual(rt.detect_command('Изменить рецепт Шарлотка'), ('edit', 'Шарлотка'))
        self.assertEqual(rt.detect_command(PUMPKIN), ('new', None))

    def test_edit(self):
        recipe = {'name': 'Шарлотка', 'category': 'sweet', 'description': 'старое', 'nutrition': {},
                  'ingredients': ['Яйца — 4шт', 'Сахар — 95г'], 'steps': [{'text': 'Взбейте.'}, {'text': 'Испеките.'}]}
        changes, errors = rt.apply_edit(recipe, 'Изменить: Шарлотка\nОписание: новое\nКБЖУ: 183/5,7/4,7/29\n'
                                                'Ингредиент: сахар 80 г, корица 1 ч.л\nШаг 2: Выпекайте 25 минут (понадобится сахар)',
                                        CATEGORIES)
        self.assertEqual(errors, [])
        self.assertEqual(recipe['description'], 'новое')
        self.assertEqual(recipe['nutrition']['kcal'], '183')
        self.assertEqual(recipe['ingredients'], ['Яйца — 4шт', 'Сахар — 80г', 'Корица — 1 ч.л.'])
        self.assertEqual(recipe['steps'][1], {'text': 'Выпекайте 25 минут.', 'detail': ['Сахар — 80г']})
        changes, errors = rt.apply_edit(recipe, 'Изменить: Шарлотка\nУбрать ингредиент: корица\nУдалить шаг: 1', CATEGORIES)
        self.assertEqual(recipe['ingredients'], ['Яйца — 4шт', 'Сахар — 80г'])
        self.assertEqual(len(recipe['steps']), 1)

    def test_find_and_id(self):
        recipes = [{'name': 'Шарлотка'}, {'name': 'Творожные оладьи'}, {'name': 'Творожно-банановый кекс'}]
        self.assertEqual(rt.find_recipe('шарлотка', recipes)[0]['name'], 'Шарлотка')
        self.assertEqual(rt.find_recipe('оладьи', recipes)[0]['name'], 'Творожные оладьи')
        found, similar = rt.find_recipe('творож', recipes)
        self.assertIsNone(found)
        self.assertEqual(len(similar), 2)
        self.assertEqual(rt.make_id('Тыквенный крем-суп', set()), 'tykvennyy-krem-sup')
        self.assertEqual(rt.make_id('Тыквенный крем-суп', {'tykvennyy-krem-sup'}), 'tykvennyy-krem-sup-2')


if __name__ == '__main__':
    unittest.main()
