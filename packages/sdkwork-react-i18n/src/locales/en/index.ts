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

export const en = {
    common: {
        ...common,
        actions: {
            ...common.actions,
            back_home: 'Back to Home',
        },
    },
    sidebar: {
        ...sidebar,
        terminal: 'Terminal',
        magic_cut: 'Magic Cut',
    },
    header: {
        ...header,
        developer_tools: 'Developer Tools',
        developer_menu: 'Developer',
        reload_app: 'Reload App',
        toggle_devtools: 'Toggle DevTools',
    },
    download,
    appShell: {
        brand: 'Magic Studio',
        tagline: 'Creative',
        loading: 'Loading...',
        loading_module: 'Loading Module...',
        loading_route: 'Loading Route...',
    },
    workspaceDialogs: {
        createWorkspace: {
            title: 'New Workspace',
            subtitle: 'Organize your projects and assets',
            nameLabel: 'Workspace Name',
            namePlaceholder: 'e.g. My Creative Studio',
            descriptionLabel: 'Description (Optional)',
            descriptionPlaceholder: 'What is this workspace for?',
            creating: 'Creating...',
            confirm: 'Create Workspace',
        },
        createProject: {
            title: 'New Project',
            subtitle: 'In {workspace}',
            workspaceFallback: 'Workspace',
            typeLabel: 'Project Type',
            nameLabel: 'Project Name',
            namePlaceholder: 'e.g. NextGen Dashboard',
            descriptionLabel: 'Description (Optional)',
            descriptionPlaceholder: 'Briefly describe your project...',
            coverLabel: 'Cover Image',
            uploadCover: 'Upload Cover',
            creating: 'Creating...',
            confirm: 'Create Project',
            createFailed: 'Failed to create project',
            types: {
                application: {
                    label: 'Application',
                    description: 'Full-stack web or desktop app',
                },
                video: {
                    label: 'Video Project',
                    description: 'AI video generation & editing',
                },
                audio: {
                    label: 'Audio Project',
                    description: 'Music & speech generation',
                },
            },
        },
    },
    generationHistory: {
        emptyTitle: 'No History Yet',
        emptyDescription: 'Start generating to see your creation timeline here.',
        emptyFiltered: 'No items found for this filter.',
        preview: {
            history: 'History',
            moreFromGallery: 'More from Gallery',
            like: 'Like',
            download: 'Download',
            share: 'Share',
            loadingPreview: 'Loading preview...',
            info: 'Info',
            creator: 'Creator',
            follow: 'Follow',
            views: 'Views',
            likes: 'Likes',
            comments: 'Comments',
            prompt: 'Prompt',
            copy: 'Copy',
            details: 'Generation Details',
            model: 'Model',
            aspectRatio: 'Aspect Ratio',
            created: 'Created',
            unknown: 'Unknown',
            remixVideo: 'Remix this Video',
            remixImage: 'Remix this Image',
            editDetails: 'Edit Details',
            delete: 'Delete',
        },
        item: {
            notifySavedTitle: 'Saved',
            notifySavedBody: '{count} assets saved to library.',
            notifyErrorTitle: 'Error',
            notifyErrorBody: 'Failed to save to assets.',
            generating: 'Generating...',
            generationFailed: 'Generation failed',
            regenerate: 'Regenerate',
            saveToAssets: 'Save to Assets',
            saved: 'Saved',
            copyPrompt: 'Copy Prompt',
            delete: 'Delete',
            preview: 'Preview',
            video: 'Video',
        },
        mediaTypes: {
            image: 'Image',
            video: 'Video',
            audio: 'Audio',
            voice: 'Voice',
            music: 'Music',
            speech: 'Speech',
            media: 'Media',
        },
    },
    profilePage: {
        navigation: {
            title: 'Account Navigation',
            progress: 'Profile progress',
        },
        common: {
            save: 'Save',
            discardChanges: 'Discard Changes',
            refreshing: 'Refreshing...',
            refreshData: 'Refresh Data',
            records: 'records',
        },
        sections: {
            overview: { title: 'Profile', description: 'Basic identity information' },
            security: { title: 'Security', description: 'Password and login records' },
            addresses: { title: 'Address Book', description: 'Shipping and contact addresses' },
            contacts: { title: 'Contacts', description: 'Friends and contact requests' },
            preferences: { title: 'Preferences', description: 'Personalized experience settings' },
            activity: { title: 'Activity', description: 'Recent operation timeline' },
        },
        passwordStrength: {
            notSet: { label: 'Not set', hint: 'Use 8+ chars with mixed character types.' },
            weak: { label: 'Weak', hint: 'Add uppercase, numbers, and symbols.' },
            fair: { label: 'Fair', hint: 'Add one more character type for better security.' },
            strong: { label: 'Strong', hint: 'Good. Consider using 12+ characters.' },
            veryStrong: { label: 'Very strong', hint: 'Excellent password strength.' },
        },
        dialogs: {
            unsavedSection: 'Current section has unsaved changes. Leave this section anyway?',
            deleteAddress: 'Delete this address?',
            deleteContact: 'Delete this contact?',
        },
        actions: {
            saveProfile: 'Save Profile',
            savePreferences: 'Save Preferences',
            back: 'Back',
            replaceAvatar: 'Replace Avatar',
            changeAvatar: 'Change Avatar',
            uploadAvatar: 'Upload Avatar',
            refreshActivity: 'Refresh Activity',
        },
        avatar: {
            pendingUpload: 'A new avatar is ready. Save Profile to upload it.',
            keepCurrent: 'Current avatar is synchronized.',
            empty: 'No avatar uploaded yet.',
        },
        overview: {
            title: 'Profile Overview',
            unsaved: 'Unsaved profile changes',
            saved: 'All profile changes saved',
            avatarTitle: 'Avatar',
            avatarSupport: 'Supports image files up to 5 MB.',
            clearAvatarDraft: 'Clear Avatar Draft',
            email: 'Email',
            phone: 'Phone',
            region: 'Region',
            notBound: 'Not bound',
            notSet: 'Not set',
            noEmailBound: 'No email bound',
            noPhoneBound: 'No phone bound',
            editBasicInformation: 'Edit Basic Information',
            nickname: 'Nickname',
            nicknamePlaceholder: 'Your nickname',
            nicknameHint: 'Use at least 2 characters.',
            regionPlaceholder: 'Your region',
            bio: 'Bio',
            bioPlaceholder: 'Write a short self-introduction',
        },
        addresses: {
            savedTitle: 'Saved Addresses',
            defaultHint: 'Default: {name}',
            defaultFallback: 'Set',
            noDefault: 'No default address yet.',
            actions: {
                add: 'Add Address',
                update: 'Update Address',
                save: 'Save Address',
            },
        },
        security: {
            title: 'Security Center',
            scoreSuffix: 'security score',
            changePassword: 'Change Password',
            currentPassword: 'Current password',
            newPassword: 'New password (8+ chars)',
            passwordStrength: 'Password Strength',
            emailPlaceholder: 'Email address',
            phonePlaceholder: 'Phone number',
            actions: {
                updatePassword: 'Update Password',
            },
        },
        contacts: {
            searchTitle: 'Search Contacts',
            searchHint: 'Filter by nickname, username or region.',
            friendRequestsTitle: 'Friend Requests',
            noFriendRequests: 'No friend requests.',
            actions: {
                refresh: 'Refresh Contacts',
                refreshing: 'Refreshing...',
            },
        },
        preferences: {
            theme: 'Theme',
            language: 'Language',
            themeOptions: {
                system: 'System',
                light: 'Light',
                dark: 'Dark',
            },
            notificationsTitle: 'Notifications',
            notificationLabels: {
                system: 'System Notifications',
                message: 'Message Notifications',
                activity: 'Activity Notifications',
                promotion: 'Promotion Notifications',
                sound: 'Sound Alerts',
                vibration: 'Vibration Alerts',
            },
            notificationDescriptions: {
                system: 'Receive important system updates.',
                message: 'Show notifications for direct messages.',
                activity: 'Keep track of account activity.',
                promotion: 'Receive offers and campaign updates.',
                sound: 'Play sound for incoming notifications.',
                vibration: 'Use vibration for key alerts.',
            },
            privacyTitle: 'Privacy',
            privacyLabels: {
                publicProfile: 'Public Profile',
                allowSearch: 'Allow Search',
                allowFriendRequest: 'Allow Friend Request',
            },
            privacyDescriptions: {
                publicProfile: 'Allow others to view your profile.',
                allowSearch: 'Enable profile discovery in search results.',
                allowFriendRequest: 'Permit new friend requests.',
            },
            playbackTitle: 'Playback & Data',
            playbackLabels: {
                autoPlay: 'Auto Play',
                highQuality: 'High Quality',
                dataSaver: 'Data Saver',
            },
            playbackDescriptions: {
                autoPlay: 'Auto-play generated previews.',
                highQuality: 'Prefer high quality output.',
                dataSaver: 'Reduce network consumption when possible.',
            },
            states: {
                unsaved: 'Unsaved preference changes',
                synced: 'Preferences are synchronized',
            },
        },
        states: {
            loadingProfile: 'Loading profile...',
            loadingHistory: 'Loading history...',
            saving: 'Saving...',
        },
        fields: {
            confirmNewPassword: 'Confirm new password',
        },
        history: {
            loginTitle: 'Login History',
            generationTitle: 'Generation History',
            noLoginRecords: 'No login records.',
            noGenerationRecords: 'No generation records.',
        },
        headings: {
            userPreferences: 'User Preferences',
            recentActivity: 'Recent Activity',
        },
        stats: {
            profileCompletion: { title: 'Profile Completion', hint: 'Complete key fields to improve recommendations.' },
            recentActivity: { title: 'Recent Activity', hint: 'Combined login and generation records.' },
            totalContacts: { title: 'Total Contacts', hint: 'Total friend contacts in your account.' },
            onlineNow: { title: 'Online Now', hint: 'Contacts currently online.' },
            newRequests: { title: 'New Requests', hint: 'Pending requests for your review.' },
        },
    },
    settings: {
        ...settings,
        page: {
            comingSoon: {
                lsp: 'LSP Settings (Coming Soon)',
                llm: 'LLM Settings (Coming Soon)',
            },
            about: {
                version: 'Version {version} ({channel})',
                channel: {
                    beta: 'Beta',
                },
                runtime: {
                    electron: 'Electron',
                    chromium: 'Chromium',
                    node: 'Node',
                },
            },
            search: {
                clear: 'Clear search',
            },
            aria: {
                tabs: 'Settings Categories',
            },
        },
        storage: {
            ...settings.storage,
            material: {
                ...settings.storage.material,
                mode: {
                    ...settings.storage.material.mode,
                    desc: 'Choose whether Magic Cut writes media to the local filesystem first or forces server-only uploads.',
                },
            },
        },
    },
    editor,
    auth: {
        ...auth,
        bindInvite: {
            title: 'Bind invite code',
            description: "Enter your friend's invite code and claim rewards.",
            rewards: {
                title: 'Rewards after successful bind:',
                points: '+500 points',
                vipDays: '7-day VIP',
            },
            tips: {
                sharedReward: 'Both users get rewards after registration.',
                singleUse: 'Each account can bind one invite code only.',
            },
            actions: {
                bindNow: 'Bind now',
                binding: 'Binding...',
                done: 'Done',
            },
            success: {
                title: 'Invite code bound',
                description: 'The invite reward has been sent to your account.',
            },
            validation: {
                valid: 'Invite code is valid.',
                invalid: 'Invite code is invalid or expired.',
                validating: 'Validating invite code...',
                verified: 'Invite code verified',
            },
            input: {
                collapsed: 'Have an invite code? Enter to claim rewards',
                label: 'Invite code',
                verified: 'Verified',
                skip: 'Skip',
                inviter: 'Inviter',
                reward: 'Reward after sign-up',
            },
            errors: {
                bindFailed: 'Bind invite code failed, please retry.',
            },
        },
    },
    copilot,
    notes: {
        ...notes,
        header: {
            title: 'Notes',
            subtitle: 'Knowledge Base',
        },
    },
    vip: {
        ...vip,
        page: {
            badges: {
                brand: 'Magic Studio VIP',
                popular: 'Popular',
            },
            title: 'Membership Center',
            subtitle: 'Upgrade generation speed, quota, and advanced model access across your workspace.',
            cycles: {
                month: 'Monthly',
                year: 'Yearly',
                onetime: 'One-time',
            },
            tiers: {
                free: 'Free',
                basic: 'Basic',
                standard: 'Standard',
                premium: 'Premium',
            },
            billing: {
                forever: 'Forever',
                years: '{count} year(s)',
                months: '{count} month(s)',
                days: '{count} day(s)',
            },
            subscription: {
                title: 'Current Subscription',
                none: 'Not Subscribed',
                hint: 'Choose a plan to activate premium features',
                expires: 'Expire {date}',
                never: 'Never',
                unknown: 'Unknown',
                status: {
                    active: 'Active',
                    canceled: 'Canceled',
                    expired: 'Expired',
                },
            },
            actions: {
                refreshing: 'Refreshing...',
                currentPlan: 'Current Plan',
                subscribe: 'Subscribe ({cycle})',
            },
            defaults: {
                description: 'Priority queues, higher quota, and richer model options.',
            },
            points: '+{count} points',
            messages: {
                subscriptionUpdated: 'Subscription updated: {plan} ({status})',
            },
            errors: {
                loadPlans: 'Failed to load VIP plans',
                purchaseFailed: 'Failed to purchase VIP plan',
            },
        },
    },
    market: {
        ...market,
        nav: {
            ...market.nav,
            magic_cut: 'Magic Cut',
            badges: {
                ...market.nav.badges,
                hot: 'Hot',
                new: 'New',
                beta: 'Beta',
                pro: 'Pro',
            },
        },
    },
    browser,
    drive: {
        ...drive,
        preview: {
            loading: 'Loading content...',
            unavailable: 'No preview available for this file type.',
            externalConversion:
                'Previewing this document type requires external conversion. Please download it to view or edit in your native application.',
            actions: {
                download: 'Download',
                downloadFile: 'Download File',
                closePreview: 'Close Preview',
            },
            errors: {
                resolveUrl: 'Could not resolve preview URL',
                loadContent: 'Unable to load file content.',
            },
        },
    },
    studio,
    portal,
    canvas: {
        ...canvas,
        export: {
            default_board_title: 'Untitled Canvas',
            actions: 'Actions',
            menu: 'Menu',
            import_json: 'Import Board (JSON)',
            exporting: 'Exporting...',
            to_magic_cut: 'Export to Magic Cut',
            export_json: 'Export JSON',
            reset_zoom: 'Reset Zoom',
            confirm: 'Export',
            notify: {
                import_success_title: 'Import Successful',
                import_success_message: 'Board "{title}" imported.',
                import_failed_title: 'Import Failed',
                export_failed_title: 'Export Failed',
                empty_canvas: 'Canvas is empty.',
                empty_canvas_hint: 'Canvas is empty. Add some media elements first.',
                export_success_title: 'Export Successful',
                export_success_message: 'Project created in Magic Cut',
                unknown_error: 'Unknown error',
            },
            modal: {
                title: 'Export to Magic Cut',
                subtitle: 'Convert canvas to timeline',
                select_content: 'Select content to export:',
                options: {
                    video_only: {
                        label: 'Video Only',
                        description: 'Filter only video elements for the timeline.',
                    },
                    mixed: {
                        label: 'Images & Videos',
                        description: 'Include all visual media elements.',
                    },
                    image_only: {
                        label: 'Images Only',
                        description: 'Create a slideshow from image elements.',
                    },
                },
            },
        },
    },
    magicCut: {
        ...magicCut,
        header: {
            back: {
                portal: 'Portal',
                canvas: 'Canvas',
            },
            backTo: 'Return to {target}',
            brand: 'Magic Cut',
            beta: 'Beta',
            subtitle: 'AI-Native Video Editor',
            saved: 'Saved',
            share: 'Share',
            export: 'Export',
            exportVideo: 'Export Video',
            exportJsonProject: 'Export JSON Project',
        },
        modal: {
            editorTitle: 'Magic Cut Editor',
        },
        resources: {
            ...magicCut.resources,
            stickers: 'Stickers',
        },
    },
    film: {
        ...film,
        sidebar: {
            production_list: 'Production List',
        },
    },
    video,
    image,
    portalVideo: {
        ...portalVideo,
        badges: {
            ...portalVideo.badges,
            beta: 'Beta',
        },
        featuredBanner: {
            cards: {
                video: {
                    title: 'MAGIC STUDIO',
                    subtitle: 'AI Video Gen',
                    description: 'Create cinematic videos with text prompts',
                    badge: 'CORE',
                },
                magicCut: {
                    title: 'MAGIC CUT',
                    subtitle: 'Smart Editor',
                    description: 'AI-native non-linear video editing',
                    tag: 'Beta',
                },
                chat: {
                    title: 'OPEN CHAT',
                    subtitle: 'AI Agent',
                    description: 'Your open source intelligent companion',
                    badge: 'NEW',
                },
            },
        },
    },
    assetCenter: {
        ...assetCenter,
        domains: {
            ...assetCenter.domains,
            magiccut: 'Magic Cut',
        },
        creationInput: {
            placeholder: 'Describe your idea...',
            actions: {
                attachMedia: 'Attach media',
                removeAttachment: 'Remove attachment',
            },
            menu: {
                title: 'Add Content',
                localUpload: {
                    title: 'Local Upload',
                    description: 'From your computer',
                },
                assetLibrary: {
                    title: 'Asset Library',
                    description: 'Reuse existing files',
                },
            },
            preview: {
                empty: 'No preview available',
                type: 'Type: {type}',
                sizeKb: '{size} KB',
                types: {
                    image: 'Image',
                    video: 'Video',
                    audio: 'Audio',
                    script: 'Script',
                    file: 'File',
                },
            },
        },
        coverGenerator: {
            title: 'AI Cover Generator',
            poweredBy: 'Powered by {model}',
            defaults: {
                context: 'General topic',
            },
            fallbackPrompts: {
                abstract: 'A modern minimalist abstract composition, high quality, 4k',
                futuristic: 'A futuristic digital landscape, neon colors, synthwave style',
                workspace: 'A professional clean workspace with technology elements, photorealistic',
            },
            steps: {
                analyzing: {
                    title: 'Analyzing Context...',
                    description: 'Generating creative concepts based on your content.',
                },
                selection: {
                    title: 'Select a Style Concept',
                },
                generating: {
                    title: 'Dreaming...',
                },
            },
            actions: {
                regenerateIdeas: 'Regenerate Ideas',
                regenerate: 'Regenerate',
                useCover: 'Use Cover',
            },
            preview: {
                imageAlt: 'Generated Cover',
            },
            errors: {
                analyze: 'Failed to analyze content',
                generate: 'Failed to generate image',
            },
        },
    },
    vibeLayout: {
        tools: {
            canvas: 'Infinite Canvas',
        },
    },
    plugins,
    skills,
};
