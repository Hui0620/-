# -*- coding: utf-8 -*-
"""检查:1)recognizable在UI中的使用 2)语音转手语匹配逻辑 3)紧急求助页面的短语列表 4)其他词汇表"""
import re

src = open('index.js', encoding='utf-8').read()

# recognizable 所有出现位置及上下文分类
print('=== ALL recognizable positions ===')
for m in re.finditer(r'recognizable', src):
    i = m.start()
    ctx = src[max(0,i-120):i+80].replace('\n',' ')
    tag = 'DATA' if ('tips:' in src[max(0,i-400):i]) else 'CODE'
    print(f'{tag} @{i}: ...{ctx[-140:]}')

print()
# 语音转手语页面: 查找使用 ti Map 的地方
print('=== ti Map usage ===')
for m in re.finditer(r'\bti\b\.get|\bti\.has', src):
    i = m.start()
    print(f'--- @{i} ---')
    print(src[max(0,i-500):i+500].replace('\n',' '))
    print()
    break

# 查找其他中文短语数组（紧急求助一键翻译 / 语音示例）
print('=== phrase candidates ===')
for kw in ['一键翻译', '预设联系人', '请帮我', '示例', '试试说', '快速短语', '快捷']:
    for m in re.finditer(kw, src):
        i = m.start()
        print(f'--- {kw} @{i} ---')
        print(src[max(0,i-250):i+400].replace('\n',' '))
        print()
        break
