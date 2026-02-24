export const film = {
  common: {
    characters: "Characters",
    locations: "Locations",
    props: "Props",
    scenes: "Scenes",
    shots: "Shots",
    script: "Script",
    storyboard: "Storyboard",
    timeline: "Timeline",
    overview: "Overview",
    preview: "Preview",
    save: "Save",
    export: "Export",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    generate: "Generate",
    generating: "Generating...",
    upload: "Upload",
    remove: "Remove",
    settings: "Settings",
    ai_generate: "AI Generate",
    ai_regenerate: "Regenerate with AI",
    generate_result: "Generate Result",
    generate_image: "Gen Image",
    no_desc: "No description",
    unknown: "Unknown",
    loading: "Loading...",
  },
  status: {
    draft: "Draft",
    analyzing: "Analyzing",
    script_ready: "Script Ready",
    storyboard_ready: "Storyboard Ready",
    generating: "Generating",
    completed: "Completed",
  },
  sidebar: {
    title: "Projects",
    search_placeholder: "Search projects...",
    new_project: "New Project",
    create_placeholder: "Enter project name",
    create_btn: "Create",
    cancel_btn: "Cancel",
    no_projects: "No projects",
    create_first: "Create New Project",
    view_all: "View All",
    project_count: "{count} Projects",
  },
  overview: {
    est_duration: "Est. {min} mins",
    completion: "{percent}% Complete",
    pages: "Pages",
    story_summary: "Story Summary",
    story_summary_placeholder: "No summary available. Please add a description in project settings or script analysis.",
    art_style: "Art Style",
    art_style_placeholder: "Undefined style tags",
    art_style_desc: "Visual tone set to realistic style, emphasizing lighting and emotional atmosphere.",
    cast: "Cast",
    view_all: "View All",
    add_character: "Add Character",
    add_prop: "Add Prop",
    add_location: "Add Location",
    generate_all: "Generate All",
    generating_batch: "Generating Batch...",
    generate_missing: "Generate Missing",
  },
  script: {
    title: "Screenplay",
    outline: "Outline",
    analyze_btn: "Breakdown Script",
    analyzing: "Analyzing...",
    scenes_list: "Scenes",
    no_scenes: "No scenes detected.",
    no_scenes_hint: "Use INT. or EXT. to start a scene.",
    editor_placeholder: "FADE IN:\n\nINT. COFFEE SHOP - DAY\n\nThe aroma of roasted beans fills the air...",
  },
  character: {
    title: "Characters",
    subtitle: "Manage cast members, define appearance, personality and voice.",
    add_btn: "Add Character",
    ai_extract: "AI Extract",
    extracting: "Extracting...",
    modal: {
      new_title: "New Character",
      edit_title: "Edit Character",
      tabs: {
        avatar: "Avatar",
        sheet: "Sheet",
        grid: "Grid"
      },
      name: "Name",
      gender: "Gender",
      age: "Age",
      description: "Description",
      traits: "Traits",
      voice_settings: "Voice Settings"
    }
  },
  location: {
    title: "Locations",
    subtitle: "Manage story settings and environment concepts.",
    add_btn: "Add Location",
    ai_extract: "AI Extract Locations",
    modal: {
      new_title: "New Location",
      edit_title: "Edit Location",
      visual_ref: "Concept Art / Environment",
      name: "Name",
      time: "Time",
      indoor: "Indoor",
      atmosphere: "Atmosphere Tags",
      visual_desc: "Visual Description"
    }
  },
  prop: {
    title: "Props",
    subtitle: "Manage key items and objects in the story.",
    add_btn: "Add Prop",
    ai_extract: "AI Extract Props",
    modal: {
      new_title: "New Prop",
      edit_title: "Edit Prop",
      visual_ref: "Visual Reference",
      name: "Name",
      role: "Role",
      description: "Description",
      roles: {
        plot_device: "Plot Device",
        symbol: "Symbol",
        character_bind: "Character Bind",
        atmosphere: "Atmosphere"
      }
    }
  },
  storyboard: {
    title: "Storyboard",
    scene: "SCENE {index}",
    gen_images: "Gen Images",
    gen_videos: "Gen Videos",
    add_shot: "Add Shot",
    insert_before: "Insert Scene Before",
    insert_after: "Append Scene",
    insert_scene: "Insert Scene",
    no_scenes_title: "No scenes found.",
    no_scenes_desc: "Analyze the script or create your first scene manually.",
    create_first: "Create First Scene"
  },
  shot: {
    modal: {
      edit_title: "Edit Shot",
      visual_result: "Visual Result",
      gen_settings: "Generation Settings",
      modes: {
        image_to_video: "Img2Vid",
        text_to_video: "Txt2Vid"
      },
      products: {
        single: "Single",
        start_end: "Start/End",
        multi_ref: "Multi-Ref",
        grid: "Grid"
      },
      visual_prompt: "Visual Prompt",
      dialogue_script: "Dialogue & Script",
      add_line: "Add Line",
      description: "Description",
      action: "Action",
      shot_scale: "Shot Scale",
      camera: "Camera",
      duration: "Duration"
    }
  },
  scene: {
    modal: {
      new_title: "New Scene",
      edit_title: "Edit Scene",
      location_preview: "Location Preview",
      location: "Location",
      no_locations: "No locations defined. Please add locations first.",
      summary: "Summary",
      mood: "Mood Tags",
      cast: "Cast",
      props: "Props",
      visual_prompt: "Visual Prompt"
    }
  },
  preview: {
    no_active_shot: "No active shot",
    no_media: "No media generated",
    monitor: "Monitor"
  },
  timeline: {
      title: "Generation Timeline",
      desc: "Convert storyboard sequences into a coherent video editing project here."
  },
  copilot: {
      title: "Screenwriter Co-pilot"
  },
  settings: {
      format: "Project Format",
      quality: "Output Quality",
      resolution: "Resolution",
      framerate: "Frame Rate",
      ai_gen: "AI Generation",
      apply_desc: "Settings apply to all new generations in this project.\nExisting assets are not affected."
  }
};
