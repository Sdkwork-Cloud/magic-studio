export const portalVideo = {
  modes: {
    short_drama: {
      label: "AI 短剧",
      desc: "一键生成连贯故事短片"
    },
    video: {
      label: "AI 视频",
      desc: "生成高品质视频片段"
    },
    image: {
      label: "AI 图片",
      desc: "生成艺术图像与素材"
    },
    human: {
      label: "数字人",
      desc: "AI 数字人播报"
    },
    music: {
      label: "AI 音乐",
      desc: "生成背景音乐与音效"
    }
  },
  genModes: {
    smart_reference: {
      label: "全能参考",
      desc: "Intelligent Reference"
    },
    start_end: {
      label: "首尾帧",
      desc: "Start & End Frame"
    },
    smart_multi: {
      label: "智能多帧",
      desc: "Multi-Frame Control"
    },
    subject_ref: {
      label: "主体参考",
      desc: "Subject Consistency"
    },
    text: {
      label: "文生内容",
      desc: "使用提示词生成"
    },
    ref_multi: {
      label: "参考生成",
      desc: "上传风格参考图"
    }
  },
  tools: {
    categories: {
      all: "全部工具",
      video: "视频工具",
      image: "图像工具",
      audio: "音频工具"
    },
    video_extender: {
      title: "AI 视频延时",
      description: "无缝延长视频长度，保持内容连贯性"
    },
    lip_sync: {
      title: "嘴型同步",
      description: "让视频人物的嘴型与任意音频完美同步"
    },
    img_to_video: {
      title: "图像生成视频",
      description: "让静态图片动起来，生成逼真的动态视频"
    },
    video_upscale: {
      title: "视频升级",
      description: "将低分辨率视频提升至 4K 超清画质"
    },
    video_enhance: {
      title: "视频增强",
      description: "智能调节色彩、对比度，修复画质"
    },
    face_swap: {
      title: "视频换脸",
      description: "高精度的视频人脸替换技术"
    },
    baby_generator: {
      title: "AI 宝宝播客",
      description: "生成可爱的 AI 宝宝形象进行播报"
    },
    pet_generator: {
      title: "AI 宠物播客",
      description: "让你的宠物开口说话，制作趣味视频"
    },
    denoise: {
      title: "视频降噪",
      description: "去除视频中的噪点，提升画面纯净度"
    },
    dance_gen: {
      title: "AI 舞蹈生成",
      description: "根据音乐节奏自动生成舞蹈动作"
    },
    subtitle_remove: {
      title: "字幕移除",
      description: "智能擦除视频硬字幕，无痕修复背景"
    },
    anime_video: {
      title: "视频转动漫",
      description: "一键将真人视频转换为二次元动漫风格"
    },
    face_enhance: {
      title: "AI 人脸增强",
      description: "修复模糊人脸，增强面部细节"
    },
    img_remove_obj: {
      title: "物体移除",
      description: "智能移除图片中的路人或杂物"
    },
    bg_remove: {
      title: "背景移除",
      description: "精准抠图，一键移除图片背景"
    }
  },
  toolGrid: {
    lipsync: {
      label: "对口型",
      desc: "逼真唇形同步"
    },
    motion: {
      label: "动作模仿",
      desc: "视频动作迁移"
    },
    upscale: {
      label: "4K 升级",
      desc: "画质增强"
    },
    remove: {
      label: "字幕移除",
      desc: "智能擦除"
    },
    enhance: {
      label: "画质增强",
      desc: "色彩与细节"
    },
    repair: {
      label: "照片修复",
      desc: "老照片复原"
    },
    extend: {
      label: "视频延时",
      desc: "内容补全"
    },
    obj_remove: {
      label: "物体消除",
      desc: "一键移除"
    }
  },
  badges: {
    newest: "最新",
    hot: "热门",
    beta: "Beta",
    use_tool: "使用此工具"
  },
  page: {
    ai_tools_title: "AI 工具箱",
    ai_tools_subtitle: "探索强大的 AI 视频与图像处理工具，激发创意无限",
    search_placeholder: "搜索 AI 工具...",
    try_now: "立即试用",
    view_all: "全部工具",
    creative_tools: "AI 创意工具箱"
  },
  hero: {
    title: "有什么新的故事灵感？"
  },
  placeholders: {
    short_drama: "输入故事梗概，或上传剧本文件 (TXT/PDF)...",
    video_image_start_end: "上传图片作为起始帧，描述运动...",
    video: "描述画面内容、运动方向...",
    image: "描述画面细节、风格、构图...",
    music: "描述音乐风格、情绪...",
    speech: "输入要转换的文本...",
    default: "输入提示词..."
  },
  styles: {
    cinematic: {
      label: "影视质感 (Cinematic)",
      description: "好莱坞大片质感，强调动态范围、景深与电影布光",
      usage_drama: "剧情",
      usage_commercial: "商业广告",
      usage_epic: "史诗"
    },
    high_sat_real: {
      label: "高饱和写实 (High Saturation)",
      description: "色彩鲜艳浓郁的写实风格，适合展现充满活力的现代生活或自然风光"
    },
    aesthetic_real: {
      label: "唯美写实 (Aesthetic)",
      description: "柔光、梦幻、干净的写实画面，追求极致的视觉美感与氛围"
    },
    retro_dv: {
      label: "复古DV质感 (Retro DV)",
      description: "模拟90年代手持DV录像机的低保真、噪点与色偏效果，充满怀旧生活气息"
    },
    bw_film: {
      label: "黑白电影 (B&W Film)",
      description: "经典黑白摄影，高对比度，强调光影结构与叙事张力"
    },
    wkw_style: {
      label: "王家卫电影 (WKW Style)",
      description: "抽帧、重影、浓郁的色彩与暧昧的氛围，展现都市男女的情感纠葛"
    },
    iwai_style: {
      label: "岩井俊二电影 (Iwai Style)",
      description: "逆光、过曝、青春残酷物语，日系清新的胶片质感"
    },
    japanese_anime: {
      label: "日漫二次元 (Anime)",
      description: "典型的新海诚或京都动画风格，色彩明快，线条细腻"
    },
    chinese_comic: {
      label: "国风漫剧 (CN Comic)",
      description: "结合中国传统元素与现代漫画技法，色彩典雅，造型飘逸"
    },
    korean_manhwa: {
      label: "韩漫二次元 (Manhwa)",
      description: "韩式条漫风格，色彩高饱和，人物修长美型，都市感强"
    },
    cel_shaded: {
      label: "华丽三渲二 (Cel Shaded)",
      description: "类似《原神》或《崩坏》的游戏CG质感，3D建模配合2D渲染风格"
    },
    ghibli: {
      label: "吉卜力 (Ghibli)",
      description: "宫崎骏手绘风格，色彩温暖自然，充满童话与治愈感"
    },
    ancient_2d: {
      label: "2D古风 (2D Ancient)",
      description: "扁平化插画风格的古风画面，线条柔和，色彩淡雅"
    },
    ancient_3d: {
      label: "3D古风 (3D Ancient)",
      description: "类似《秦时明月》的3D国漫风格，建模精细，光效华丽"
    },
    ancient_real: {
      label: "真人古风 (Realistic Ancient)",
      description: "电影级别的古装剧质感，服化道考究，光影写实"
    },
    gongbi: {
      label: "中国工笔画 (Gongbi)",
      description: "传统工笔重彩风格，线条工整细致，色彩艳丽典雅"
    },
    sketch: {
      label: "素描简笔画 (Sketch)",
      description: "铅笔或炭笔手绘质感，黑白线条，简约抽象"
    },
    watercolor: {
      label: "水彩画 (Watercolor)",
      description: "水彩晕染效果，色彩通透，富有诗意和流动感"
    },
    oil_painting: {
      label: "油画 (Oil Painting)",
      description: "厚涂油画质感，笔触明显，色彩厚重，印象派风格"
    },
    clay: {
      label: "黏土 (Clay)",
      description: "定格动画风格，模拟手工黏土的质感与光泽，充满童趣"
    },
    felt: {
      label: "毛毡 (Felt Art)",
      description: "羊毛毡材质效果，毛茸茸的边缘，温暖柔软"
    },
    lego: {
      label: "乐高 (Lego)",
      description: "积木拼接风格，高光泽塑料质感，微缩摄影效果"
    },
    "3d_cartoon": {
      label: "3D卡通 (3D Cartoon)",
      description: "通用3D卡通渲染，色彩柔和，造型圆润，适合全年龄段"
    },
    pixar: {
      label: "皮克斯 (Pixar)",
      description: "顶级3D动画电影质感，极致的材质细节与表情捕捉"
    },
    cyberpunk: {
      label: "赛博朋克 (Cyberpunk)",
      description: "高对比度的霓虹色彩美学，雨夜、机械、全息投影与未来科技感"
    },
    futurism: {
      label: "未来主义 (Futurism)",
      description: "洁净的线条、金属质感、高科技构图，展现对未来的畅想"
    },
    y2k: {
      label: "Y2K拼贴艺术 (Y2K)",
      description: "千禧年复古未来风格，金属光泽、荧光色、低保真数字元素"
    },
    kpop: {
      label: "K-pop舞台 (K-pop)",
      description: "绚丽的舞台灯光，高对比度色彩，时尚潮流的服饰与妆容"
    },
    city_pop_urban: {
      label: "City Pop现代都市",
      description: "80年代都市繁华感，霓虹灯、夜景、轻松惬意的都会氛围"
    },
    city_pop_anime: {
      label: "City Pop复古动漫",
      description: "80-90年代日本OVA动画风格，赛璐璐质感，色彩柔和复古"
    },
    custom: {
      label: "自定义 (Custom)",
      description: "不使用预设风格，完全根据提示词进行生成"
    }
  }
};
