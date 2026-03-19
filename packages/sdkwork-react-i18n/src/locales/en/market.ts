export const market = {
    install: "Install",
    installing: "Installing...",
    installed: "Installed",
    common: {
        loading: "Loading...",
        previous: "Previous",
        next: "Next",
        cancel: "Cancel",
        close: "Close",
        confirm: "Confirm",
        details: "Details",
        search: "Search",
        filters: "Filters",
        hide: "Hide",
        show: "Show",
        browse: "Browse",
        publish: "Publish",
        recommended: "Recommended",
        requirements: "Requirements",
        points_rule: "100 points = CNY 1"
    },
    nav: {
        home: "Home",
        community: "Community",
        theater: "Theater",
        skills: "Skills",
        plugins: "Plugins",
        task_market: "Task Market",
        discover: "Discover",
        assets: "Assets",
        workspace: "Workspace",
        generators: "Generators",
        audio: "Audio",
        quick_short: "Quick Cut",
        magic_cut: "Magic Cut",
        canvas: "Canvas",
        notes: "Notes",
        video: "Video",
        image: "Image",
        character: "Character",
        music: "Music",
        speech: "Speech",
        voice: "Voice",
        my_tasks: "My Tasks",
        settings: "Settings",
        sign_out: "Sign Out",
        my_profile: "My Profile",
        billing_plans: "Billing & Plans",
        switch_workspace: "Switch Workspace",
        preferences: "Preferences",
        select_project: "Select Project",
        active_workspace: "Active Workspace",
        create_project: "Create New Project",
        project_name_prompt: "Project name",
        new_video_project: "New video project",
        credits: "{count} Credits",
        upgrade_title: "Upgrade to Pro",
        upgrade_desc: "Unlock more features and higher limits",
        upgrade_now: "Upgrade Now",
        sign_in: "Sign In",
        badges: {
            hot: "Hot",
            new: "New",
            beta: "Beta"
        }
    },
    order: {
        details: "Order Details",
        order_no: "Order No.",
        amount: "Order Amount",
        type: "Order Type",
        created_at: "Created At",
        paid_at: "Paid At",
        completed_at: "Completed At",
        expires_at: "Expires At",
        task_info: "Task Information",
        task_type: "Task Type",
        task_params: "Task Parameters",
        param_count: "{count} fields",
        remark: "Remark",
        cancel_reason: "Cancel Reason",
        failure_reason: "Failure Reason",
        payment_state: "Payment Status: {status}",
        current_state: "Current status: {status}",
        waiting_for_service: "Waiting for service completion",
        status: {
            pending_payment: "Pending Payment",
            paid: "Paid",
            in_progress: "In Progress",
            completed: "Completed",
            cancelled: "Cancelled",
            refunded: "Refunded",
            disputed: "Disputed"
        },
        type_label: {
            video_generation: "Video Generation",
            image_generation: "Image Generation",
            audio_generation: "Audio Generation",
            music_generation: "Music Generation",
            video_editing: "Video Editing",
            custom_service: "Custom Service",
            subscription: "Subscription",
            credit_topup: "Credit Top-up"
        },
        actions: {
            pay_now: "Pay Now",
            cancel_order: "Cancel Order"
        },
        filters: {
            title: "Order Filters",
            all_statuses: "All Statuses",
            all_types: "All Types"
        },
        empty: {
            title: "No orders yet",
            description: "Try adjusting filters or create a new order."
        }
    },
    payment: {
        title: "Complete Payment",
        amount: "Payment Amount",
        method: "Payment Method",
        use_balance: "Use balance",
        use_points: "Use points",
        redirecting: "Redirecting to payment provider...",
        continue_to_provider: "Continue to Payment",
        processing: "Processing...",
        confirm: "Confirm Payment {amount}",
        failed: "Payment failed",
        retry_failed: "Payment failed, please try again.",
        method_label: {
            alipay: "Alipay",
            wechat: "WeChat Pay",
            card: "Credit Card",
            balance: "Balance",
            points: "Points"
        },
        method_desc: {
            alipay: "Recommended for mainland China",
            wechat: "Fast mobile payment",
            card: "Visa / Mastercard",
            balance: "Use account balance",
            points: "100 points = CNY 1"
        },
        status: {
            pending: "Pending",
            processing: "Processing",
            success: "Success",
            failed: "Failed",
            refunded: "Refunded",
            refunding: "Refunding"
        }
    },
    task: {
        accepted: "Accepted",
        expired: "Expired",
        expiring_soon: "Ending Soon",
        requirements: "Requirements",
        estimated_duration: "{minutes} min",
        created_at: "Posted {date}",
        accept: "Accept Task",
        view_details: "View Details",
        type: {
            text_to_video: "Text to Video",
            image_to_video: "Image to Video",
            video_extend: "Video Extend",
            video_restore: "Video Restore",
            video_super_resolution: "Video Upscale",
            video_frame_interpolation: "Frame Interpolation",
            video_colorization: "Colorization",
            video_style_transfer: "Style Transfer",
            avatar_video: "Avatar Video",
            lip_sync: "Lip Sync"
        },
        difficulty: {
            easy: "Easy",
            medium: "Medium",
            hard: "Hard",
            expert: "Expert",
            all: "All Difficulty"
        },
        time_left: {
            days_hours: "{days}d {hours}h left",
            hours: "{hours}h left"
        },
        list: {
            search_placeholder: "Search tasks...",
            sort_latest: "Latest",
            sort_budget: "Highest Budget",
            sort_difficulty: "Highest Difficulty",
            all_types: "All Types",
            available: "Available Tasks",
            total_budget: "Total Budget",
            active_users: "Active Users",
            in_progress: "In Progress",
            empty_title: "No available tasks",
            empty_description: "Try again later for new opportunities."
        }
    },
    actions: {
        confirm_cancel_order: "Cancel order {orderNo}?",
        order_cancelled: "Order cancelled.",
        accept_success: "Task accepted successfully.",
        accept_failed: "Failed to accept the task. Please try again.",
        cancel_failed: "Failed to cancel the order. Please try again."
    },
    wallet: {
        title: "Wallet",
        total_balance: "Total Balance",
        available_balance: "Available Balance",
        frozen_balance: "Frozen Balance",
        points: "Points",
        redeem_points: "Redeem Points",
        earn_points: "Earn Points",
        top_up: "Top Up",
        transaction_history: "Transactions"
    },
    pages: {
        my_tasks: {
            badge: "Task Management Center",
            title: "My Tasks",
            subtitle: "Manage your jobs, orders, and earnings.",
            marketplace: "Go to Task Market",
            stats_in_progress: "In Progress",
            stats_completed: "Completed",
            stats_pending_review: "Pending Review",
            stats_income: "Total Income",
            empty_active_title: "No active tasks",
            empty_active_description: "Visit the task market to pick up your next commission.",
            browse_tasks: "Browse Tasks",
            empty_published_title: "No published tasks",
            empty_published_description: "Publish a task requirement to collaborate with creators.",
            publish_action: "Publish New Task",
            skill_title: "Level Up Your Skill Tier",
            skill_description: "Complete more tasks to unlock better levels and higher income.",
            skill_market: "View Skill Market",
            level_system: "Learn the Level System",
            tabs: {
                tasks: "My Tasks",
                orders: "My Orders",
                published: "Published",
                wallet: "Wallet"
            }
        },
        task_market: {
            badge: "AI Task Marketplace",
            title: "Task Market",
            subtitle: "Discover quality AI tasks and turn your skills into income.",
            tabs: {
                market: "Order Hall",
                orders: "My Orders",
                published: "Published",
                wallet: "Wallet"
            },
            stats_completed_today: "Completed Today",
            publish_title: "Become a Task Publisher",
            publish_description: "Post your AI production needs and match with the right creator.",
            publish_action: "Publish Task",
            learn_more: "Learn More",
            order_title: "Order Center",
            order_description: "Review and manage your related orders."
        },
        trade_center: {
            market_title: "Task Market",
            market_subtitle: "Discover tasks and earn commissions.",
            my_title: "My Tasks",
            my_subtitle: "Manage your tasks and orders.",
            tabs: {
                market: "Order Hall",
                tasks: "My Tasks",
                orders: "My Orders",
                published: "Published",
                wallet: "Wallet"
            },
            published_title: "No Published Tasks",
            published_description: "Publish task requirements and collaborate with creators.",
            wallet_title: "Wallet Center",
            wallet_description: "Manage your balance and points."
        }
    }
};
