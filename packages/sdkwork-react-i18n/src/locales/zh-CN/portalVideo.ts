export const portalVideo = {
  modes: {
    short_drama: {
      label: "AI \u77ed\u5267",
      desc: "\u4e00\u952e\u751f\u6210\u8fde\u8d2f\u7684\u6545\u4e8b\u7247\u6bb5",
    },
    video: {
      label: "AI \u89c6\u9891",
      desc: "\u751f\u6210\u9ad8\u8d28\u91cf\u89c6\u9891\u7247\u6bb5",
    },
    image: {
      label: "AI \u56fe\u50cf",
      desc: "\u751f\u6210\u827a\u672f\u56fe\u50cf\u4e0e\u7d20\u6750",
    },
    human: {
      label: "\u89d2\u8272",
      desc: "AI \u89d2\u8272\u521b\u5efa\u4e0e\u8868\u73b0",
    },
    music: {
      label: "AI \u97f3\u4e50",
      desc: "\u751f\u6210\u80cc\u666f\u97f3\u4e50\u4e0e\u97f3\u6548",
    },
  },
  genModes: {
    smart_reference: {
      label: "\u667a\u80fd\u53c2\u8003",
      desc: "\u667a\u80fd\u53c2\u8003\u6a21\u5f0f",
    },
    start_end: {
      label: "\u9996\u5c3e\u5e27",
      desc: "\u901a\u8fc7\u9996\u5c3e\u5e27\u751f\u6210",
    },
    smart_multi: {
      label: "\u591a\u5e27\u667a\u63a7",
      desc: "\u591a\u5e27\u5185\u5bb9\u63a7\u5236",
    },
    subject_ref: {
      label: "\u4e3b\u4f53\u53c2\u8003",
      desc: "\u4fdd\u6301\u4e3b\u4f53\u4e00\u81f4\u6027",
    },
    text: {
      label: "\u6587\u672c\u751f\u6210",
      desc: "\u4f7f\u7528\u63d0\u793a\u8bcd\u751f\u6210\u5185\u5bb9",
    },
    ref_multi: {
      label: "\u53c2\u8003\u751f\u6210",
      desc: "\u4e0a\u4f20\u98ce\u683c\u53c2\u8003\u56fe\u7247",
    },
  },
  tools: {
    categories: {
      all: "\u5168\u90e8\u5de5\u5177",
      video: "\u89c6\u9891\u5de5\u5177",
      image: "\u56fe\u50cf\u5de5\u5177",
      audio: "\u97f3\u9891\u5de5\u5177",
    },
    video_extender: {
      title: "AI \u89c6\u9891\u6269\u5c55",
      description: "\u65e0\u7f1d\u5ef6\u957f\u89c6\u9891\u65f6\u957f\uff0c\u4fdd\u6301\u5185\u5bb9\u8fde\u8d2f\u3002",
    },
    lip_sync: {
      title: "\u53e3\u578b\u540c\u6b65",
      description: "\u8ba9\u89c6\u9891\u4e2d\u7684\u4eba\u7269\u53e3\u578b\u4e0e\u4efb\u610f\u97f3\u9891\u7cbe\u51c6\u5bf9\u9f50\u3002",
    },
    img_to_video: {
      title: "\u56fe\u751f\u89c6\u9891",
      description: "\u4e3a\u9759\u6001\u56fe\u50cf\u6ce8\u5165\u771f\u5b9e\u52a8\u6548\u3002",
    },
    video_upscale: {
      title: "\u89c6\u9891\u8d85\u5206",
      description: "\u5c06\u4f4e\u5206\u8fa8\u7387\u89c6\u9891\u5347\u7ea7\u81f3 4K \u8d85\u6e05\u3002",
    },
    video_enhance: {
      title: "\u89c6\u9891\u589e\u5f3a",
      description: "\u667a\u80fd\u8c03\u6574\u8272\u5f69\u3001\u5bf9\u6bd4\u5ea6\u5e76\u4f18\u5316\u753b\u8d28\u3002",
    },
    face_swap: {
      title: "\u6362\u8138",
      description: "\u9ad8\u7cbe\u5ea6\u89c6\u9891\u6362\u8138\u80fd\u529b\u3002",
    },
    baby_generator: {
      title: "AI \u840c\u5a03\u751f\u6210",
      description: "\u521b\u5efa\u53ef\u7231\u7684 AI \u5a03\u5a03\u89d2\u8272\u7528\u4e8e\u5185\u5bb9\u521b\u4f5c\u3002",
    },
    pet_generator: {
      title: "AI \u5ba0\u7269\u751f\u6210",
      description: "\u8ba9\u4f60\u7684\u5ba0\u7269\u201c\u5f00\u53e3\u8bf4\u8bdd\u201d\uff0c\u521b\u4f5c\u6709\u8da3\u5185\u5bb9\u3002",
    },
    denoise: {
      title: "\u89c6\u9891\u964d\u566a",
      description: "\u79fb\u9664\u89c6\u9891\u566a\u70b9\uff0c\u8ba9\u753b\u9762\u66f4\u5e72\u51c0\u3002",
    },
    dance_gen: {
      title: "AI \u821e\u8e48\u751f\u6210",
      description: "\u6839\u636e\u97f3\u4e50\u8282\u594f\u81ea\u52a8\u751f\u6210\u821e\u8e48\u52a8\u4f5c\u3002",
    },
    subtitle_remove: {
      title: "\u5b57\u5e55\u53bb\u9664",
      description: "\u667a\u80fd\u64e6\u9664\u786c\u5b57\u5e55\u5e76\u6062\u590d\u80cc\u666f\u3002",
    },
    anime_video: {
      title: "\u89c6\u9891\u8f6c\u52a8\u6f2b",
      description: "\u4e00\u952e\u5c06\u771f\u4eba\u89c6\u9891\u8f6c\u4e3a\u52a8\u6f2b\u98ce\u683c\u3002",
    },
    face_enhance: {
      title: "AI \u4eba\u8138\u589e\u5f3a",
      description: "\u4fee\u590d\u6a21\u7cca\u4eba\u8138\uff0c\u63d0\u5347\u9762\u90e8\u7ec6\u8282\u3002",
    },
    img_remove_obj: {
      title: "\u7269\u4f53\u79fb\u9664",
      description: "\u667a\u80fd\u4ece\u56fe\u50cf\u4e2d\u79fb\u9664\u4eba\u7269\u6216\u7269\u4f53\u3002",
    },
    bg_remove: {
      title: "\u80cc\u666f\u79fb\u9664",
      description: "\u7cbe\u51c6\u62a0\u56fe\uff0c\u4e00\u952e\u53bb\u9664\u56fe\u50cf\u80cc\u666f\u3002",
    },
  },
  toolGrid: {
    lipsync: {
      label: "\u53e3\u578b\u540c\u6b65",
      desc: "\u771f\u5b9e\u53e3\u578b\u9a71\u52a8",
    },
    motion: {
      label: "\u52a8\u4f5c\u590d\u5236",
      desc: "\u89c6\u9891\u52a8\u4f5c\u8fc1\u79fb",
    },
    upscale: {
      label: "4K \u8d85\u5206",
      desc: "\u753b\u8d28\u63d0\u5347",
    },
    remove: {
      label: "\u5b57\u5e55\u53bb\u9664",
      desc: "\u667a\u80fd\u64e6\u9664",
    },
    enhance: {
      label: "\u753b\u8d28\u589e\u5f3a",
      desc: "\u8272\u5f69\u4e0e\u7ec6\u8282\u4f18\u5316",
    },
    repair: {
      label: "\u8001\u7167\u7247\u4fee\u590d",
      desc: "\u65e7\u7167\u7247\u8fd8\u539f",
    },
    extend: {
      label: "\u89c6\u9891\u5ef6\u957f",
      desc: "\u8865\u5168\u5185\u5bb9",
    },
    obj_remove: {
      label: "\u7269\u4f53\u79fb\u9664",
      desc: "\u4e00\u952e\u6e05\u9664",
    },
  },
  badges: {
    newest: "\u6700\u65b0",
    hot: "\u70ed\u95e8",
    beta: "Beta",
    use_tool: "\u7acb\u5373\u4f53\u9a8c",
  },
  page: {
    ai_tools_title: "AI \u5de5\u5177",
    ai_tools_subtitle: "\u63a2\u7d22\u5f3a\u5927\u7684 AI \u89c6\u9891\u4e0e\u56fe\u50cf\u5904\u7406\u5de5\u5177\uff0c\u91ca\u653e\u65e0\u9650\u521b\u610f\u3002",
    search_placeholder: "\u641c\u7d22 AI \u5de5\u5177...",
    try_now: "\u7acb\u5373\u4f53\u9a8c",
    view_all: "\u5168\u90e8\u5de5\u5177",
    creative_tools: "AI \u521b\u4f5c\u5de5\u5177",
    results_count: "\u5171 {count} \u4e2a\u5de5\u5177",
    empty_title: "\u6ca1\u6709\u5339\u914d\u7684\u5de5\u5177",
    empty_description: "\u8bf7\u5c1d\u8bd5\u5176\u4ed6\u641c\u7d22\u8bcd\u6216\u5207\u6362\u5206\u7c7b\u3002",
  },
  hero: {
    title: "\u4f60\u60f3\u8981\u8bb2\u4e00\u4e2a\u600e\u6837\u7684\u65b0\u6545\u4e8b\uff1f",
  },
  placeholders: {
    short_drama: "\u8f93\u5165\u6545\u4e8b\u5927\u7eb2\uff0c\u6216\u4e0a\u4f20\u5267\u672c\u6587\u4ef6 (TXT/PDF)...",
    video_image_start_end: "\u4e0a\u4f20\u56fe\u7247\u4f5c\u4e3a\u9996\u5e27\uff0c\u63cf\u8ff0\u52a8\u4f5c\u548c\u955c\u5934...",
    video: "\u63cf\u8ff0\u573a\u666f\u5185\u5bb9\u3001\u8fd0\u52a8\u65b9\u5411\u548c\u8282\u594f...",
    image: "\u63cf\u8ff0\u56fe\u50cf\u7ec6\u8282\u3001\u98ce\u683c\u3001\u6784\u56fe\u4e0e\u5149\u7ebf...",
    music: "\u63cf\u8ff0\u97f3\u4e50\u98ce\u683c\u3001\u60c5\u7eea\u548c\u4e50\u5668...",
    speech: "\u8f93\u5165\u8981\u8f6c\u6362\u4e3a\u8bed\u97f3\u7684\u6587\u672c...",
    default: "\u8f93\u5165\u63d0\u793a\u8bcd...",
  },
};
