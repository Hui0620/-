# -*- coding: utf-8 -*-
"""找语音页匹配函数：搜索 ti 相关的查询表达式"""
import re

src = open('index.js', encoding='utf-8').read()

# ti 是 Map。搜索所有 \bti\b 的用法
for m in re.finditer(r'(?<![a-zA-Z_$])ti(?![a-zA-Z_$0-9])', src):
    i = m.start()
    ctx = src[max(0,i-100):i+120].replace('\n',' ')
    if '.get' in ctx or '.has' in ctx or 'filter' in ctx or 'Map' in ctx:
        print(f'--- @{i} ---')
        print(ctx)
        print()
