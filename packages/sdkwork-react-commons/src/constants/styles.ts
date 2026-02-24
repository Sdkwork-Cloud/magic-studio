import type { StyleOption } from '../types';

export const IMAGE_STYLES: StyleOption[] = [
    { 
        id: 'cinematic', label: '影视质感 (Cinematic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '好莱坞大片质感，强调动态范围、景深与电影布光',
        usage: ['剧情', '商业广告', '史诗'],
        prompt: 'cinematic lighting, depth of field, movie still, color graded, 8k, highly detailed, atmospheric, anamorphic lens, film grain',
        prompt_zh: '电影质感光效，景深，电影剧照，专业调色，8k分辨率，高细节，氛围感，变形宽银幕镜头，胶片颗粒',
        previewColor: '#10b981'
    },
    { 
        id: 'high_sat_real', label: '高饱和写实 (High Saturation)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '色彩鲜艳浓郁的写实风格，适合展现充满活力的现代生活或自然风光',
        usage: ['旅游', '美食', '时尚'],
        prompt: 'vibrant colors, high saturation, hyperrealistic, sharp focus, vivid, bright lighting, commercial photography, colorful, energetic',
        prompt_zh: '鲜艳色彩，高饱和度，超写实，对焦清晰，生动，明亮光照，商业摄影，色彩丰富，充满活力',
        previewColor: '#facc15'
    },
    { 
        id: 'aesthetic_real', label: '唯美写实 (Aesthetic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop' }
        },
        description: '柔光、梦幻、干净的写实画面，追求极致的视觉美感与氛围',
        usage: ['MV', '写真', '情感片'],
        prompt: 'soft lighting, dreamy atmosphere, ethereal, aesthetic composition, clean, gentle colors, soft focus, instagram style, elegant',
        prompt_zh: '柔和光线，梦幻氛围，空灵，唯美构图，干净，温柔色彩，柔焦，INS风，优雅',
        previewColor: '#f472b6'
    },
    { 
        id: 'retro_dv', label: '复古DV质感 (Retro DV)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1515536765-9b2a740fa475?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop' }
        },
        description: '模拟90年代手持DV录像机的低保真、噪点与色偏效果，充满怀旧生活气息',
        usage: ['Vlog', '回忆录', '独立电影'],
        prompt: '1990s dv footage, camcorder style, vhs glitch, low resolution, noise, datamosh, handheld camera feel, home video aesthetic, timestamp',
        prompt_zh: '90年代DV录像，摄像机风格，VHS故障，低分辨率，噪点，数据损坏效果，手持镜头感，家庭录像美学，时间戳',
        previewColor: '#fb923c'
    },
    { 
        id: 'bw_film', label: '黑白电影 (B&W Film)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '经典黑白摄影，高对比度，强调光影结构与叙事张力',
        usage: ['艺术片', '侦探', '历史'],
        prompt: 'black and white photography, film grain, high contrast, noir style, dramatic lighting, monochrome, classic cinema',
        prompt_zh: '黑白摄影，胶片颗粒，高对比度，黑色电影风格，戏剧性布光，单色，经典电影',
        previewColor: '#18181b'
    },
    { 
        id: 'wkw_style', label: '王家卫电影 (WKW Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1493606371202-6275828f90f3?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '抽帧、重影、浓郁的色彩与暧昧的氛围，展现都市男女的情感纠葛',
        usage: ['爱情', '文艺片', '情绪短片'],
        prompt: 'wong kar-wai style, neon lights, motion blur, step printing, melancholic atmosphere, vivid reds and greens, cinematic, hong kong 90s',
        prompt_zh: '王家卫风格，霓虹灯，动态模糊，抽帧效果，忧郁氛围，鲜艳的红绿色调，电影感，90年代香港',
        previewColor: '#9f1239'
    },
    { 
        id: 'iwai_style', label: '岩井俊二电影 (Iwai Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1509967419530-321618802007?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' }
        },
        description: '逆光、过曝、青春残酷物语，日系清新的胶片质感',
        usage: ['青春校园', '治愈', '日系写真'],
        prompt: 'shunji iwai style, overexposed, soft focus, natural light, youthful, ethereal, pale colors, japanese film grain, airy',
        prompt_zh: '岩井俊二风格，过曝，柔焦，自然光，青春感，空灵，淡雅色彩，日系胶片颗粒，通透',
        previewColor: '#bae6fd'
    },
    { 
        id: 'japanese_anime', label: '日漫二次元 (Anime)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1560932669-5e3252f28b84?q=80&w=800&auto=format&fit=crop' }
        },
        description: '典型的新海诚或京都动画风格，色彩明快，线条细腻',
        usage: ['青春', '幻想', '热血'],
        prompt: 'anime style, makoto shinkai, vibrant sky, detailed background, cel shaded, 2d, high production value, colorful, emotional',
        prompt_zh: '日本动画风格，新海诚，绚丽天空，精细背景，赛璐璐渲染，2D，高制作水准，色彩丰富，情感细腻',
        previewColor: '#60a5fa'
    },
    { 
        id: 'chinese_comic', label: '国风漫剧 (CN Comic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1614726365723-49cfa356c496?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' }
        },
        description: '结合中国传统元素与现代漫画技法，色彩典雅，造型飘逸',
        usage: ['仙侠', '古言', '玄幻'],
        prompt: 'chinese manhua style, delicate lines, ancient fantasy, ethereal, flowy robes, watercolor textures mixed with digital, elegance',
        prompt_zh: '国漫风格，细腻线条，古风玄幻，飘逸，流动长袍，水墨质感结合数码绘画，优雅',
        previewColor: '#fcd34d'
    },
    { 
        id: 'korean_manhwa', label: '韩漫二次元 (Manhwa)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534030347209-7147fd5939d8?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1620065096574-d021c251478a?q=80&w=800&auto=format&fit=crop' }
        },
        description: '韩式条漫风格，色彩高饱和，人物修长美型，都市感强',
        usage: ['都市恋爱', '职场', '复仇'],
        prompt: 'manhwa style, webtoon, clean lines, high contrast, vibrant colors, beautiful characters, fashion focus, sharp details, vertical scrolling aesthetic',
        prompt_zh: '韩漫风格，条漫，线条干净，高对比度，鲜艳色彩，美型角色，时尚感，细节锐利，竖屏美学',
        previewColor: '#f472b6'
    },
    { 
        id: 'cel_shaded', label: '华丽三渲二 (Cel Shaded)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1612151855475-877969f4a6cc?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1633469924738-52101af516f3?q=80&w=800&auto=format&fit=crop' }
        },
        description: '类似《原神》或《崩坏》的游戏CG质感，3D建模配合2D渲染风格',
        usage: ['游戏', '动作', '科幻'],
        prompt: 'cel shaded, 3d rendered as 2d, genshin impact style, sharp shadows, vibrant anime colors, clean geometry, dynamic lighting, game cg',
        prompt_zh: '三渲二，卡通渲染，原神风格，锐利阴影，鲜艳动漫色彩，几何感强，动态光照，游戏CG',
        previewColor: '#818cf8'
    },
    { 
        id: 'ghibli', label: '吉卜力 (Ghibli)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1585644198335-d28075791986?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop' }
        },
        description: '宫崎骏手绘风格，色彩温暖自然，充满童话与治愈感',
        usage: ['儿童', '治愈', '奇幻'],
        prompt: 'studio ghibli style, hayao miyazaki, hand painted background, lush nature, fluffy clouds, nostalgic, warm colors, detailed environments',
        prompt_zh: '吉卜力风格，宫崎骏，手绘背景，繁茂自然，蓬松云朵，怀旧，暖色调，环境细节丰富',
        previewColor: '#34d399'
    },
    { 
        id: 'ancient_2d', label: '2D古风 (2D Ancient)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1526462725345-56f890e0b3c6?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1532054359740-420448108d88?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=800&auto=format&fit=crop' }
        },
        description: '扁平化插画风格的古风画面，线条柔和，色彩淡雅',
        usage: ['绘本', '古风MV', '插画'],
        prompt: 'traditional chinese painting, ink wash, flat style, scroll painting, elegant, minimalistic, muted colors, soft lines',
        prompt_zh: '中国传统绘画，水墨，扁平风格，卷轴画，优雅，极简，淡雅色彩，柔和线条',
        previewColor: '#d6d3d1'
    },
    { 
        id: 'ancient_3d', label: '3D古风 (3D Ancient)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1599708153386-53c896940d99?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534063237583-93d3957eb644?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=800&auto=format&fit=crop' }
        },
        description: '类似《秦时明月》的3D国漫风格，建模精细，光效华丽',
        usage: ['武侠动画', '游戏CG'],
        prompt: '3d donghua style, detailed clothing patterns, martial arts fantasy, unreal engine 5 render, glowing effects, flowing hair, dynamic action',
        prompt_zh: '3D国漫风格，精细服饰纹理，武侠玄幻，虚幻引擎5渲染，发光特效，发丝飘逸，动态动作',
        previewColor: '#f59e0b'
    },
    { 
        id: 'ancient_real', label: '真人古风 (Realistic Ancient)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1535068484670-af9ba571bfd6?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1632215354901-d779f0427c3f?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '电影级别的古装剧质感，服化道考究，光影写实',
        usage: ['古装剧', '历史剧'],
        prompt: 'historical drama, hanfu, intricate costumes, ancient china setting, realistic textures, cinematic lighting, epic scale, period piece',
        prompt_zh: '古装剧，汉服，精美服饰，中国古代背景，真实质感，电影布光，宏大场面，历史剧',
        previewColor: '#78350f'
    },
    { 
        id: 'gongbi', label: '中国工笔画 (Gongbi)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' }
        },
        description: '传统工笔重彩风格，线条工整细致，色彩艳丽典雅',
        usage: ['文化宣传', '艺术短片'],
        prompt: 'gongbi style, meticulous brushwork, highly detailed, traditional chinese art, elegant colors, fine lines, decorative patterns',
        prompt_zh: '工笔画风格，细腻笔触，高度细节，中国传统艺术，典雅色彩，精细线条，装饰纹样',
        previewColor: '#fca5a5'
    },
    { 
        id: 'sketch', label: '素描简笔画 (Sketch)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1580196920806-3847a9cb64cc?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1615818446219-c0c4e7040449?q=80&w=800&auto=format&fit=crop' }
        },
        description: '铅笔或炭笔手绘质感，黑白线条，简约抽象',
        usage: ['回忆', '创意', '极简'],
        prompt: 'pencil sketch, charcoal drawing, rough lines, monochrome, graphite, artistic, hand drawn, textured paper',
        prompt_zh: '铅笔素描，炭笔画，粗糙线条，单色，石墨，艺术感，手绘，纹理纸张',
        previewColor: '#e5e7eb'
    },
    { 
        id: 'watercolor', label: '水彩画 (Watercolor)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1582236894411-bdc1157c9135?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1576243345690-8e4b78e69e51?q=80&w=800&auto=format&fit=crop' }
        },
        description: '水彩晕染效果，色彩通透，富有诗意和流动感',
        usage: ['艺术', '梦境', '绘本'],
        prompt: 'watercolor painting, wet on wet, splashes, paper texture, soft blending, artistic, dreamy, pastel tones',
        prompt_zh: '水彩画，湿画法，泼溅效果，纸张纹理，柔和晕染，艺术感，梦幻，柔和色调',
        previewColor: '#a5f3fc'
    },
    { 
        id: 'oil_painting', label: '油画 (Oil Painting)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1577720643272-265f09367432?q=80&w=800&auto=format&fit=crop' }
        },
        description: '厚涂油画质感，笔触明显，色彩厚重，印象派风格',
        usage: ['古典', '艺术', '史诗'],
        prompt: 'oil painting, thick impasto, brush strokes, canvas texture, impressionism, rich colors, expressive',
        prompt_zh: '油画，厚涂法，笔触感，画布纹理，印象派，浓郁色彩，表现力强',
        previewColor: '#c2410c'
    },
    { 
        id: 'clay', label: '黏土 (Clay)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1596727147705-54a71280d158?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '定格动画风格，模拟手工黏土的质感与光泽，充满童趣',
        usage: ['儿童', '创意', '喜剧'],
        prompt: 'claymation, stop motion, plasticine texture, fingerprint details, soft lighting, miniature world, handmade feel',
        prompt_zh: '黏土动画，定格动画，橡皮泥质感，指纹细节，柔和光照，微缩世界，手工感',
        previewColor: '#fbbf24'
    },
    { 
        id: 'felt', label: '毛毡 (Felt Art)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1582236894411-bdc1157c9135?q=80&w=800&auto=format&fit=crop&blur=10' }, 
            portrait: { url: 'https://images.unsplash.com/photo-1616406432452-9226f71e2c6e?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?q=80&w=800&auto=format&fit=crop' }
        },
        description: '羊毛毡材质效果，毛茸茸的边缘，温暖柔软',
        usage: ['治愈', '宠物', '童话'],
        prompt: 'felt art, wool texture, fuzzy, soft edges, handcrafted, cute, warm lighting, needle felt',
        prompt_zh: '毛毡艺术，羊毛质感，毛茸茸，柔和边缘，手工制作，可爱，暖光，针毡',
        previewColor: '#fcd34d'
    },
    { 
        id: 'lego', label: '乐高 (Lego)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=800&auto=format&fit=crop' }
        },
        description: '积木拼接风格，高光泽塑料质感，微缩摄影效果',
        usage: ['玩具', '创意', '趣味'],
        prompt: 'lego bricks, plastic texture, studs, miniature, tilt shift, macro photography, blocky, toy world',
        prompt_zh: '乐高积木，塑料质感，颗粒感，微缩，移轴摄影，微距摄影，方块状，玩具世界',
        previewColor: '#ef4444'
    },
    { 
        id: '3d_cartoon', label: '3D卡通 (3D Cartoon)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1633511090164-b43840ea1607?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop' }
        },
        description: '通用3D卡通渲染，色彩柔和，造型圆润，适合全年龄段',
        usage: ['家庭', '教育', '动画'],
        prompt: '3d cartoon, pixar style, disney style, soft shapes, expressive characters, bright lighting, subsurface scattering, cute',
        prompt_zh: '3D卡通，皮克斯风格，迪士尼风格，柔和形状，表情丰富，明亮光照，次表面散射，可爱',
        previewColor: '#38bdf8'
    },
    { 
        id: 'pixar', label: '皮克斯 (Pixar)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1560932669-5e3252f28b84?q=80&w=400&auto=format&fit=crop' }, 
            sheet: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=800&auto=format&fit=crop' }
        },
        description: '顶级3D动画电影质感，极致的材质细节与表情捕捉',
        usage: ['电影', '短片', 'IP打造'],
        prompt: 'pixar animation style, high quality render, expressive, subsurface scattering, detailed textures, cinematic lighting, 8k render, masterpiece',
        prompt_zh: '皮克斯动画风格，高质量渲染，表情生动，次表面散射，纹理细节，电影布光，8k渲染，杰作',
        previewColor: '#60a5fa'
    },
    { 
        id: 'cyberpunk', label: '赛博朋克 (Cyberpunk)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=800&auto=format&fit=crop' }
        },
        description: '高对比度的霓虹色彩美学，雨夜、机械、全息投影与未来科技感',
        usage: ['科幻', '动作', '游戏'],
        prompt: 'cyberpunk, neon lights, rain, wet streets, futuristic city, high tech, low life, holograms, blue and pink lighting, dark atmosphere',
        prompt_zh: '赛博朋克，霓虹灯，雨，湿街道，未来城市，高科技，低生活，全息图，蓝粉色光照，黑暗氛围',
        previewColor: '#ec4899'
    },
    { 
        id: 'futurism', label: '未来主义 (Futurism)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop&sat=-50' },
            sheet: { url: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=800&auto=format&fit=crop' }
        },
        description: '洁净的线条、金属质感、高科技构图，展现对未来的畅想',
        usage: ['科技', '概念片', '宣传'],
        prompt: 'futuristic, sci-fi, sleek, clean lines, metallic, chrome, spaceships, high tech, utopia, bright white lighting, space age',
        prompt_zh: '未来主义，科幻，流线型，干净线条，金属质感，铬，飞船，高科技，乌托邦，明亮白光，太空时代',
        previewColor: '#94a3b8'
    },
    { 
        id: 'y2k', label: 'Y2K拼贴艺术 (Y2K)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop' }
        },
        description: '千禧年复古未来风格，金属光泽、荧光色、低保真数字元素',
        usage: ['时尚', '音乐', '潮流'],
        prompt: 'y2k aesthetic, 2000s retro, metallic, shiny, blobby shapes, gradient backgrounds, futuristic retro, pop culture, glitch art',
        prompt_zh: 'Y2K美学，2000年代复古，金属感，闪亮，斑点形状，渐变背景，复古未来主义，流行文化，故障艺术',
        previewColor: '#d8b4fe'
    },
    { 
        id: 'kpop', label: 'K-pop舞台 (K-pop)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1529139574466-a302d2052574?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1514525253440-b393452e3383?q=80&w=800&auto=format&fit=crop' }
        },
        description: '绚丽的舞台灯光，高对比度色彩，时尚潮流的服饰与妆容',
        usage: ['MV', '舞蹈', '时尚'],
        prompt: 'k-pop music video style, stage lighting, vibrant fashion, energetic, glossy, high contrast, choreography, pop star, spotlights',
        prompt_zh: 'K-pop MV风格，舞台灯光，时尚潮流，充满活力，光泽感，高对比度，编舞，流行明星，聚光灯',
        previewColor: '#f0abfc'
    },
    { 
        id: 'city_pop_urban', label: 'City Pop现代都市', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1519681393798-2f61f2a55da7?q=80&w=800&auto=format&fit=crop' }, 
            portrait: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop' }
        },
        description: '80年代都市繁华感，霓虹灯、夜景、轻松惬意的都会氛围',
        usage: ['音乐', '都市', '复古'],
        prompt: 'city pop aesthetic, 80s japan, urban night, neon signs, nostalgic, retro anime vibe, glossy, vibrant, night drive',
        prompt_zh: 'City Pop美学，80年代日本，都市夜景，霓虹招牌，怀旧，复古动漫感，光泽，鲜艳，夜间驾驶',
        previewColor: '#818cf8'
    },
    { 
        id: 'city_pop_anime', label: 'City Pop复古动漫', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop' }
        },
        description: '80-90年代日本OVA动画风格，赛璐璐质感，色彩柔和复古',
        usage: ['怀旧', '音乐', '动画'],
        prompt: 'retro anime style, 80s ova, pastel colors, nostalgic, lo-fi, city lights, romantic, hand drawn animation, vintage',
        prompt_zh: '复古动漫风格，80年代OVA，柔和色彩，怀旧，低保真，城市灯光，浪漫，手绘动画，复古',
        previewColor: '#f9a8d4'
    },
    { 
        id: 'custom', label: '自定义 (Custom)', 
        assets: {}, 
        isCustom: true, 
        description: '不使用预设风格，完全根据提示词进行生成', 
        usage: ['任意场景'],
        prompt: '',
        prompt_zh: '',
        previewColor: '#333'
    },
];

