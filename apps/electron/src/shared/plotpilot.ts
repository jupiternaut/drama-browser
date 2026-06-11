export type PlmRuntimeStatus =
  | 'unknown'
  | 'starting'
  | 'running'
  | 'healthy'
  | 'unhealthy'
  | 'stopping'
  | 'stopped'
  | 'error'
  | (string & {})

export interface PlmHealth {
  status: PlmRuntimeStatus
  version?: string
  build_id?: string
  uptime_seconds?: number
  daemon_process?: {
    running: boolean
    pid?: number | null
  }
  [key: string]: unknown
}

export interface PlmLogEntry {
  timestamp?: string
  level?: 'debug' | 'info' | 'warning' | 'error' | 'critical' | (string & {})
  message?: string
  stream?: 'runtime' | 'stdout' | 'stderr' | (string & {})
  line?: string
  source?: string
  novel_id?: string
  metadata?: Record<string, unknown>
}

export type PlotPilotHealth = PlmHealth
export type PlotPilotLogEntry = PlmLogEntry

export type PlotPilotRuntimeState =
  | 'stopped'
  | 'starting'
  | 'ready'
  | 'running'
  | 'stopping'
  | 'error'
  | (string & {})

export interface PlotPilotRuntimeStartOptions {
  projectRoot?: string
  dataDir?: string
  pythonExe?: string
  preferExisting?: boolean
}

export interface PlotPilotRuntimeStatus {
  state: PlotPilotRuntimeState
  healthy?: boolean
  port?: number | null
  baseUrl?: string | null
  apiBaseUrl?: string | null
  url?: string | null
  pid?: number | null
  startedAt?: string
  owned: boolean
  adopted: boolean
  projectRoot: string
  dataDir: string
  error?: string
  lastError?: string
  lastExitCode?: number | null
  lastExitSignal?: NodeJS.Signals | null
  health?: PlotPilotHealth
}

export interface GenerationPrefsDTO {
  phase_display_mode?: boolean
  smart_truncate_enabled?: boolean
  beat_hard_cap_enabled?: boolean
  inline_prose_aggregation_enabled?: boolean
  conductor_converge_threshold?: number | null
  conductor_land_threshold?: number | null
  pause_after_each_chapter_audit?: boolean
  audit_pause_on_hard_fail?: boolean
  audit_pause_on_anti_ai_severe?: boolean
  target_chapter_words?: number
  [key: string]: unknown
}

export interface ChapterDTO {
  id: string
  number: number
  title: string
  content: string
  word_count: number
  novel_id?: string
  status?: string
  generation_hint?: string
}

export interface NovelDTO {
  id: string
  title: string
  author: string
  target_chapters: number
  stage: string
  premise?: string
  chapters: ChapterDTO[]
  total_word_count: number
  slug?: string
  has_bible?: boolean
  has_outline?: boolean
  autopilot_status?: string
  auto_approve_mode?: boolean
  locked_genre?: string
  locked_world_preset?: string
  locked_story_structure?: string
  locked_pacing_control?: string
  locked_writing_style?: string
  locked_special_requirements?: string
  target_words_per_chapter?: number
  generation_prefs?: GenerationPrefsDTO
}

export interface CreateNovelRequest {
  novel_id: string
  title: string
  author: string
  target_chapters: number
  premise?: string
  genre?: string
  world_preset?: string
  story_structure?: string
  pacing_control?: string
  writing_style?: string
  special_requirements?: string
  length_tier?: 'short' | 'standard' | 'epic' | null
  target_words_per_chapter?: number | null
}

export interface BibleStatusDTO {
  exists: boolean
  ready: boolean
  novel_id: string
}

export interface EnsureChapterRequest {
  title?: string
}

export interface ChapterMicroBeatPayload {
  description: string
  target_words?: number
  focus?: string
  location_id?: string
  active_action?: string
  emotion_gap?: string
  forbidden_drift?: string
}

export interface ChapterMicroBeatsRequest {
  micro_beats: ChapterMicroBeatPayload[]
}

export interface ChapterMicroBeatsResponse {
  ok: boolean
  chapter_number: number
  count: number
}

export interface UpdateChapterContentRequest {
  content: string
  micro_beats?: ChapterMicroBeatPayload[] | null
}

export interface GenerateChapterRequest {
  chapter_number: number
  outline: string
  scene_director_result?: Record<string, unknown>
  invocation_policy?:
    | 'DIRECT'
    | 'REVIEW_BEFORE_CALL'
    | 'REVIEW_AFTER_CALL'
    | 'FULL_INTERACTIVE'
    | 'INTERACTIVE_WHEN_AVAILABLE'
    | 'AUTOPILOT_PAUSE'
  regeneration_guidance?: string
  allow_evolution_gate_bypass?: boolean
  profile_id?: string
  script_prompt_template?: string
  prose_prompt_template?: string
  prompt_variables?: Record<string, string>
}

export interface ConsistencyIssueDTO {
  type: string
  severity: string
  description: string
  location: number
}

export interface ConsistencyReportDTO {
  issues: ConsistencyIssueDTO[]
  warnings: ConsistencyIssueDTO[]
  suggestions: string[]
}

export interface ChapterStyleWarning {
  pattern: string
  text: string
  start: number
  end: number
  severity: 'info' | 'warning' | (string & {})
}

export interface ChapterChunkStats {
  chars: number
  chunks: number
  estimated_tokens: number
}

