# -*- coding: utf-8 -*-
"""查看语音页文字如何映射到手语词条"""
import re

src = open('index.js', encoding='utf-8').read()
i = src.find('我想喝水')
print(src[i:i+4500])
