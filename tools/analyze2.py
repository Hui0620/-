# -*- coding: utf-8 -*-
"""分析识别逻辑: recognizable / handshape / 手势匹配"""
import re

src = open('index.js', encoding='utf-8').read()

# 1. recognizable 的引用（排除数据定义本身）
print('======= recognizable usages =======')
for m in re.finditer(r'recognizable', src):
    i = m.start()
    ctx = src[max(0,i-150):i+150].replace('\n',' ')
    if 'tips:' in ctx and 'handshape:`' in ctx:
        continue  # skip data definitions
    print('--- at', i, '---')
    print(ctx)
    print()

# 2. 手指伸直检测逻辑 (MediaPipe landmarks → finger states)
print('======= finger detection =======')
for kw in ['isExtended', 'fingerExtended', 'fingersUp', 'extended', '伸直', '张开程度']:
    for m in re.finditer(kw, src):
        i = m.start()
        print(f'--- {kw} at {i} ---')
        print(src[max(0,i-200):i+250].replace('\n',' '))
        print()
        break
