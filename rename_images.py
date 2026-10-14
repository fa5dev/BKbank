# -*- coding: utf-8 -*-
import subprocess
import sys

replacements = [
    ('2025-01-30_23-24-11-Photoroom.png', 'all-cards.png'),
    ('2025-01-30_17-50-13-Photoroom.png', 'avatar.png'),
    ('2025-01-31_14-13-47-Photoroom.png', 'logo.png'),
]

files = ['index.html', 'js/app.js', 'js/verify-fix.js', 'js/bat-animation.js']

for file in files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'{file}: не найден')
        continue

    total = 0
    for old, new in replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            total += count
            print(f'  {file}: {old} -> {new}: {count}')

    if total > 0:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{file}: всего замен {total}')
    else:
        print(f'{file}: замен нет')

# Проверка синтаксиса JS
for js_file in ['js/app.js', 'js/verify-fix.js', 'js/bat-animation.js']:
    result = subprocess.run(['node', '-c', js_file], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'❌ {js_file} сломан!')
        print(result.stderr)
        sys.exit(1)
    else:
        print(f'✅ {js_file} синтаксис OK')

print('\n✅ Все замены выполнены')
