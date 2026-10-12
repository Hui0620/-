# -*- coding: utf-8 -*-
"""查找语音转手语组件如何查词"""
import re

src = open('index.js', encoding='utf-8').read()

# 找 "语音转手语" 页面标题位置
for kw in ['说话查手势', '说出词语', '语音输入', '请说出', '识别中', '麦克风']:
    for m in re.finditer(kw, src):
        i = m.start()
        print(f'=== {kw} @{i} ===')
        print(src[max(0,i-400):i+700].replace('\n',' ')[:1100])
        print()
        break
