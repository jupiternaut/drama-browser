import { PlotPilotNativeContainer } from './PlotPilotNativeContainer'
import { ProjectionHost } from './ProjectionHost'
import { StoryletNativeGraphContainer } from './StoryletNativeGraphContainer'
import { getWorkspaceTool, type WorkspaceToolId } from './workspace-tools'

export interface WorkspaceToolPageProps {
  toolId: WorkspaceToolId
}

export function WorkspaceToolPage({ toolId }: WorkspaceToolPageProps) {
  const tool = getWorkspaceTool(toolId)
  if (tool.id === 'plotPilot') {
    return <PlotPilotNativeContainer />
  }
  if (tool.id === 'storylet') {
    return <StoryletNativeGraphContainer tool={tool} />
  }
  return <ProjectionHost tool={tool} />
}
