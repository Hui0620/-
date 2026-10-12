# -*- coding: utf-8 -*-
"""提取语音页组件完整开头（匹配计算）"""
src = open('index.js', encoding='utf-8').read()

i = src.find('`语音转手语`}),(0,k.jsxs)(`div`,{className:`relative mb-3`')
# 向前找 function 声明
start = src.rfind('function', max(0, i-6000), i)
print('component fn at', start)
print(src[start:start+2600])
