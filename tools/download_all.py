# -*- coding: utf-8 -*-
"""从 sw.js 提取完整预缓存文件列表并下载所有资源"""
import re, subprocess, os

sw = open('sw.js', encoding='utf-8').read()
urls = re.findall(r'url:`?"?([^"`]+)`?"?,revision', sw)
# 也匹配 revision:null 形式
urls += re.findall(r'url:"([^"]+)",revision:null', sw)
urls = sorted(set(urls))
print(f'{len(urls)} files:')
for u in urls:
    print(' ', u)
