export const market = {
    install: "安装",
    installing: "安装中...",
    installed: "已安装",
    common: {
        loading: "加载中...",
        previous: "上一页",
        next: "下一页",
        cancel: "取消",
        close: "关闭",
        confirm: "确认",
        details: "详情",
        search: "搜索",
        filters: "筛选",
        hide: "收起",
        show: "展开",
        browse: "浏览",
        publish: "发布",
        recommended: "推荐",
        requirements: "要求",
        points_rule: "100 积分 = ¥1"
    },
    nav: {
        home: "首页",
        community: "社区",
        theater: "剧场",
        skills: "技能",
        plugins: "插件",
        task_market: "任务市场",
        discover: "发现",
        assets: "资产",
        workspace: "工作室",
        generators: "生成器",
        audio: "音频",
        quick_short: "快剪",
        magic_cut: "智能剪辑",
        canvas: "画布",
        notes: "笔记",
        video: "视频",
        image: "图片",
        character: "角色",
        music: "音乐",
        speech: "语音",
        voice: "配音",
        my_tasks: "我的任务",
        settings: "设置",
        sign_out: "退出登录",
        my_profile: "我的资料",
        billing_plans: "账单与套餐",
        switch_workspace: "切换工作区",
        preferences: "偏好设置",
        select_project: "选择项目",
        active_workspace: "当前工作区",
        create_project: "新建项目",
        project_name_prompt: "项目名称",
        new_video_project: "新视频项目",
        credits: "{count} 积分",
        upgrade_title: "升级到专业版",
        upgrade_desc: "解锁更多功能和更高额度",
        upgrade_now: "立即升级",
        sign_in: "登录",
        badges: {
            hot: "热门",
            new: "最新",
            beta: "测试版"
        }
    },
    order: {
        details: "订单详情",
        order_no: "订单号",
        amount: "订单金额",
        type: "订单类型",
        created_at: "创建时间",
        paid_at: "支付时间",
        completed_at: "完成时间",
        expires_at: "到期时间",
        task_info: "任务信息",
        task_type: "任务类型",
        task_params: "任务参数",
        param_count: "{count} 个字段",
        remark: "备注",
        cancel_reason: "取消原因",
        failure_reason: "失败原因",
        payment_state: "支付状态：{status}",
        current_state: "当前状态：{status}",
        waiting_for_service: "等待服务完成",
        status: {
            pending_payment: "待支付",
            paid: "已支付",
            in_progress: "进行中",
            completed: "已完成",
            cancelled: "已取消",
            refunded: "已退款",
            disputed: "争议中"
        },
        type_label: {
            video_generation: "视频生成",
            image_generation: "图片生成",
            audio_generation: "音频生成",
            music_generation: "音乐生成",
            video_editing: "视频编辑",
            custom_service: "定制服务",
            subscription: "订阅",
            credit_topup: "充值"
        },
        actions: {
            pay_now: "立即支付",
            cancel_order: "取消订单"
        },
        filters: {
            title: "订单筛选",
            all_statuses: "全部状态",
            all_types: "全部类型"
        },
        empty: {
            title: "暂无订单",
            description: "试试调整筛选条件，或创建新的订单。"
        }
    },
    payment: {
        title: "完成支付",
        amount: "支付金额",
        method: "支付方式",
        use_balance: "使用余额",
        use_points: "使用积分",
        redirecting: "正在跳转支付平台...",
        continue_to_provider: "前往支付",
        processing: "处理中...",
        confirm: "确认支付 {amount}",
        failed: "支付失败",
        retry_failed: "支付失败，请重试。",
        method_label: {
            alipay: "支付宝",
            wechat: "微信支付",
            card: "信用卡",
            balance: "余额",
            points: "积分"
        },
        method_desc: {
            alipay: "推荐在中国大陆使用",
            wechat: "快捷移动支付",
            card: "Visa / Mastercard",
            balance: "使用账户余额",
            points: "100 积分 = ¥1"
        },
        status: {
            pending: "待支付",
            processing: "支付中",
            success: "支付成功",
            failed: "支付失败",
            refunded: "已退款",
            refunding: "退款中"
        }
    },
    task: {
        accepted: "已接单",
        expired: "已截止",
        expiring_soon: "即将截止",
        requirements: "要求",
        estimated_duration: "{minutes} 分钟",
        created_at: "发布于 {date}",
        accept: "接单",
        view_details: "查看详情",
        type: {
            text_to_video: "文生视频",
            image_to_video: "图生视频",
            video_extend: "视频扩展",
            video_restore: "视频修复",
            video_super_resolution: "视频超分",
            video_frame_interpolation: "视频补帧",
            video_colorization: "视频着色",
            video_style_transfer: "风格迁移",
            avatar_video: "角色视频",
            lip_sync: "对口型"
        },
        difficulty: {
            easy: "简单",
            medium: "中等",
            hard: "困难",
            expert: "专家",
            all: "全部难度"
        },
        time_left: {
            days_hours: "剩余 {days} 天 {hours} 小时",
            hours: "剩余 {hours} 小时"
        },
        list: {
            search_placeholder: "搜索任务...",
            sort_latest: "最新发布",
            sort_budget: "最高预算",
            sort_difficulty: "最高难度",
            all_types: "全部类型",
            available: "可接任务",
            total_budget: "总预算",
            active_users: "活跃用户",
            in_progress: "进行中",
            empty_title: "暂无可接任务",
            empty_description: "请稍后再来看看新的机会。"
        }
    },
    actions: {
        confirm_cancel_order: "确定取消订单 {orderNo} 吗？",
        order_cancelled: "订单已取消。",
        accept_success: "接单成功。",
        accept_failed: "接单失败，请重试。",
        cancel_failed: "取消订单失败，请重试。"
    },
    wallet: {
        title: "钱包",
        total_balance: "总余额",
        available_balance: "可用余额",
        frozen_balance: "冻结金额",
        points: "积分",
        redeem_points: "积分兑换",
        earn_points: "获取积分",
        top_up: "充值",
        transaction_history: "交易记录"
    },
    pages: {
        my_tasks: {
            badge: "任务管理中心",
            title: "我的任务",
            subtitle: "管理你的任务、订单和收入。",
            marketplace: "前往任务市场",
            stats_in_progress: "进行中",
            stats_completed: "已完成",
            stats_pending_review: "待审核",
            stats_income: "累计收入",
            empty_active_title: "暂无进行中的任务",
            empty_active_description: "去任务市场接单，开启下一份佣金吧。",
            browse_tasks: "浏览任务",
            empty_published_title: "暂无发布的任务",
            empty_published_description: "发布你的任务需求，与创作者协作。",
            publish_action: "发布新任务",
            skill_title: "提升你的技能等级",
            skill_description: "完成更多任务，解锁更高等级和更多收入。",
            skill_market: "查看技能市场",
            level_system: "了解等级体系",
            tabs: {
                tasks: "我的任务",
                orders: "我的订单",
                published: "我发布的",
                wallet: "钱包"
            }
        },
        task_market: {
            badge: "AI 任务市场",
            title: "任务市场",
            subtitle: "发现优质 AI 任务，用你的技能赚取收入。",
            tabs: {
                market: "订单大厅",
                orders: "我的订单",
                published: "我发布的",
                wallet: "钱包"
            },
            stats_completed_today: "今日完成",
            publish_title: "成为任务发布者",
            publish_description: "发布 AI 创作需求，找到合适的创作者完成项目。",
            publish_action: "发布任务",
            learn_more: "了解更多",
            order_title: "订单中心",
            order_description: "查看并管理相关订单。"
        },
        trade_center: {
            market_title: "任务市场",
            market_subtitle: "发现任务并赚取佣金。",
            my_title: "我的任务",
            my_subtitle: "管理你的任务和订单。",
            tabs: {
                market: "订单大厅",
                tasks: "我的任务",
                orders: "我的订单",
                published: "我发布的",
                wallet: "钱包"
            },
            published_title: "暂无发布的任务",
            published_description: "发布任务需求，与创作者协作。",
            wallet_title: "钱包中心",
            wallet_description: "管理你的余额和积分。"
        }
    }
};
