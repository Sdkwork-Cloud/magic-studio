export const film = {
  common: {
    characters: "角色",
    locations: "场景",
    props: "道具",
    scenes: "场次",
    shots: "分镜",
    script: "剧本",
    storyboard: "分镜表",
    timeline: "时间线",
    overview: "概览",
    preview: "预览",
    save: "保存",
    export: "导出",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    generate: "生成",
    generating: "生成中...",
    upload: "上传",
    remove: "移除",
    settings: "设置",
    ai_generate: "AI 生成",
    ai_regenerate: "AI 重新生成",
    generate_result: "生成结果",
    generate_image: "生成图片",
    no_desc: "暂无描述",
    unknown: "未知",
    loading: "加载中...",
  },
  status: {
    draft: "草稿",
    analyzing: "分析中",
    script_ready: "剧本就绪",
    storyboard_ready: "分镜就绪",
    generating: "生成中",
    completed: "已完成",
  },
  sidebar: {
    title: "项目列表",
    search_placeholder: "搜索项目...",
    new_project: "新建项目",
    create_placeholder: "输入项目名称",
    create_btn: "创建",
    cancel_btn: "取消",
    no_projects: "暂无项目",
    create_first: "创建新项目",
    view_all: "查看全部",
    project_count: "{count} 个项目",
  },
  overview: {
    est_duration: "预估 {min} 分钟",
    completion: "完成度 {percent}%",
    pages: "页",
    story_summary: "故事梗概 (Story Summary)",
    story_summary_placeholder: "暂无故事梗概。请在项目设置或剧本分析中添加描述。",
    art_style: "美术风格 (Art Style)",
    art_style_placeholder: "未定义风格标签",
    art_style_desc: "视觉基调设定为写实风格，强调光影质感与情感氛围的渲染。",
    cast: "登场角色 (Cast)",
    view_all: "查看全部",
    add_character: "添加角色",
    add_prop: "添加道具",
    add_location: "添加地点",
    generate_all: "全部生成",
    generating_batch: "批量生成中...",
    generate_missing: "生成缺失镜头",
  },
  script: {
    title: "剧本编辑器",
    outline: "大纲",
    analyze_btn: "AI 剧本拆解",
    analyzing: "分析中...",
    scenes_list: "场景列表",
    no_scenes: "未检测到场景。",
    no_scenes_hint: "请使用 INT. 或 EXT. 开头标记场景。",
    editor_placeholder: "淡入:\n\n内景. 咖啡店 - 白天\n\n空气中弥漫着烘焙咖啡豆的香气...",
  },
  character: {
    title: "角色管理",
    subtitle: "管理剧本中的登场角色，定义其外貌、性格与声音特征。",
    add_btn: "添加角色",
    ai_extract: "AI 提取角色",
    extracting: "提取中...",
    modal: {
      new_title: "新建角色",
      edit_title: "编辑角色",
      tabs: {
        avatar: "头像",
        sheet: "三视图",
        grid: "九宫格"
      },
      name: "姓名",
      gender: "性别",
      age: "年龄",
      description: "描述",
      traits: "特征",
      voice_settings: "配音设置"
    }
  },
  location: {
    title: "场景管理",
    subtitle: "管理故事发生的物理环境与概念图。",
    add_btn: "添加地点",
    ai_extract: "AI 提取地点",
    modal: {
      new_title: "新建场景",
      edit_title: "编辑场景",
      visual_ref: "概念图 / 环境",
      name: "名称",
      time: "时间",
      indoor: "室内",
      atmosphere: "氛围标签",
      visual_desc: "视觉描述"
    }
  },
  prop: {
    title: "道具管理",
    subtitle: "管理剧本中出现的关键物品。",
    add_btn: "添加道具",
    ai_extract: "AI 提取道具",
    modal: {
      new_title: "新建道具",
      edit_title: "编辑道具",
      visual_ref: "视觉参考",
      name: "名称",
      role: "作用",
      description: "描述",
      roles: {
        plot_device: "剧情关键道具",
        symbol: "象征性道具",
        character_bind: "角色绑定道具",
        atmosphere: "氛围道具"
      }
    }
  },
  storyboard: {
    title: "分镜表",
    scene: "场次 {index}",
    gen_images: "生成图片",
    gen_videos: "生成视频",
    add_shot: "添加分镜",
    insert_before: "在此前插入场次",
    insert_after: "在此后追加场次",
    insert_scene: "插入场次",
    no_scenes_title: "未找到场次",
    no_scenes_desc: "请先分析剧本或手动创建第一个场次。",
    create_first: "创建首个场次"
  },
  shot: {
    modal: {
      edit_title: "编辑分镜",
      visual_result: "视觉结果",
      gen_settings: "生成设置",
      modes: {
        image_to_video: "图生视频",
        text_to_video: "文生视频"
      },
      products: {
        single: "单图",
        start_end: "首尾帧",
        multi_ref: "多图参考",
        grid: "九宫格"
      },
      visual_prompt: "视觉提示词",
      dialogue_script: "对白 & 脚本",
      add_line: "添加台词",
      description: "画面描述",
      action: "动作",
      shot_scale: "景别",
      camera: "运镜",
      duration: "时长"
    }
  },
  scene: {
    modal: {
      new_title: "新建场次",
      edit_title: "编辑场次",
      location_preview: "场景预览",
      location: "地点",
      no_locations: "未定义地点。请先在场景页签添加地点。",
      summary: "摘要",
      mood: "氛围标签",
      cast: "登场角色",
      props: "道具",
      visual_prompt: "视觉提示词"
    }
  },
  preview: {
    no_active_shot: "无选中分镜",
    no_media: "未生成媒体",
    monitor: "监视器"
  },
  timeline: {
      title: "生成时间线",
      desc: "在此处将分镜序列转换为连贯的视频剪辑工程。"
  },
  copilot: {
      title: "编剧助手"
  },
  settings: {
      format: "项目格式",
      quality: "输出质量",
      resolution: "分辨率",
      framerate: "帧率",
      ai_gen: "AI 生成",
      apply_desc: "设置仅应用于新生成的素材。\n现有素材不会受到影响。"
  }
};
