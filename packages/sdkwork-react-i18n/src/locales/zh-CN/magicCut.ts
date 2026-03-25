export const magicCut = {
    common: {
        save: "保存",
        cancel: "取消",
        delete: "删除",
        copy: "复制",
        paste: "粘贴",
        undo: "撤销",
        redo: "重做",
        selectAll: "全选",
        deselectAll: "取消全选",
        close: "关闭",
        confirm: "确认",
        loading: "加载中...",
        error: "错误",
        success: "成功",
        warning: "警告",
        info: "提示",
        searchPlaceholder: "搜索...",
        ready: "就绪",
        processing: "处理中...",
        enabled: "已启用",
        disabled: "已停用",
        resetDefault: "恢复默认",
        dragToAdjust: "拖动调整"
    },
    player: {
        play: "播放",
        pause: "暂停",
        stop: "停止",
        forward: "快进",
        backward: "快退",
        mute: "静音",
        unmute: "取消静音",
        fullscreen: "全屏",
        exitFullscreen: "退出全屏",
        currentTime: "当前时间",
        totalDuration: "总时长",
        frameRate: "帧率",
        playbackSpeed: "播放速度",
        previewLabel: "预览：{name}",
        emptySequence: "空序列",
        controls: {
            jumpToInPoint: "跳转到入点",
            jumpToOutPoint: "跳转到出点",
            stepBackFrame: "后退一帧",
            stepForwardFrame: "前进一帧",
            toggleLoopPlayback: "切换循环播放",
            setInPoint: "设置入点（I）",
            setOutPoint: "设置出点（O）",
            clearInOutPoints: "清除入点/出点",
            settings: "设置",
            fit: "适应",
            fullscreen: "全屏",
            jumpToStart: "跳转到开始",
            jumpToEnd: "跳转到结束"
        }
    },
    timeline: {
        title: "时间线",
        tracksHeader: "轨道",
        addTrack: "添加轨道",
        track: "轨道",
        mainTrack: "主轨道",
        sequenceDefault: "序列 {index}",
        newSequence: "新建序列",
        durationSeconds: "时长：{duration} 秒",
        videoTrack: "视频轨道",
        audioTrack: "音频轨道",
        textTrack: "文字轨道",
        subtitleTrack: "字幕轨道",
        effectTrack: "特效轨道",
        aiTrack: "AI 轨道",
        deleteTrack: "删除轨道",
        lockTrack: "锁定轨道",
        unlockTrack: "解锁轨道",
        muteTrack: "静音轨道",
        unmuteTrack: "取消静音",
        hideTrack: "隐藏轨道",
        showTrack: "显示轨道",
        zoomIn: "放大",
        zoomOut: "缩小",
        fitToView: "适应视图",
        splitClip: "分割片段",
        trimStartToPlayhead: "修剪起点到播放头",
        trimEndToPlayhead: "修剪终点到播放头",
        deleteClip: "删除片段",
        duplicateClip: "复制片段",
        nudgeLeft: "向左微调",
        nudgeRight: "向右微调",
        addMarker: "添加标记",
        snap: "吸附",
        snapping: "吸附",
        skimming: "预览",
        linkedSelection: "联动选择",
        zoomTimelineHelp: "缩放时间线（拖动缩放，Shift+拖动精细调整，双击重置）"
    },
    resources: {
        title: "资源",
        videos: "视频",
        images: "图片",
        audio: "音频",
        music: "音乐",
        voice: "语音",
        text: "文字",
        effects: "特效",
        transitions: "转场",
        sfx: "音效",
        templates: "模板",
        upload: "上传",
        import: "导入",
        search: "搜索资源...",
        noResults: "未找到资源",
        duration: "时长",
        resolution: "分辨率",
        size: "大小",
        favorite: "收藏",
        unfavorite: "取消收藏",
        categoryLabels: {
            video: "视频",
            image: "图片",
            audio: "音频",
            music: "音乐",
            voice: "语音",
            text: "文字",
            effects: "特效",
            transitions: "转场",
            sfx: "音效",
            templates: "模板"
        },
        placeholders: {
            searchTemplates: "搜索模板...",
            searchAssets: "搜索素材..."
        },
        viewModes: {
            grid: "网格视图",
            list: "列表视图"
        },
        actions: {
            saveAsTemplate: "保存为模板",
            importFiles: "导入文件",
            loadMore: "加载更多",
            addNew: "添加新内容",
            saveCurrentProjectAsTemplate: "将当前项目保存为模板",
            addToFavorites: "添加到收藏",
            removeFromFavorites: "从收藏中移除"
        },
        filters: {
            all: "全部",
            uploads: "上传内容",
            ai: "AI",
            favorites: "收藏"
        },
        emptyStates: {
            noTemplates: "未找到模板",
            noFavorites: "还没有收藏内容",
            noAssets: "未找到素材"
        },
        notifications: {
            favoriteUpdateFailedTitle: "收藏更新失败",
            favoriteUpdateFailedDescription: "Magic Studio 无法将该收藏保存到本地素材目录。",
            deleteUnavailableTitle: "无法删除",
            systemAssetReadOnly: "系统素材为只读，无法删除。",
            stockAssetReadOnly: "素材库资源为只读，无法删除。",
            assetInUseTitle: "素材正在使用中",
            assetInUseDescription: "该素材当前仍在时间线上使用。请先移除相关片段，再删除源素材。",
            deleteConfirmTitle: "删除素材",
            deleteConfirmMessage: "确认删除“{name}”吗？",
            deleteFailedTitle: "删除失败",
            deleteFailedDescription: "Magic Studio 无法从本地存储中移除此素材。"
        },
        defaults: {
            effectCategory: "滤镜"
        }
    },
    properties: {
        title: "属性",
        transform: "变换",
        position: "位置",
        rotation: "旋转",
        scale: "缩放",
        opacity: "不透明度",
        volume: "音量",
        speed: "速度",
        effects: "特效",
        filters: "滤镜",
        animation: "动画",
        keyframes: "关键帧",
        addKeyframe: "添加关键帧",
        removeKeyframe: "移除关键帧"
    },
    export: {
        title: "导出",
        fileName: "文件名",
        format: "格式",
        resolution: "分辨率",
        frameRate: "帧率",
        quality: "质量",
        bitrate: "码率",
        audio: "音频",
        video: "视频",
        exportVideo: "导出视频",
        exportAudio: "导出音频",
        estimatedSize: "预计大小",
        duration: "时长",
        exporting: "导出中...",
        cancel: "取消导出",
        complete: "导出完成",
        failed: "导出失败",
        qualityOptions: {
            lower: "较低（文件更小）",
            recommended: "推荐",
            higher: "较高（质量更好）"
        },
        modal: {
            title: "导出项目",
            subtitle: "根据当前运行时配置输出设置。",
            preview: "预览",
            previewAlt: "导出预览",
            noCoverFrame: "暂无封面帧",
            coverFrame: "封面帧",
            inOutRange: "入点/出点范围",
            audioMixdown: "音频混合导出",
            exportPreview: "导出预览",
            fileSettings: "文件设置",
            exportLocation: "导出位置",
            videoSettings: "视频设置",
            audioSettings: "音频设置",
            audioRenderingDisabled: "已关闭视频渲染，当前导出会切换为基于入点/出点范围的独立 WAV 音频混合导出。",
            quality: "质量",
            range: "范围",
            rangeValue: "入点 {start} 秒 -> 出点 {end} 秒",
            fullTimeline: "完整时间线",
            smartHdr: "智能 HDR",
            checkingHdr: "正在检查 HDR 导出支持...",
            audioOnlyHdr: "纯音频 WAV 混音不包含 HDR 元数据。",
            audioMode: "音频模式",
            audioStatusMaster: "主混音",
            audioStatusIncluded: "已包含",
            audioStatusMuted: "已静音",
            standaloneMixdown: "独立混音导出",
            embeddedAudio: "嵌入式音频",
            standaloneAudioDescription: "使用当前时间线混音、片段效果、淡入淡出和入点/出点范围导出独立的无压缩 WAV 母带。",
            embeddedAudioDescription: "音频将嵌入当前选中的视频容器中。关闭视频后可切换为独立 WAV 导出。",
            mutedAudioDescription: "当前导出将静音时间线音频。开启音频可将其嵌入视频，或导出独立 WAV 混音。"
        },
        previewCard: {
            audioMixdown: "音频混合导出",
            standaloneAudio: "独立 WAV 音频",
            canvas: "{aspectRatio} 画布",
            pcm48Khz: "48 kHz PCM",
            stereo48Khz: "48 kHz / 立体声",
            timelineDuration: "时间线 {duration} 秒"
        },
        footer: {
            renderingAudio: "正在渲染并编码最终音频混音...",
            renderingVideo: "正在渲染并封装最终时间线...",
            readyStandalone: "已准备好导出独立 WAV 混音。",
            readyRuntime: "已准备好按当前运行时路径导出。"
        },
        validation: {
            enableVideoOrAudio: "请至少启用视频或音频后再导出。",
            audioOnlyWav: "纯音频导出当前仅支持 WAV。",
            wavAudioOnly: "WAV 仅支持纯音频混合导出。",
            movUnavailable: "当前渲染器暂不支持 MOV 导出。",
            missingFileName: "请输入文件名。",
            invalidRange: "出点必须大于入点。",
            unknownError: "未知错误"
        },
        runtime: {
            inspectFailed: "导出运行时能力检查失败。",
            inspecting: "正在检查导出运行时能力...",
            inspectionFailedTitle: "运行时检查失败",
            unavailable: "运行时导出不可用",
            verified: "运行时导出能力已验证",
            noContainer: "当前运行时没有可用的真实视频封装格式。",
            mp4WebCodecsAndWebmMediaRecorder: "MP4 可通过 WebCodecs 导出，WebM 可通过 MediaRecorder 导出。",
            mp4WebCodecsOnly: "MP4 可通过高质量的 WebCodecs 路径导出。",
            mp4AndWebmMediaRecorder: "当前运行时可通过 MediaRecorder 兼容路径导出 MP4 和 WebM。",
            mp4MediaRecorderOnly: "当前运行时可通过 MediaRecorder 兼容模式导出 MP4。",
            webmMediaRecorderOnly: "当前运行时可通过 MediaRecorder 导出 WebM。",
            noSupportedFormat: "当前没有可用的受支持导出格式。请切换运行时或安装缺失的编码路径。",
            smartHdrUnsupported: "当前渲染器尚未实现智能 HDR 元数据透传。"
        },
        formatBadges: {
            master: "母带",
            bestQuality: "最佳质量",
            compatibility: "兼容模式",
            unavailable: "不可用",
            recommendedHere: "当前推荐"
        },
        formatDescriptions: {
            audioOnly: "用于独立交付的无压缩 PCM WAV 音频混音。",
            mp4WebCodecs: "通过 WebCodecs 和原生 MP4 封装导出 H.264 MP4。",
            mp4MediaRecorder: "通过运行时 MediaRecorder 兼容路径导出 MP4。",
            mp4Unavailable: "当前运行时没有真正可用的 MP4 导出路径。",
            webmMediaRecorder: "通过 MediaRecorder 导出 VP8/VP9 WebM。",
            webmUnavailable: "当前运行时没有真正可用的 WebM 导出路径。"
        },
        routeLabels: {
            webcodecs: "WebCodecs",
            mediaRecorder: "MediaRecorder",
            offlinePcm: "离线 PCM",
            notAvailable: "不可用"
        }
    },
    shortcuts: {
        title: "键盘快捷键",
        playback: "播放控制",
        navigation: "导航",
        editing: "编辑",
        tools: "工具",
        selection: "选择",
        playPause: "播放/暂停",
        stepForward: "向前步进",
        stepBackward: "向后步进",
        jumpStart: "跳到开头",
        jumpEnd: "跳到结尾",
        split: "分割片段",
        delete: "删除选中",
        copy: "复制",
        paste: "粘贴",
        undo: "撤销",
        redo: "重做",
        zoomIn: "放大",
        zoomOut: "缩小",
        playForward: "向前播放",
        playBackward: "向后播放",
        pausePlayback: "暂停",
        rippleDelete: "波纹删除所选内容",
        pasteInsert: "插入粘贴",
        nudgeLeft: "向左微调",
        nudgeRight: "向右微调",
        nudgeLeftBig: "向左微调 10 帧",
        nudgeRightBig: "向右微调 10 帧",
        setInPoint: "设置入点",
        setOutPoint: "设置出点",
        clearInOut: "清除入点/出点",
        trimStartToPlayhead: "将起点修剪到播放头",
        trimEndToPlayhead: "将终点修剪到播放头",
        zoomFit: "适应时间线视图",
        toggleSnapping: "切换吸附",
        toggleSkimming: "切换预览",
        toggleLinkedSelection: "切换联动选择",
        toolSelect: "选择工具",
        toolTrim: "修剪工具",
        toolRipple: "波纹编辑工具",
        toolRoll: "滚动编辑工具",
        toolSlip: "滑动工具",
        toolSlide: "滑行工具",
        toolRazor: "剃刀工具"
    },
    contextMenu: {
        headers: {
            selectedClip: "已选片段",
            trackOptions: "轨道选项",
            timeline: "时间线"
        },
        actions: {
            split: "分割片段",
            trimStart: "修剪起点（删除左侧）",
            trimEnd: "修剪终点（删除右侧）",
            detachAudio: "分离音频",
            deleteLift: "删除（上提）",
            rippleDelete: "波纹删除",
            pasteHere: "粘贴到此处",
            pasteInsertHere: "插入粘贴到此处",
            pasteOverwriteHere: "覆盖粘贴到此处",
            pasteToNewTrack: "粘贴到新轨道",
            pasteInsertToNewTrack: "插入粘贴到新轨道",
            pasteOverwriteToNewTrack: "覆盖粘贴到新轨道"
        }
    },
    toolbar: {
        ai: {
            image: "图像",
            video: "视频",
            speech: "语音",
            sfx: "音效",
            music: "音乐"
        },
        messages: {
            selectTrackFirst: "请先选择一个轨道",
            cannotGenerateVisualOnAudio: "无法在音频轨道上生成{action}",
            cannotGenerateAudioOnVideo: "无法在视频轨道上生成{action}",
            generateAtPlayhead: "在播放头位置生成 AI {action}"
        }
    },
    audioMixer: {
        title: "音频混音器",
        mute: "静音",
        solo: "独奏",
        noAudioTracks: "暂无可用音频轨道",
        selectedClip: "已选片段",
        fadeIn: "淡入",
        fadeOut: "淡出",
        master: "总控",
        clips: "片段（{count}）",
        more: "+{count} 个",
        clipFallback: "片段",
        clipVolume: "{name} - 音量：{volume}%"
    },
    dragOverlay: {
        previewAlt: "拖拽预览"
    },
    trackHeader: {
        deleteDialogTitle: "删除轨道？",
        deleteDialogMessage: "确认删除“{name}”吗？这会同时移除该轨道内的所有片段，且无法撤销。",
        changeCover: "更换封面",
        deleteTrack: "删除轨道",
        setCover: "设置封面",
        uploadCustom: "上传自定义封面",
        savingCover: "正在保存封面...",
        fromTrackClips: "从轨道片段中选择",
        scanningContent: "正在扫描内容...",
        noSuitableFrames: "未找到合适的画面。",
        coverAlt: "封面",
        editCover: "编辑",
        coverLabel: "封面"
    },
    editorToolbar: {
        saveTemplate: "保存为模板",
        export: "导出",
        templateSaved: "模板保存成功！"
    },
    saveTemplate: {
        title: "保存为模板",
        subtitle: "保存当前项目结构，便于复用",
        coverImage: "封面图片",
        uploadCover: "上传封面",
        coverHelp: "建议使用 16:9 比例，将用于模板库中的预览展示。",
        name: "模板名称",
        namePlaceholder: "例如：电影感 Vlog 片头",
        nameRequired: "名称不能为空",
        description: "描述",
        descriptionPlaceholder: "描述这个模板的用途...",
        publicTemplate: "公开模板",
        publicTemplateHelp: "将这个模板分享到社区市场。",
        price: "价格（美元）",
        pricePlaceholder: "0.00",
        priceHelp: "设置为 0 表示免费模板。",
        saving: "保存中...",
        save: "保存模板"
    },
    loadTemplate: {
        title: "加载模板",
        confirmMessage: "确认加载“{name}”吗？",
        warning: "这会覆盖当前时间线和项目设置，所有未保存的更改都会丢失。",
        confirm: "加载并替换"
    },
    audioSettings: {
        sections: {
            mixer: "混音",
            enhance: "AI 增强",
            properties: "属性"
        },
        fields: {
            volume: "音量",
            fadeIn: "淡入",
            fadeOut: "淡出",
            speed: "速度",
            gainNumeric: "增益（数值）",
            denoise: "AI 降噪",
            normalize: "响度归一化",
            equalizerEnabled: "均衡器已启用",
            openEqualizer: "打开均衡器",
            low: "低频",
            mid: "中频",
            high: "高频"
        },
        actions: {
            bypass: "旁路",
            resetEq: "重置均衡器",
            mute: "静音",
            unmute: "取消静音"
        },
        eq: {
            title: "三段均衡器",
            description: "该均衡器会直接写入片段的音频效果链，并用于预览和导出。"
        }
    },
    voiceSettings: {
        defaults: {
            script: "你好，世界",
            voiceAssetName: "语音",
            captionTrackName: "字幕",
            captionName: "字幕 {index}"
        },
        sections: {
            script: "脚本",
            speaker: "音色",
            properties: "属性",
            captions: "字幕"
        },
        fields: {
            voiceId: "音色 ID",
            speed: "速度",
            pitch: "音高"
        },
        placeholders: {
            textToSpeak: "输入要朗读的文本..."
        },
        status: {
            generationFailed: "生成失败",
            voiceRegenerated: "语音已重新生成"
        },
        errors: {
            noPlayableResult: "语音生成未返回可播放结果。",
            generationFailed: "语音生成失败。"
        },
        actions: {
            generateAudio: "生成音频",
            autoCaption: "自动生成字幕",
            exportSrt: "导出 SRT"
        },
        captions: {
            title: "时间线字幕",
            description: "自动生成字幕会在字幕轨道上创建关联字幕片段，导出 SRT 会下载相同时间轴的字幕文件。",
            ready: "当前脚本已准备好 {count} 条字幕提示",
            empty: "输入脚本后即可准备字幕提示。"
        },
        summary: "{speakerName} - {duration} 秒源音频"
    },
    textSettings: {
        sections: {
            content: "内容",
            character: "字符",
            paragraph: "段落",
            appearance: "外观",
            background: "背景",
            dropShadow: "投影"
        },
        placeholders: {
            enterText: "输入文本..."
        },
        fontGroups: {
            sansSerif: "无衬线",
            serif: "衬线",
            monospace: "等宽"
        },
        actions: {
            bold: "加粗",
            italic: "斜体"
        },
        fields: {
            fillColor: "填充颜色",
            stroke: "描边",
            color: "颜色",
            width: "宽度",
            padding: "边距",
            radius: "圆角",
            blur: "模糊"
        }
    },
    imageSettings: {
        sections: {
            aiToolbox: "AI 工具箱",
            colorCorrection: "色彩校正",
            filters: "滤镜"
        },
        messages: {
            assetWorkflowRequired: "需要走素材工作流",
            useEffectsTab: "请使用“特效”标签来添加滤镜"
        },
        tools: {
            removeBg: "移除背景",
            upscale4k: "放大到 4K",
            magicEraser: "魔术橡皮擦",
            remix: "重混"
        },
        reasons: {
            removeBg: "背景抠图需要先在素材工作流中处理，再将结果带回时间线。",
            upscale4k: "4K 放大目前是素材级操作，而不是时间线中的破坏性图像重写。",
            magicEraser: "目标移除需要遮罩绘制，而当前图片面板还没有提供遮罩编辑能力。",
            remix: "重混需要单独的生成会话，并在时间线编辑器之外完成素材交接。"
        },
        fields: {
            temperature: "色温"
        }
    },
    keyframeEditor: {
        easing: {
            linear: "线性",
            easeIn: "缓入",
            easeOut: "缓出",
            easeInOut: "缓入缓出",
            step: "阶梯"
        },
        actions: {
            delete: "删除"
        }
    },
    visualTransform: {
        sections: {
            compositing: "合成"
        },
        actions: {
            resetPositionScale: "重置位置/缩放",
            fit: "适应",
            flipHorizontal: "水平翻转",
            flipVertical: "垂直翻转"
        },
        fields: {
            blendMode: "混合模式"
        },
        blendModes: {
            normal: "正常",
            screen: "滤色",
            multiply: "正片叠底",
            overlay: "叠加",
            add: "相加（线性减淡）",
            darken: "变暗",
            lighten: "变亮"
        }
    },
    videoNode: {
        generating: "生成中",
        uploadVideo: "上传视频",
        doubleClickToBrowse: "双击浏览文件",
        replaceVideo: "替换视频",
        replace: "替换"
    },
    tools: {
        select: "选择工具",
        trim: "修剪工具",
        ripple: "波纹编辑工具",
        roll: "滚动编辑工具",
        slip: "滑动工具",
        slide: "滑行工具",
        razor: "剃刀工具"
    },
    effects: {
        blur: "模糊",
        brightness: "亮度",
        contrast: "对比度",
        saturation: "饱和度",
        hue: "色相",
        sharpen: "锐化",
        vignette: "暗角",
        grayscale: "灰度",
        sepia: "复古",
        invert: "反色"
    },
    transitions: {
        fade: "淡入淡出",
        dissolve: "溶解",
        wipe: "擦除",
        slide: "滑动",
        zoom: "缩放",
        spin: "旋转"
    },
    errors: {
        loadFailed: "资源加载失败",
        exportFailed: "视频导出失败",
        unsupportedFormat: "不支持的格式",
        fileTooLarge: "文件过大",
        insufficientMemory: "内存不足",
        renderFailed: "渲染失败"
    }
};