export interface StreamGeneratedBeatDTO {
  description: string
  target_words: number
  focus: string
  location_id?: string
  function?: string
  pov?: string
  cast_refs?: string[]
  location_refs?: string[]
  prop_refs?: string[]
  knowledge_refs?: string[]
  visible_action?: string
  conflict?: string
  delta?: string
  handoff_to_next?: string
  must_include?: string[]
  must_not_include?: string[]
  active_action?: string
  emotion_gap?: string
  forbidden_drift?: string
}

export type GenerateChapterStreamEvent =
  | {
      type: 'phase'
      phase: string
      message?: string
    }
  | {
      type: 'llm_chunk'
      stage: string
      text: string
    }
  | {
      type: 'beats_generated'
      beats: StreamGeneratedBeatDTO[]
    }
  | {
      type: 'approval_required'
      session_id: string
      status?: string
      next_action?: string
    }
  | {
      type: 'chunk'
      text: string
      stats: ChapterChunkStats
    }
  | {
      type: 'done'
      content: string
      consistency_report: ConsistencyReportDTO
      token_count: number
      output_tokens: number
      total_tokens: number
      chars: number
      style_warnings?: ChapterStyleWarning[]
      ghost_annotations?: unknown[]
      beats?: StreamGeneratedBeatDTO[]
    }
  | {
      type: 'error'
      message: string
    }
  | {
      type: 'unknown'
      event?: string
      raw: unknown
    }

export interface BeatSceneDTO {
  title: string
  goal: string
  pov_character: string
  location?: string | null
  tone?: string | null
  estimated_words: number
  order_index: number
}

export interface BeatSheetDTO {
  id: string
  chapter_id: string
  scenes: BeatSceneDTO[]
  total_scenes: number
  total_estimated_words: number
}

export interface GenerateBeatSheetRequest {
  chapter_id: string
  outline: string
}

export type BibleRelationshipEntry =
  | string
  | {
      target?: string
      relation?: string
      description?: string
    }

export interface CharacterDTO {
  id: string
  name: string
  description: string
  relationships: BibleRelationshipEntry[]
  gender?: string
  age?: string
  appearance?: string
  personality?: string
  background?: string
  core_motivation?: string
  inner_lack?: string
  role?: string
  mental_state?: string
  verbal_tic?: string
  idle_behavior?: string
  mental_state_reason?: string
  core_belief?: string
  moral_taboos?: string[]
  voice_profile?: Record<string, unknown>
  active_wounds?: Array<Record<string, unknown>>
  public_profile?: string
  hidden_profile?: string
  reveal_chapter?: number | null
}

export interface WorldSettingDTO {
  id: string
  name: string
  description: string
  setting_type: string
}

export interface LocationDTO {
  id: string
  name: string
  description: string
  location_type: string
  parent_id?: string | null
}

export interface TimelineNoteDTO {
  id: string
  event: string
  time_point: string
  description: string
}

export interface StyleNoteDTO {
  id: string
  category: string
  content: string
}

export interface BibleDTO {
  id: string
  novel_id: string
  characters: CharacterDTO[]
  world_settings: WorldSettingDTO[]
  locations: LocationDTO[]
  timeline_notes: TimelineNoteDTO[]
  style_notes: StyleNoteDTO[]
  style?: string
}

export type GenerateBibleStage =
  | 'all'
  | 'worldbuilding'
  | 'characters'
  | 'locations'
  | (string & {})

export interface WorldbuildingDimensionData {
  dimension: string
  label: string
  content: Record<string, string>
}

export type GenerateBibleDataType =
  | 'style'
  | 'style_chunk'
  | 'worldbuilding_dimension'
  | 'worldbuilding_field'
  | 'worldbuilding_chunk'
  | 'character'
  | 'character_chunk'
  | 'location'
  | 'location_chunk'
  | (string & {})

export type GenerateBibleStreamEvent =
  | {
      type: 'phase'
      phase: string
      message?: string
    }
  | {
      type: 'data'
      data_type: GenerateBibleDataType
      content?: unknown
      chunk?: string
      dimension?: string
      label?: string
      field?: string
      value?: string
      index?: number
    }
  | {
      type: 'approval_required'
      session_id: string
      status?: string
      next_action?: string
      stage?: string
    }
  | {
      type: 'done'
      novel_id: string
      message?: string
      invocation_session_id?: string
    }
  | {
      type: 'error'
      message: string
    }
  | {
      type: 'unknown'
      event?: string
      raw: unknown
    }

export type BibleStreamEvent = GenerateBibleStreamEvent

export type PlotPilotGenerationPrefsDTO = GenerationPrefsDTO
export type PlotPilotChapterDTO = ChapterDTO
export type PlotPilotNovelDTO = NovelDTO
export type PlotPilotCreateNovelInput = CreateNovelRequest
export type PlotPilotBibleRelationshipEntry = BibleRelationshipEntry
export type PlotPilotCharacterDTO = CharacterDTO
export type PlotPilotWorldSettingDTO = WorldSettingDTO
export type PlotPilotLocationDTO = LocationDTO
export type PlotPilotTimelineNoteDTO = TimelineNoteDTO
export type PlotPilotStyleNoteDTO = StyleNoteDTO
export type PlotPilotBibleDTO = BibleDTO
export type PlotPilotStreamEvent = GenerateBibleStreamEvent
