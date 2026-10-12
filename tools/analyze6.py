# -*- coding: utf-8 -*-
"""查看词库页面组件的搜索/过滤逻辑"""
import re

src = open('index.js', encoding='utf-8').read()

# 找词库页面
for kw in ['学习标准手势', '掌握标准手语', '搜索手语', '按分类浏览']:
    for m in re.finditer(kw, src):
        i = m.start()
        print(f'=== {kw} @{i} ===')
        print(src[max(0,i-1500):i+2500])
        print()
        break
