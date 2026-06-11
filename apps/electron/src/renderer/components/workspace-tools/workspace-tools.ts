import { FileText, Layers, type LucideIcon } from 'lucide-react'

export type WorkspaceToolId = 'storylet' | 'plotPilot'

export type WorkspaceTool = {
  id: WorkspaceToolId
  title: string
  sourceName: string
  subtitle: string
  role: string
  bridge: string
  endpointLabel: string
  description: string
  url: string
  healthUrl?: string
  embedUrl?: string
  externalUrl?: string
  localProjectPath?: string
  startCommand?: string
  icon: LucideIcon
}

export const WORKSPACE_TOOLS = {
  storylet: {
    id: 'storylet',
    title: 'Drama Graph',
    sourceName: 'Drama Graph',
    subtitle: '状态机图谱',
    role: '状态机投影',
    bridge: '内置状态机引擎',
    endpointLabel: 'Drama 本机引擎',
    description: '读取本地图状态，在 Drama React 原生画布中渲染节点、关系和状态字段。',
    url: 'drama-graph://native',
    healthUrl: 'drama://engine/ready',
    embedUrl: undefined,
    externalUrl: 'drama-graph://native',
    localProjectPath: undefined,
    startCommand: undefined,
    icon: Layers,
  },
  plotPilot: {
    id: 'plotPilot',
    title: 'Drama PLM',
    sourceName: 'Drama PLM',
    subtitle: '长上下文生成',
    role: '长上下文投影',
    bridge: 'PLM 运行时桥',
    endpointLabel: 'Drama PLM 运行时',
    description: '承接长上下文、Bible、Beat 和章节稿生成，作为 Drama 的长篇叙事投影。',
    url: 'drama-plm://runtime',
    healthUrl: 'drama://engine/ready',
    embedUrl: undefined,
    externalUrl: 'drama-plm://runtime',
    localProjectPath: undefined,
    startCommand: undefined,
    icon: FileText,
  },
} as const satisfies Record<WorkspaceToolId, WorkspaceTool>

export const WORKSPACE_TOOL_LIST = [
  WORKSPACE_TOOLS.storylet,
  WORKSPACE_TOOLS.plotPilot,
] as const satisfies readonly WorkspaceTool[]

export function getWorkspaceTool(toolId: WorkspaceToolId): WorkspaceTool {
  return WORKSPACE_TOOLS[toolId]
}
