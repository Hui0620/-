# -*- coding: utf-8 -*-
"""找语音页组件的匹配计算代码（u 的来源）"""
src = open('index.js', encoding='utf-8').read()

# 从语音页输入框位置向前找组件开头
i = src.find('语音转手语')
print(src[i-3500:i])
