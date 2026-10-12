# -*- coding: utf-8 -*-
"""提取手势识别匹配函数 ci 和相关逻辑"""
src = open('index.js', encoding='utf-8').read()

i = src.find('function ci(e)')
print(src[i:i+4000])
