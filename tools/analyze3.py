# -*- coding: utf-8 -*-
"""深入分析识别匹配逻辑"""
import re

src = open('index.js', encoding='utf-8').read()

# A: fromEntries 区域附近（词库索引构建）
i = src.find('Object.fromEntries($r.map')
print('======= vocab index region =======')
print(src[i-400:i+1600])
