# -*- coding: utf-8 -*-
"""检查词库页详情渲染用到的字段"""
src = open('index.js', encoding='utf-8').read()

# 词库页 yi 组件
i = src.find('function yi({settings')
print(src[i:i+7000])
