import { common, sidebar, header, download } from './common';
import { settings } from './settings';
import { editor } from './editor';
import { auth } from './auth';
import { copilot } from './copilot';
import { notes } from './notes';
import { vip } from './vip';
import { market } from './market';
import { browser } from './browser';
import { drive, studio, portal } from './modules';
import { canvas } from './canvas';
import { magicCut } from './magicCut';
import { film } from './film';
import { video } from './video';
import { image } from './image';
import { portalVideo } from './portalVideo';
import { assetCenter } from './assetCenter';
import { plugins } from './plugins';
import { skills } from './skills';

export const zhCN = {
    common: {
        ...common,
        actions: {
            ...common.actions,
            back_home: '返回首页',
        },
    },
    sidebar: {
        ...sidebar,
        terminal: '终端',
        magic_cut: '魔映',
    },
    header: {
        ...header,
        developer_tools: '开发工具',
        developer_menu: '开发',
        reload_app: '重新加载应用',
        toggle_devtools: '切换开发者工具',
    },
    download,
    appShell: {
        brand: 'Magic Studio',
        tagline: '创作',
        loading: '加载中...',
        loading_module: '模块加载中...',
        loading_route: '路由加载中...',
    },
    workspaceDialogs: {
        createWorkspace: {
            title: '新建工作区',
            subtitle: '组织你的项目和素材',
            nameLabel: '工作区名称',
            namePlaceholder: '例如：我的 AI 创意工作室',
            descriptionLabel: '描述（可选）',
            descriptionPlaceholder: '这个工作区主要用来做什么？',
            creating: '创建中...',
            confirm: '创建工作区',
        },
        createProject: {
            title: '新建项目',
            subtitle: '属于 {workspace}',
            workspaceFallback: '工作区',
            typeLabel: '项目类型',
            nameLabel: '项目名称',
            namePlaceholder: '例如：NextGen Dashboard',
            descriptionLabel: '描述（可选）',
            descriptionPlaceholder: '简要描述你的项目...',
            coverLabel: '封面图片',
            uploadCover: '上传封面',
            creating: '创建中...',
            confirm: '创建项目',
            createFailed: '创建项目失败',
            types: {
                application: {
                    label: '应用项目',
                    description: '全栈 Web 或桌面应用',
                },
                video: {
                    label: '视频项目',
                    description: 'AI 视频生成与剪辑',
                },
                audio: {
                    label: '音频项目',
                    description: '音乐与语音生成',
                },
            },
        },
    },
    generationHistory: {
        emptyTitle: '暂无历史记录',
        emptyDescription: '开始生成后，你的创作时间线会出现在这里。',
        emptyFiltered: '当前筛选条件下暂无内容。',
        preview: {
            history: '历史记录',
            moreFromGallery: '更多同类作品',
            like: '点赞',
            download: '下载',
            share: '分享',
            loadingPreview: '正在加载预览...',
            info: '信息',
            creator: '创作者',
            follow: '关注',
            views: '浏览',
            likes: '点赞',
            comments: '评论',
            prompt: '提示词',
            copy: '复制',
            details: '生成详情',
            model: '模型',
            aspectRatio: '画面比例',
            created: '创建时间',
            unknown: '未知',
            remixVideo: '重制该视频',
            remixImage: '重制该图片',
            editDetails: '编辑详情',
            delete: '删除',
        },
        item: {
            notifySavedTitle: '已保存',
            notifySavedBody: '已将 {count} 个资产保存到素材库。',
            notifyErrorTitle: '错误',
            notifyErrorBody: '保存到素材库失败。',
            generating: '生成中...',
            generationFailed: '生成失败',
            regenerate: '重新生成',
            saveToAssets: '保存到素材库',
            saved: '已保存',
            copyPrompt: '复制提示词',
            delete: '删除',
            preview: '预览',
            video: '视频',
        },
        mediaTypes: {
            image: '图片',
            video: '视频',
            audio: '音频',
            voice: '语音',
            music: '音乐',
            speech: '语音合成',
            media: '媒体',
        },
    },
    profilePage: {
        navigation: {
            title: '账户导航',
            progress: '资料进度',
        },
        common: {
            save: '保存',
            discardChanges: '放弃更改',
            refreshing: '刷新中...',
            refreshData: '刷新数据',
            records: '条记录',
        },
        sections: {
            overview: { title: '个人资料', description: '基础身份信息' },
            security: { title: '安全', description: '密码与登录记录' },
            addresses: { title: '地址簿', description: '收货与联系地址' },
            contacts: { title: '联系人', description: '好友与联系人请求' },
            preferences: { title: '偏好设置', description: '个性化体验设置' },
            activity: { title: '活动', description: '最近操作时间线' },
        },
        passwordStrength: {
            notSet: { label: '未设置', hint: '请使用 8 位以上并混合多种字符。' },
            weak: { label: '弱', hint: '请补充大写字母、数字和符号。' },
            fair: { label: '一般', hint: '再增加一种字符类型会更安全。' },
            strong: { label: '强', hint: '已经不错，建议使用 12 位以上密码。' },
            veryStrong: { label: '非常强', hint: '密码强度优秀。' },
        },
        dialogs: {
            unsavedSection: '当前分区有未保存的更改，仍要离开吗？',
            deleteAddress: '要删除这个地址吗？',
            deleteContact: '要删除这个联系人吗？',
        },
        actions: {
            saveProfile: '保存资料',
            savePreferences: '保存偏好设置',
            back: '返回',
            replaceAvatar: '替换头像',
            changeAvatar: '更换头像',
            uploadAvatar: '上传头像',
            refreshActivity: '刷新活动',
        },
        avatar: {
            pendingUpload: '新头像已准备好，保存资料后即可上传。',
            keepCurrent: '当前头像已同步。',
            empty: '尚未上传头像。',
        },
        overview: {
            title: '资料概览',
            unsaved: '资料修改尚未保存',
            saved: '资料修改已全部保存',
            avatarTitle: '头像',
            avatarSupport: '支持最大 5 MB 的图片文件。',
            clearAvatarDraft: '清除头像草稿',
            email: '邮箱',
            phone: '手机号',
            region: '地区',
            notBound: '未绑定',
            notSet: '未设置',
            noEmailBound: '未绑定邮箱',
            noPhoneBound: '未绑定手机号',
            editBasicInformation: '编辑基础信息',
            nickname: '昵称',
            nicknamePlaceholder: '你的昵称',
            nicknameHint: '至少使用 2 个字符。',
            regionPlaceholder: '你的地区',
            bio: '简介',
            bioPlaceholder: '写一段简短的自我介绍',
        },
        addresses: {
            savedTitle: '已保存地址',
            defaultHint: '默认地址：{name}',
            defaultFallback: '已设置',
            noDefault: '暂未设置默认地址。',
            actions: {
                add: '新增地址',
                update: '更新地址',
                save: '保存地址',
            },
        },
        security: {
            title: '安全中心',
            scoreSuffix: '安全评分',
            changePassword: '修改密码',
            currentPassword: '当前密码',
            newPassword: '新密码（至少 8 位）',
            passwordStrength: '密码强度',
            emailPlaceholder: '邮箱地址',
            phonePlaceholder: '手机号',
            actions: {
                updatePassword: '更新密码',
            },
        },
        contacts: {
            searchTitle: '搜索联系人',
            searchHint: '按昵称、用户名或地区筛选。',
            friendRequestsTitle: '好友请求',
            noFriendRequests: '暂无好友请求。',
            actions: {
                refresh: '刷新联系人',
                refreshing: '刷新中...',
            },
        },
        preferences: {
            theme: '主题',
            language: '语言',
            themeOptions: {
                system: '跟随系统',
                light: '浅色',
                dark: '深色',
            },
            notificationsTitle: '通知',
            notificationLabels: {
                system: '系统通知',
                message: '消息通知',
                activity: '活动通知',
                promotion: '促销通知',
                sound: '声音提醒',
                vibration: '震动提醒',
            },
            notificationDescriptions: {
                system: '接收重要系统更新。',
                message: '显示私信通知。',
                activity: '跟踪账户活动动态。',
                promotion: '接收优惠与活动更新。',
                sound: '来通知时播放提示音。',
                vibration: '关键提醒使用震动。',
            },
            privacyTitle: '隐私',
            privacyLabels: {
                publicProfile: '公开资料',
                allowSearch: '允许搜索',
                allowFriendRequest: '允许好友请求',
            },
            privacyDescriptions: {
                publicProfile: '允许他人查看你的资料。',
                allowSearch: '允许在搜索结果中发现你的资料。',
                allowFriendRequest: '允许新的好友请求。',
            },
            playbackTitle: '播放与流量',
            playbackLabels: {
                autoPlay: '自动播放',
                highQuality: '高质量',
                dataSaver: '节省流量',
            },
            playbackDescriptions: {
                autoPlay: '自动播放生成预览。',
                highQuality: '优先使用高质量输出。',
                dataSaver: '尽量降低网络消耗。',
            },
            states: {
                unsaved: '偏好设置尚未保存',
                synced: '偏好设置已同步',
            },
        },
        states: {
            loadingProfile: '正在加载资料...',
            loadingHistory: '正在加载历史...',
            saving: '保存中...',
        },
        fields: {
            confirmNewPassword: '确认新密码',
        },
        history: {
            loginTitle: '登录历史',
            generationTitle: '生成历史',
            noLoginRecords: '暂无登录记录。',
            noGenerationRecords: '暂无生成记录。',
        },
        headings: {
            userPreferences: '用户偏好设置',
            recentActivity: '最近活动',
        },
        stats: {
            profileCompletion: { title: '资料完整度', hint: '补全关键字段可提升推荐质量。' },
            recentActivity: { title: '最近活动', hint: '登录与生成记录的合计数量。' },
            totalContacts: { title: '联系人总数', hint: '账号中的好友联系人总量。' },
            onlineNow: { title: '当前在线', hint: '当前在线的联系人数量。' },
            newRequests: { title: '新请求', hint: '等待你处理的请求数量。' },
        },
    },
    settings: {
        ...settings,
        page: {
            comingSoon: {
                lsp: 'LSP 设置（即将上线）',
                llm: 'LLM 设置（即将上线）',
            },
            about: {
                version: '版本 {version}（{channel}）',
                channel: {
                    beta: '测试版',
                },
                runtime: {
                    electron: 'Electron',
                    chromium: 'Chromium',
                    node: 'Node',
                },
            },
            search: {
                clear: '清空搜索',
            },
            aria: {
                tabs: '设置分类',
            },
        },
        storage: {
            ...settings.storage,
            material: {
                ...settings.storage.material,
                mode: {
                    ...settings.storage.material.mode,
                    desc: '选择魔映是否默认先写入本地文件系统，或强制仅使用服务端上传。',
                },
            },
        },
    },
    editor,
    auth: {
        ...auth,
        bindInvite: {
            title: '绑定邀请码',
            description: '输入好友的邀请码并领取奖励。',
            rewards: {
                title: '绑定成功后可获得：',
                points: '+500 积分',
                vipDays: '7 天 VIP',
            },
            tips: {
                sharedReward: '注册完成后，双方都可获得奖励。',
                singleUse: '每个账号仅可绑定一个邀请码。',
            },
            actions: {
                bindNow: '立即绑定',
                binding: '绑定中...',
                done: '完成',
            },
            success: {
                title: '邀请码已绑定',
                description: '邀请奖励已发放到你的账户。',
            },
            validation: {
                valid: '邀请码有效。',
                invalid: '邀请码无效或已过期。',
                validating: '邀请码校验中...',
                verified: '邀请码已验证',
            },
            input: {
                collapsed: '有邀请码？输入即可领取奖励',
                label: '邀请码',
                verified: '已验证',
                skip: '跳过',
                inviter: '邀请人',
                reward: '注册后奖励',
            },
            errors: {
                bindFailed: '绑定邀请码失败，请重试。',
            },
        },
    },
    copilot,
    notes: {
        ...notes,
        header: {
            title: '笔记',
            subtitle: '知识库',
        },
    },
    vip: {
        ...vip,
        page: {
            badges: {
                brand: 'Magic Studio VIP',
                popular: '热门',
            },
            title: '会员中心',
            subtitle: '提升工作区内的生成速度、额度与高级模型访问能力。',
            cycles: {
                month: '月付',
                year: '年付',
                onetime: '一次性',
            },
            tiers: {
                free: '免费版',
                basic: '基础版',
                standard: '标准版',
                premium: '高级版',
            },
            billing: {
                forever: '永久',
                years: '{count} 年',
                months: '{count} 个月',
                days: '{count} 天',
            },
            subscription: {
                title: '当前订阅',
                none: '未订阅',
                hint: '选择一个套餐以启用高级能力',
                expires: '到期 {date}',
                never: '永久',
                unknown: '未知',
                status: {
                    active: '生效中',
                    canceled: '已取消',
                    expired: '已过期',
                },
            },
            actions: {
                refreshing: '刷新中...',
                currentPlan: '当前套餐',
                subscribe: '订阅（{cycle}）',
            },
            defaults: {
                description: '优先队列、更高额度与更丰富的模型选项。',
            },
            points: '+{count} 积分',
            messages: {
                subscriptionUpdated: '订阅已更新：{plan}（{status}）',
            },
            errors: {
                loadPlans: '加载 VIP 套餐失败',
                purchaseFailed: '购买 VIP 套餐失败',
            },
        },
    },
    market: {
        ...market,
        nav: {
            ...market.nav,
            magic_cut: '魔映',
            badges: {
                ...market.nav.badges,
                hot: '热门',
                new: '新',
                beta: '测试版',
                pro: '专业版',
            },
        },
    },
    browser,
    drive: {
        ...drive,
        preview: {
            loading: '内容加载中...',
            unavailable: '当前文件类型暂不支持预览。',
            externalConversion: '预览该文档类型需要外部转换，请下载后在本地应用中查看或编辑。',
            actions: {
                download: '下载',
                downloadFile: '下载文件',
                closePreview: '关闭预览',
            },
            errors: {
                resolveUrl: '无法解析预览地址',
                loadContent: '无法加载文件内容。',
            },
        },
    },
    studio,
    portal,
    canvas: {
        ...canvas,
        export: {
            default_board_title: '未命名画布',
            actions: '操作',
            menu: '菜单',
            import_json: '导入画布（JSON）',
            exporting: '导出中...',
            to_magic_cut: '导出到魔映',
            export_json: '导出 JSON',
            reset_zoom: '重置缩放',
            confirm: '导出',
            notify: {
                import_success_title: '导入成功',
                import_success_message: '画布“{title}”已导入。',
                import_failed_title: '导入失败',
                export_failed_title: '导出失败',
                empty_canvas: '画布为空。',
                empty_canvas_hint: '画布为空，请先添加一些媒体元素。',
                export_success_title: '导出成功',
                export_success_message: '已在魔映中创建项目',
                unknown_error: '未知错误',
            },
            modal: {
                title: '导出到魔映',
                subtitle: '将画布转换为时间线',
                select_content: '选择要导出的内容：',
                options: {
                    video_only: {
                        label: '仅视频',
                        description: '仅将视频元素过滤到时间线中。',
                    },
                    mixed: {
                        label: '图片与视频',
                        description: '包含所有可视媒体元素。',
                    },
                    image_only: {
                        label: '仅图片',
                        description: '基于图片元素创建幻灯片效果。',
                    },
                },
            },
        },
    },
    magicCut: {
        ...magicCut,
        header: {
            back: {
                portal: '门户',
                canvas: '画布',
            },
            backTo: '返回{target}',
            brand: '魔映',
            beta: '测试版',
            subtitle: 'AI 原生视频编辑器',
            saved: '已保存',
            share: '分享',
            export: '导出',
            exportVideo: '导出视频',
            exportJsonProject: '导出 JSON 项目',
        },
        modal: {
            editorTitle: '魔映编辑器',
        },
        resources: {
            ...magicCut.resources,
            stickers: '贴纸',
        },
    },
    film: {
        ...film,
        sidebar: {
            production_list: '制作列表',
        },
    },
    video,
    image,
    portalVideo: {
        ...portalVideo,
        badges: {
            ...portalVideo.badges,
            beta: '测试版',
        },
        featuredBanner: {
            cards: {
                video: {
                    title: 'MAGIC STUDIO',
                    subtitle: 'AI 视频生成',
                    description: '用文本提示创作电影感视频',
                    badge: '核心',
                },
                magicCut: {
                    title: '魔映',
                    subtitle: '智能剪辑',
                    description: 'AI 原生非线性视频编辑',
                    tag: '测试版',
                },
                chat: {
                    title: 'OPEN CHAT',
                    subtitle: 'AI 智能体',
                    description: '你的开源智能伙伴',
                    badge: '全新',
                },
            },
        },
    },
    assetCenter: {
        ...assetCenter,
        domains: {
            ...assetCenter.domains,
            magiccut: '魔映',
        },
        creationInput: {
            placeholder: '描述你的想法...',
            actions: {
                attachMedia: '添加媒体',
                removeAttachment: '移除附件',
            },
            menu: {
                title: '添加内容',
                localUpload: {
                    title: '本地上传',
                    description: '从你的电脑中选择',
                },
                assetLibrary: {
                    title: '素材库',
                    description: '复用已有文件',
                },
            },
            preview: {
                empty: '暂无可预览内容',
                type: '类型：{type}',
                sizeKb: '{size} KB',
                types: {
                    image: '图片',
                    video: '视频',
                    audio: '音频',
                    script: '脚本',
                    file: '文件',
                },
            },
        },
        coverGenerator: {
            title: 'AI 封面生成器',
            poweredBy: '由 {model} 驱动',
            defaults: {
                context: '通用主题',
            },
            fallbackPrompts: {
                abstract: '现代极简抽象构图，高质量，4K',
                futuristic: '未来感数字景观，霓虹色彩，合成波风格',
                workspace: '专业整洁的科技工作空间，写实风格',
            },
            steps: {
                analyzing: {
                    title: '正在分析内容...',
                    description: '基于你的内容生成创意概念。',
                },
                selection: {
                    title: '选择一个风格概念',
                },
                generating: {
                    title: '正在构思...',
                },
            },
            actions: {
                regenerateIdeas: '重新生成灵感',
                regenerate: '重新生成',
                useCover: '使用封面',
            },
            preview: {
                imageAlt: '已生成封面',
            },
            errors: {
                analyze: '分析内容失败',
                generate: '生成图片失败',
            },
        },
    },
    vibeLayout: {
        tools: {
            canvas: '无限画布',
        },
    },
    plugins,
    skills,
};
