export const magicCut = {
    common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        copy: "Copy",
        paste: "Paste",
        undo: "Undo",
        redo: "Redo",
        selectAll: "Select All",
        deselectAll: "Deselect All",
        close: "Close",
        confirm: "Confirm",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Info",
        searchPlaceholder: "Search...",
        ready: "Ready",
        processing: "Processing...",
        enabled: "Enabled",
        disabled: "Disabled",
        resetDefault: "Reset to default",
        dragToAdjust: "Drag to adjust"
    },
    player: {
        play: "Play",
        pause: "Pause",
        stop: "Stop",
        forward: "Forward",
        backward: "Backward",
        mute: "Mute",
        unmute: "Unmute",
        fullscreen: "Fullscreen",
        exitFullscreen: "Exit Fullscreen",
        currentTime: "Current Time",
        totalDuration: "Total Duration",
        frameRate: "Frame Rate",
        playbackSpeed: "Playback Speed",
        previewLabel: "Preview: {name}",
        emptySequence: "Empty Sequence",
        controls: {
            jumpToInPoint: "Jump to In Point",
            jumpToOutPoint: "Jump to Out Point",
            stepBackFrame: "Step Back One Frame",
            stepForwardFrame: "Step Forward One Frame",
            toggleLoopPlayback: "Toggle Loop Playback",
            setInPoint: "Set In Point (I)",
            setOutPoint: "Set Out Point (O)",
            clearInOutPoints: "Clear In/Out Points",
            settings: "Settings",
            fit: "FIT",
            fullscreen: "Fullscreen",
            jumpToStart: "Jump to Start",
            jumpToEnd: "Jump to End"
        }
    },
    timeline: {
        title: "Timeline",
        tracksHeader: "Tracks",
        addTrack: "Add Track",
        track: "Track",
        mainTrack: "Main",
        sequenceDefault: "Sequence {index}",
        newSequence: "New Sequence",
        durationSeconds: "Duration: {duration}s",
        videoTrack: "Video Track",
        audioTrack: "Audio Track",
        textTrack: "Text Track",
        subtitleTrack: "Subtitle Track",
        effectTrack: "Effect Track",
        aiTrack: "AI Track",
        deleteTrack: "Delete Track",
        lockTrack: "Lock Track",
        unlockTrack: "Unlock Track",
        muteTrack: "Mute Track",
        unmuteTrack: "Unmute Track",
        hideTrack: "Hide Track",
        showTrack: "Show Track",
        zoomIn: "Zoom In",
        zoomOut: "Zoom Out",
        fitToView: "Fit to View",
        splitClip: "Split Clip",
        trimStartToPlayhead: "Trim Start to Playhead",
        trimEndToPlayhead: "Trim End to Playhead",
        deleteClip: "Delete Clip",
        duplicateClip: "Duplicate Clip",
        nudgeLeft: "Nudge Left",
        nudgeRight: "Nudge Right",
        addMarker: "Add Marker",
        snap: "Snap",
        snapping: "Snapping",
        skimming: "Skimming",
        linkedSelection: "Linked Selection",
        zoomTimelineHelp: "Zoom Timeline (Drag to zoom, Shift+Drag for precision, double-click to reset)"
    },
    resources: {
        title: "Resources",
        videos: "Videos",
        images: "Images",
        audio: "Audio",
        music: "Music",
        voice: "Voice",
        text: "Text",
        effects: "Effects",
        transitions: "Transitions",
        sfx: "SFX",
        templates: "Templates",
        upload: "Upload",
        import: "Import",
        search: "Search resources...",
        noResults: "No resources found",
        duration: "Duration",
        resolution: "Resolution",
        size: "Size",
        favorite: "Favorite",
        unfavorite: "Unfavorite",
        categoryLabels: {
            video: "Video",
            image: "Image",
            audio: "Audio",
            music: "Music",
            voice: "Voice",
            text: "Text",
            effects: "Effects",
            transitions: "Transitions",
            sfx: "SFX",
            templates: "Templates"
        },
        placeholders: {
            searchTemplates: "Search templates...",
            searchAssets: "Search assets..."
        },
        viewModes: {
            grid: "Grid view",
            list: "List view"
        },
        actions: {
            saveAsTemplate: "Save as template",
            importFiles: "Import Files",
            loadMore: "Load More",
            addNew: "Add new",
            saveCurrentProjectAsTemplate: "Save current project as template",
            addToFavorites: "Add to favorites",
            removeFromFavorites: "Remove from favorites"
        },
        filters: {
            all: "All",
            uploads: "Uploads",
            ai: "AI",
            favorites: "Favorites"
        },
        emptyStates: {
            noTemplates: "No templates found",
            noFavorites: "No favorites yet",
            noAssets: "No assets found"
        },
        notifications: {
            favoriteUpdateFailedTitle: "Favorite update failed",
            favoriteUpdateFailedDescription: "Magic Studio could not save this favorite to the local asset catalog.",
            deleteUnavailableTitle: "Delete unavailable",
            systemAssetReadOnly: "System assets are read-only and cannot be deleted.",
            stockAssetReadOnly: "Stock assets are read-only and cannot be deleted.",
            assetInUseTitle: "Asset in use",
            assetInUseDescription: "This media is currently used on the timeline. Remove the related clips before deleting the source asset.",
            deleteConfirmTitle: "Delete Asset",
            deleteConfirmMessage: "Delete \"{name}\"?",
            deleteFailedTitle: "Delete failed",
            deleteFailedDescription: "Magic Studio could not remove this asset from local storage."
        },
        defaults: {
            effectCategory: "Filter"
        }
    },
    properties: {
        title: "Properties",
        transform: "Transform",
        position: "Position",
        rotation: "Rotation",
        scale: "Scale",
        opacity: "Opacity",
        volume: "Volume",
        speed: "Speed",
        effects: "Effects",
        filters: "Filters",
        animation: "Animation",
        keyframes: "Keyframes",
        addKeyframe: "Add Keyframe",
        removeKeyframe: "Remove Keyframe"
    },
    export: {
        title: "Export",
        fileName: "File Name",
        format: "Format",
        resolution: "Resolution",
        frameRate: "Frame Rate",
        quality: "Quality",
        bitrate: "Bitrate",
        audio: "Audio",
        video: "Video",
        exportVideo: "Export Video",
        exportAudio: "Export Audio",
        estimatedSize: "Estimated Size",
        duration: "Duration",
        exporting: "Exporting...",
        cancel: "Cancel Export",
        complete: "Export Complete",
        failed: "Export Failed",
        qualityOptions: {
            lower: "Low (Smaller File)",
            recommended: "Recommended",
            higher: "High (Better Quality)"
        },
        modal: {
            title: "Export Project",
            subtitle: "Configure output settings based on the current runtime.",
            preview: "Preview",
            previewAlt: "Export preview",
            noCoverFrame: "No Cover Frame",
            coverFrame: "Cover Frame",
            inOutRange: "In/Out Range",
            audioMixdown: "Audio mixdown",
            exportPreview: "Export preview",
            fileSettings: "File Settings",
            exportLocation: "Export Location",
            videoSettings: "Video Settings",
            audioSettings: "Audio Settings",
            audioRenderingDisabled: "Video rendering is disabled. The export switches to a standalone WAV audio mixdown with the current In/Out range.",
            quality: "Quality",
            range: "Range",
            rangeValue: "In {start}s -> Out {end}s",
            fullTimeline: "Full timeline",
            smartHdr: "Smart HDR",
            checkingHdr: "Checking HDR export support...",
            audioOnlyHdr: "Audio-only WAV mixdown does not include HDR metadata.",
            audioMode: "Audio Mode",
            audioStatusMaster: "Master",
            audioStatusIncluded: "Included",
            audioStatusMuted: "Muted",
            standaloneMixdown: "Standalone Mixdown",
            embeddedAudio: "Embedded Audio",
            standaloneAudioDescription: "Exports a standalone uncompressed WAV master using the current timeline mix, clip effects, fades, and In/Out range.",
            embeddedAudioDescription: "Audio is embedded into the selected video container. Disable video to switch into standalone WAV export.",
            mutedAudioDescription: "The current export will mute timeline audio. Enable audio to embed it in video or export a standalone WAV mixdown."
        },
        previewCard: {
            audioMixdown: "Audio mixdown",
            standaloneAudio: "Standalone WAV audio",
            canvas: "{aspectRatio} canvas",
            pcm48Khz: "48 kHz PCM",
            stereo48Khz: "48 kHz / Stereo",
            timelineDuration: "{duration}s timeline"
        },
        footer: {
            renderingAudio: "Rendering and encoding the final audio mixdown...",
            renderingVideo: "Rendering and muxing the final timeline...",
            readyStandalone: "Ready to export a standalone WAV mixdown.",
            readyRuntime: "Ready to export with the selected runtime path."
        },
        validation: {
            enableVideoOrAudio: "Enable video or audio before exporting.",
            audioOnlyWav: "Audio-only export currently supports WAV only.",
            wavAudioOnly: "WAV export is only available for audio-only mixdowns.",
            movUnavailable: "MOV export is not available in the current renderer.",
            missingFileName: "Please enter a file name.",
            invalidRange: "Out point must be greater than In point.",
            unknownError: "Unknown error"
        },
        runtime: {
            inspectFailed: "Failed to inspect export runtime.",
            inspecting: "Checking export runtime capabilities...",
            inspectionFailedTitle: "Runtime inspection failed",
            unavailable: "Runtime export unavailable",
            verified: "Runtime export verified",
            noContainer: "No real video container is available in the current runtime.",
            mp4WebCodecsAndWebmMediaRecorder: "MP4 is available through WebCodecs, and WebM is available through MediaRecorder.",
            mp4WebCodecsOnly: "MP4 is available through the high-quality WebCodecs export path.",
            mp4AndWebmMediaRecorder: "This runtime can export MP4 and WebM through MediaRecorder compatibility paths.",
            mp4MediaRecorderOnly: "This runtime can export MP4 through MediaRecorder compatibility mode.",
            webmMediaRecorderOnly: "This runtime can export WebM through MediaRecorder.",
            noSupportedFormat: "No supported export format is currently available. Change runtime or install the missing encoder path.",
            smartHdrUnsupported: "Smart HDR metadata pass-through is not implemented in the current renderer."
        },
        formatBadges: {
            master: "Master",
            bestQuality: "Best quality",
            compatibility: "Compatibility",
            unavailable: "Unavailable",
            recommendedHere: "Recommended here"
        },
        formatDescriptions: {
            audioOnly: "Uncompressed PCM WAV audio mixdown for standalone delivery.",
            mp4WebCodecs: "H.264 MP4 export through WebCodecs and native MP4 muxing.",
            mp4MediaRecorder: "MP4 export through the runtime MediaRecorder compatibility path.",
            mp4Unavailable: "This runtime does not expose a real MP4 export path.",
            webmMediaRecorder: "VP8/VP9 WebM export through MediaRecorder.",
            webmUnavailable: "This runtime does not expose a real WebM export path."
        },
        routeLabels: {
            webcodecs: "WebCodecs",
            mediaRecorder: "MediaRecorder",
            offlinePcm: "Offline PCM",
            notAvailable: "Not available"
        }
    },
    shortcuts: {
        title: "Keyboard Shortcuts",
        playback: "Playback",
        navigation: "Navigation",
        editing: "Editing",
        tools: "Tools",
        selection: "Selection",
        playPause: "Play/Pause",
        stepForward: "Step Forward",
        stepBackward: "Step Backward",
        jumpStart: "Jump to Start",
        jumpEnd: "Jump to End",
        split: "Split Clip",
        delete: "Delete Selected",
        copy: "Copy",
        paste: "Paste",
        undo: "Undo",
        redo: "Redo",
        zoomIn: "Zoom In",
        zoomOut: "Zoom Out",
        playForward: "Play Forward",
        playBackward: "Play Backward",
        pausePlayback: "Pause",
        rippleDelete: "Ripple Delete Selected",
        pasteInsert: "Paste Insert",
        nudgeLeft: "Nudge Left",
        nudgeRight: "Nudge Right",
        nudgeLeftBig: "Nudge Left 10 Frames",
        nudgeRightBig: "Nudge Right 10 Frames",
        setInPoint: "Set In Point",
        setOutPoint: "Set Out Point",
        clearInOut: "Clear In/Out",
        trimStartToPlayhead: "Trim Start to Playhead",
        trimEndToPlayhead: "Trim End to Playhead",
        zoomFit: "Fit Timeline to View",
        toggleSnapping: "Toggle Snapping",
        toggleSkimming: "Toggle Skimming",
        toggleLinkedSelection: "Toggle Linked Selection",
        toolSelect: "Selection Tool",
        toolTrim: "Trim Tool",
        toolRipple: "Ripple Edit Tool",
        toolRoll: "Roll Edit Tool",
        toolSlip: "Slip Tool",
        toolSlide: "Slide Tool",
        toolRazor: "Razor Tool"
    },
    contextMenu: {
        headers: {
            selectedClip: "Selected Clip",
            trackOptions: "Track Options",
            timeline: "Timeline"
        },
        actions: {
            split: "Split Clip",
            trimStart: "Trim Start (Delete Left)",
            trimEnd: "Trim End (Delete Right)",
            detachAudio: "Detach Audio",
            deleteLift: "Delete (Lift)",
            rippleDelete: "Ripple Delete",
            pasteHere: "Paste Here",
            pasteInsertHere: "Paste Insert Here",
            pasteOverwriteHere: "Paste Overwrite Here",
            pasteToNewTrack: "Paste to New Track",
            pasteInsertToNewTrack: "Paste Insert to New Track",
            pasteOverwriteToNewTrack: "Paste Overwrite to New Track"
        }
    },
    toolbar: {
        ai: {
            image: "Image",
            video: "Video",
            speech: "Speech",
            sfx: "SFX",
            music: "Music"
        },
        messages: {
            selectTrackFirst: "Select a track first",
            cannotGenerateVisualOnAudio: "Cannot generate {action} on an audio track",
            cannotGenerateAudioOnVideo: "Cannot generate {action} on a video track",
            generateAtPlayhead: "Generate AI {action} at playhead"
        }
    },
    audioMixer: {
        title: "Audio Mixer",
        mute: "Mute",
        solo: "Solo",
        noAudioTracks: "No audio tracks available",
        selectedClip: "Selected Clip",
        fadeIn: "Fade In",
        fadeOut: "Fade Out",
        master: "Master",
        clips: "Clips ({count})",
        more: "+{count} more",
        clipFallback: "Clip",
        clipVolume: "{name} - Vol: {volume}%"
    },
    dragOverlay: {
        previewAlt: "Drag Preview"
    },
    trackHeader: {
        deleteDialogTitle: "Delete Track?",
        deleteDialogMessage: "Are you sure you want to delete \"{name}\"? This will also remove all clips inside this track. This action cannot be undone.",
        changeCover: "Change Cover",
        deleteTrack: "Delete Track",
        setCover: "Set Cover",
        uploadCustom: "Upload Custom",
        savingCover: "Saving Cover...",
        fromTrackClips: "From Track Clips",
        scanningContent: "Scanning content...",
        noSuitableFrames: "No suitable frames found.",
        coverAlt: "Cover",
        editCover: "Edit",
        coverLabel: "Cover"
    },
    editorToolbar: {
        saveTemplate: "Save as Template",
        export: "Export",
        templateSaved: "Template saved successfully!"
    },
    saveTemplate: {
        title: "Save as Template",
        subtitle: "Save current project structure for reuse",
        coverImage: "Cover Image",
        uploadCover: "Upload Cover",
        coverHelp: "Recommend 16:9 ratio. Used for previews in the template gallery.",
        name: "Template Name",
        namePlaceholder: "e.g. Cinematic Vlog Intro",
        nameRequired: "Name is required",
        description: "Description",
        descriptionPlaceholder: "Describe what this template is for...",
        publicTemplate: "Public Template",
        publicTemplateHelp: "Share this template with the community market.",
        price: "Price ($)",
        pricePlaceholder: "0.00",
        priceHelp: "Set to 0 for free templates.",
        saving: "Saving...",
        save: "Save Template"
    },
    loadTemplate: {
        title: "Load Template",
        confirmMessage: "Are you sure you want to load \"{name}\"?",
        warning: "This will overwrite your current timeline and project settings. Any unsaved changes will be lost.",
        confirm: "Load & Replace"
    },
    audioSettings: {
        sections: {
            mixer: "Mixer",
            enhance: "AI Enhance",
            properties: "Properties"
        },
        fields: {
            volume: "Volume",
            fadeIn: "Fade In",
            fadeOut: "Fade Out",
            speed: "Speed",
            gainNumeric: "Gain (Numeric)",
            denoise: "AI Denoise",
            normalize: "Normalize Loudness",
            equalizerEnabled: "Equalizer Enabled",
            openEqualizer: "Open Equalizer",
            low: "Low",
            mid: "Mid",
            high: "High"
        },
        actions: {
            bypass: "Bypass",
            resetEq: "Reset EQ",
            mute: "Mute",
            unmute: "Unmute"
        },
        eq: {
            title: "Three-band EQ",
            description: "This EQ writes directly to the clip audio effect chain used by preview and export."
        }
    },
    voiceSettings: {
        defaults: {
            script: "Hello World",
            voiceAssetName: "voice",
            captionTrackName: "Captions",
            captionName: "Caption {index}"
        },
        sections: {
            script: "Script",
            speaker: "Speaker",
            properties: "Properties",
            captions: "Captions"
        },
        fields: {
            voiceId: "Voice ID",
            speed: "Speed",
            pitch: "Pitch"
        },
        placeholders: {
            textToSpeak: "Enter text to speak..."
        },
        status: {
            generationFailed: "Generation failed",
            voiceRegenerated: "Voice regenerated"
        },
        errors: {
            noPlayableResult: "Voice generation returned no playable result.",
            generationFailed: "Voice generation failed."
        },
        actions: {
            generateAudio: "Generate Audio",
            autoCaption: "Auto-Caption",
            exportSrt: "Export SRT"
        },
        captions: {
            title: "Timeline captions",
            description: "Auto-Caption creates linked subtitle clips on a subtitle track. Export SRT downloads the same cue timing.",
            ready: "{count} cues ready from the current script",
            empty: "Enter a script to prepare caption cues."
        },
        summary: "{speakerName} - {duration}s source"
    },
    textSettings: {
        sections: {
            content: "Content",
            character: "Character",
            paragraph: "Paragraph",
            appearance: "Appearance",
            background: "Background",
            dropShadow: "Drop Shadow"
        },
        placeholders: {
            enterText: "Enter text..."
        },
        fontGroups: {
            sansSerif: "Sans Serif",
            serif: "Serif",
            monospace: "Monospace"
        },
        actions: {
            bold: "Bold",
            italic: "Italic"
        },
        fields: {
            fillColor: "Fill Color",
            stroke: "Stroke",
            color: "Color",
            width: "Width",
            padding: "Pad",
            radius: "Radius",
            blur: "Blur"
        }
    },
    imageSettings: {
        sections: {
            aiToolbox: "AI Toolbox",
            colorCorrection: "Color Correction",
            filters: "Filters"
        },
        messages: {
            assetWorkflowRequired: "Asset workflow required",
            useEffectsTab: "Use \"Effects\" tab to add filters"
        },
        tools: {
            removeBg: "Remove BG",
            upscale4k: "Upscale 4K",
            magicEraser: "Magic Eraser",
            remix: "Remix"
        },
        reasons: {
            removeBg: "Background matting must run in the asset workflow before the result is brought back onto the timeline.",
            upscale4k: "4K upscaling exists as an asset operation, not as a destructive in-timeline image rewrite.",
            magicEraser: "Object removal needs mask authoring, and the current image panel does not expose a mask surface.",
            remix: "Remix needs a separate generation session and asset handoff outside the timeline editor."
        },
        fields: {
            temperature: "Temp"
        }
    },
    keyframeEditor: {
        easing: {
            linear: "Linear",
            easeIn: "Ease In",
            easeOut: "Ease Out",
            easeInOut: "Ease In/Out",
            step: "Step"
        },
        actions: {
            delete: "Delete"
        }
    },
    visualTransform: {
        sections: {
            compositing: "Compositing"
        },
        actions: {
            resetPositionScale: "Reset Position/Scale",
            fit: "Fit",
            flipHorizontal: "Flip Horizontal",
            flipVertical: "Flip Vertical"
        },
        fields: {
            blendMode: "Blend Mode"
        },
        blendModes: {
            normal: "Normal",
            screen: "Screen",
            multiply: "Multiply",
            overlay: "Overlay",
            add: "Add (Linear Dodge)",
            darken: "Darken",
            lighten: "Lighten"
        }
    },
    videoNode: {
        generating: "Generating",
        uploadVideo: "Upload Video",
        doubleClickToBrowse: "Double click to browse",
        replaceVideo: "Replace Video",
        replace: "Replace"
    },
    tools: {
        select: "Select Tool",
        trim: "Trim Tool",
        ripple: "Ripple Edit Tool",
        roll: "Roll Edit Tool",
        slip: "Slip Tool",
        slide: "Slide Tool",
        razor: "Razor Tool"
    },
    effects: {
        blur: "Blur",
        brightness: "Brightness",
        contrast: "Contrast",
        saturation: "Saturation",
        hue: "Hue",
        sharpen: "Sharpen",
        vignette: "Vignette",
        grayscale: "Grayscale",
        sepia: "Sepia",
        invert: "Invert"
    },
    transitions: {
        fade: "Fade",
        dissolve: "Dissolve",
        wipe: "Wipe",
        slide: "Slide",
        zoom: "Zoom",
        spin: "Spin"
    },
    errors: {
        loadFailed: "Failed to load resource",
        exportFailed: "Failed to export video",
        unsupportedFormat: "Unsupported format",
        fileTooLarge: "File too large",
        insufficientMemory: "Insufficient memory",
        renderFailed: "Render failed"
    }
};
