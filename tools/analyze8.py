# -*- coding: utf-8 -*-
"""找路由定义和其他分类过滤器"""
import re

src = open('index.js', encoding='utf-8').read()

# 路由定义
for m in re.finditer(r'path:`/', src):
    i = m.start()
    print('=== route @', i, '===')
    print(src[i-100:i+1200].replace('\n',' '))
    print()
    break

# 其他分类 tab 列表（找 number/time/medical 关键字组合）
print('=== category tab lists ===')
for m in re.finditer(r'key:`number`', src):
    i = m.start()
    print(f'--- @{i} ---')
    print(src[max(0,i-800):i+900].replace('\n',' '))
    print()
