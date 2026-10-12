# -*- coding: utf-8 -*-
"""分析 handshape 的使用方式和手指映射规则"""
import re, json

src = open('index.js', encoding='utf-8').read()

# 1. 查找 handshape 的所有引用位置
for m in re.finditer(r'handshape', src):
    i = m.start()
    print('=== at', i, '===')
    print(src[max(0,i-300):i+300].replace('\n', ' '))
    print()
