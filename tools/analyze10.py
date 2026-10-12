# -*- coding: utf-8 -*-
"""查看语音转手语页面的匹配逻辑"""
import re

src = open('index.js', encoding='utf-8').read()

# bi 组件 (voice-to-sign)
i = src.find('function bi(')
print(src[i:i+4500])