export const VIDEO_STYLES: StyleOption[] = [
    { 
        id: 'cinematic', label: '影视质感 (Cinematic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
            video: { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
            sheet: { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '好莱坞大片质感，强调动态范围、景深与电影布光',
        usage: ['剧情', '商业广告', '史诗'],
        prompt: 'cinematic lighting, depth of field, movie still, color graded, 8k, highly detailed, atmospheric, anamorphic lens, film grain',
        prompt_zh: '电影质感光效，景深，电影剧照，专业调色，8k分辨率，高细节，氛围感，变形宽银幕镜头，胶片颗粒',
        previewColor: '#10b981'
    },
    { 
        id: 'high_sat_real', label: '高饱和写实 (High Saturation)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '色彩鲜艳浓郁的写实风格，适合展现充满活力的现代生活或自然风光',
        usage: ['旅游', '美食', '时尚'],
        prompt: 'vibrant colors, high saturation, hyperrealistic, sharp focus, vivid, bright lighting, commercial photography, colorful, energetic',
        prompt_zh: '鲜艳色彩，高饱和度，超写实，对焦清晰，生动，明亮光照，商业摄影，色彩丰富，充满活力',
        previewColor: '#facc15'
    },
    { 
        id: 'aesthetic_real', label: '唯美写实 (Aesthetic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop' }
        },
        description: '柔光、梦幻、干净的写实画面，追求极致的视觉美感与氛围',
        usage: ['MV', '写真', '情感片'],
        prompt: 'soft lighting, dreamy atmosphere, ethereal, aesthetic composition, clean, gentle colors, soft focus, instagram style, elegant',
        prompt_zh: '柔和光线，梦幻氛围，空灵，唯美构图，干净，温柔色彩，柔焦，INS风，优雅',
        previewColor: '#f472b6'
    },
    { 
        id: 'retro_dv', label: '复古DV质感 (Retro DV)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1515536765-9b2a740fa475?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop' }
        },
        description: '模拟90年代手持DV录像机的低保真、噪点与色偏效果，充满怀旧生活气息',
        usage: ['Vlog', '回忆录', '独立电影'],
        prompt: '1990s dv footage, camcorder style, vhs glitch, low resolution, noise, datamosh, handheld camera feel, home video aesthetic, timestamp',
        prompt_zh: '90年代DV录像，摄像机风格，VHS故障，低分辨率，噪点，数据损坏效果，手持镜头感，家庭录像美学，时间戳',
        previewColor: '#fb923c'
    },
    { 
        id: 'bw_film', label: '黑白电影 (B&W Film)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '经典黑白摄影，高对比度，强调光影结构与叙事张力',
        usage: ['艺术片', '侦探', '历史'],
        prompt: 'black and white photography, film grain, high contrast, noir style, dramatic lighting, monochrome, classic cinema',
        prompt_zh: '黑白摄影，胶片颗粒，高对比度，黑色电影风格，戏剧性布光，单色，经典电影',
        previewColor: '#18181b'
    },
    { 
        id: 'wkw_style', label: '王家卫电影 (WKW Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1493606371202-6275828f90f3?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '抽帧、重影、浓郁的色彩与暧昧的氛围，展现都市男女的情感纠葛',
        usage: ['爱情', '文艺片', '情绪短片'],
        prompt: 'wong kar-wai style, neon lights, motion blur, step printing, melancholic atmosphere, vivid reds and greens, cinematic, hong kong 90s',
        prompt_zh: '王家卫风格，霓虹灯，动态模糊，抽帧效果，忧郁氛围，鲜艳的红绿色调，电影感，90年代香港',
        previewColor: '#9f1239'
    },
    { 
        id: 'iwai_style', label: '岩井俊二电影 (Iwai Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1509967419530-321618802007?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' }
        },
        description: '逆光、过曝、青春残酷物语，日系清新的胶片质感',
        usage: ['青春校园', '治愈', '日系写真'],
        prompt: 'shunji iwai style, overexposed, soft focus, natural light, youthful, ethereal, pale colors, japanese film grain, airy',
        prompt_zh: '岩井俊二风格，过曝，柔焦，自然光，青春感，空灵，淡雅色彩，日系胶片颗粒，通透',
        previewColor: '#bae6fd'
    },
    { 
        id: 'japanese_anime', label: '日漫二次元 (Anime)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1560932669-5e3252f28b84?q=80&w=800&auto=format&fit=crop' }
        },
        description: '典型的新海诚或京都动画风格，色彩明快，线条细腻',
        usage: ['青春', '幻想', '热血'],
        prompt: 'anime style, makoto shinkai, vibrant sky, detailed background, cel shaded, 2d, high production value, colorful, emotional',
        prompt_zh: '日本动画风格，新海诚，绚丽天空，精细背景，赛璐璐渲染，2D，高制作水准，色彩丰富，情感细腻',
        previewColor: '#60a5fa'
    },
    { 
        id: 'chinese_comic', label: '国风漫剧 (CN Comic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1614726365723-49cfa356c496?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' }
        },
        description: '结合中国传统元素与现代漫画技法，色彩典雅，造型飘逸',
        usage: ['仙侠', '古言', '玄幻'],
        prompt: 'chinese manhua style, delicate lines, ancient fantasy, ethereal, flowy robes, watercolor textures mixed with digital, elegance',
        prompt_zh: '国漫风格，细腻线条，古风玄幻，飘逸，流动长袍，水墨质感结合数码绘画，优雅',
        previewColor: '#fcd34d'
    },
    { 
        id: 'korean_manhwa', label: '韩漫二次元 (Manhwa)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534030347209-7147fd5939d8?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1620065096574-d021c251478a?q=80&w=800&auto=format&fit=crop' }
        },
        description: '韩式条漫风格，色彩高饱和，人物修长美型，都市感强',
        usage: ['都市恋爱', '职场', '复仇'],
        prompt: 'manhwa style, webtoon, clean lines, high contrast, vibrant colors, beautiful characters, fashion focus, sharp details, vertical scrolling aesthetic',
        prompt_zh: '韩漫风格，条漫，线条干净，高对比度，鲜艳色彩，美型角色，时尚感，细节锐利，竖屏美学',
        previewColor: '#f472b6'
    },
    { 
        id: 'cel_shaded', label: '华丽三渲二 (Cel Shaded)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1612151855475-877969f4a6cc?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1633469924738-52101af516f3?q=80&w=800&auto=format&fit=crop' }
        },
        description: '类似《原神》或《崩坏》的游戏CG质感，3D建模配合2D渲染风格',
        usage: ['游戏', '动作', '科幻'],
        prompt: 'cel shaded, 3d rendered as 2d, genshin impact style, sharp shadows, vibrant anime colors, clean geometry, dynamic lighting, game cg',
        prompt_zh: '三渲二，卡通渲染，原神风格，锐利阴影，鲜艳动漫色彩，几何感强，动态光照，游戏CG',
        previewColor: '#818cf8'
    },
    { 
        id: 'ghibli', label: '吉卜力 (Ghibli)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1585644198335-d28075791986?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop' }
        },
        description: '宫崎骏手绘风格，色彩温暖自然，充满童话与治愈感',
        usage: ['儿童', '治愈', '奇幻'],
        prompt: 'studio ghibli style, hayao miyazaki, hand painted background, lush nature, fluffy clouds, nostalgic, warm colors, detailed environments',
        prompt_zh: '吉卜力风格，宫崎骏，手绘背景，繁茂自然，蓬松云朵，怀旧，暖色调，环境细节丰富',
        previewColor: '#34d399'
    },
    { 
        id: 'custom', label: '自定义 (Custom)', 
        assets: {}, 
        isCustom: true, 
        description: '不使用预设风格，完全根据提示词进行生成', 
        usage: ['任意场景'],
        prompt: '',
        prompt_zh: '',
        previewColor: '#333'
    },
];
