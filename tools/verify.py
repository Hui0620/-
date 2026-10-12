# -*- coding: utf-8 -*-
"""校验全部预缓存文件存在且非空/非404"""
import os, re

sw = open('sw.js', encoding='utf-8').read()
urls = re.findall(r'url:`?"?([^"`]+)`?"?,revision', sw) + re.findall(r'url:"([^"]+)",revision:null', sw)
urls = sorted(set(urls))
bad = []
for u in urls:
    if not os.path.exists(u):
        bad.append((u, 'MISSING')); continue
    size = os.path.getsize(u)
    head = open(u, 'rb').read(200)
    if size < 30 or b'Cannot find' in head or b'<html' in head.lower():
        bad.append((u, f'size={size}'))
    else:
        print(f'OK {size:>9,}  {u}')
print()
if bad:
    print('BAD FILES:')
    for u, why in bad:
        print(' ', u, why)
else:
    print('ALL FILES OK')
