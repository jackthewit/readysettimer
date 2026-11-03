import re
extra=open('extra3d.part.css',encoding='utf-8').read()
body=open('body.part.html',encoding='utf-8').read()
js=''.join(open(f,encoding='utf-8').read()+'\n' for f in ['posters.part.js','world3d.part.js','moves3d.part.js','pt-knowledge.part.js','app3d.part.js','studio.part.js'])
CDN=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/Reflector.js']
LOCAL=['assets.js','presets1.js','presets2.js','engine.js']
scripts=''.join(f'<script src="{u}"></script>\n' for u in CDN+LOCAL)
out=f"""<title>ONLINE GYM</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap" rel="stylesheet">
<style>
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

# Vercel용: 완전한 문서로 감싼 정적 사이트 (web/). 동시 접속은 supabase.config.json이 있을 때만 켜짐
import os,shutil,json
os.makedirs('web/models',exist_ok=True)
sup=''
if os.path.exists('supabase.config.json'):
    c=json.load(open('supabase.config.json',encoding='utf-8'))
    room=open('room-supabase.part.js',encoding='utf-8').read()
    stats=open('stats-supabase.part.js',encoding='utf-8').read()
    sup=('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n'
         f'<script>window.ONLINE_GYM_SUPABASE={json.dumps({"url":c["url"],"anonKey":c["anonKey"]})};</script>\n<script>{room}</script>\n<script>{stats}</script>\n')
doc=f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{{display:none!important}}img{{max-width:100%}}</style><meta name="description" content="말 없이 함께 운동하는 3D 온라인 헬스장. 회원가입 없이 바로 들어와요."><meta property="og:title" content="ONLINE GYM"><meta property="og:description" content="운동하는 삶. 말 없이 함께 운동하는 3D 온라인 헬스장"><meta property="og:type" content="website"><meta property="og:url" content="https://onlinegym.vercel.app"><meta property="og:image" content="https://onlinegym.vercel.app/og.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23171715'/%3E%3Cpath d='M6 12v8M10 9v14M22 9v14M26 12v8M10 16h12' stroke='%23f2cf1d' stroke-width='3'/%3E%3C/svg%3E">{sup}</head><body>{out}</body></html>"""
open('web/index.html','w',encoding='utf-8').write(doc)
for f in ['assets.js','presets1.js','presets2.js','engine.js']: shutil.copy(f,'web/'+f)
if os.path.exists('og.png'): shutil.copy('og.png','web/og.png')
for f in ['jjak.glb.b64.txt','buri.glb.b64.txt']: shutil.copy('models/'+f,'web/models/'+f)
print('동시 접속', '켜짐' if sup else '꺼짐 (supabase.config.json 없음)')
