# -*- coding: utf-8 -*-
"""定位词库页面组件(路由 /vocabulary)的过滤逻辑"""
import re

src = open('index.js', encoding='utf-8').read()

# 搜索过滤函数：找包含 e.word 或 includes 的过滤
for m in re.finditer(r'\.toLowerCase\(\)\.includes|includes\(.+\.toLowerCase', src):
    i = m.start()
    ctx = src[max(0,i-600):i+400].replace('\n',' ')
    if 'word' in ctx or 'pinyin' in ctx or 'alias' in ctx:
        print(f'--- @{i} ---')
        print(ctx)
        print()
