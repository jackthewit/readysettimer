import re
prev=open('../artifact/index.html',encoding='utf-8').read()
css=prev.split('<style>',1)[1].split('</style>',1)[0]
css=css.replace("url('assets/buri.png')","url('buri.png')")
extra=open('extra3d.part.css',encoding='utf-8').read()
body=open('body.part.html',encoding='utf-8').read()
js=open('app3d.part.js',encoding='utf-8').read()
CDN=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js']
LOCAL=['assets.js','presets1.js','presets2.js','engine.js']
scripts=''.join(f'<script src="{u}"></script>\n' for u in CDN+LOCAL)
out=f"""<title>짹짹이짐 ONLINE 3D</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;600;800&display=swap" rel="stylesheet">
<style>
{css}
{extra}
</style>
{body}
{scripts}<script>
{js}
</script>
"""
open('index.html','w',encoding='utf-8').write(out)
bad=[hex(ord(c)) for c in out if 0x200b<=ord(c)<=0x200f or 0x2028<=ord(c)<=0x202e or 0x2066<=ord(c)<=0x2069]
print('bytes',len(out.encode()),'bad',bad)
