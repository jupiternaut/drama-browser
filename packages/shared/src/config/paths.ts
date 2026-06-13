/**
 * Centralized path configuration for Drama.
 *
 * Supports multi-instance development via CRAFT_CONFIG_DIR environment variable.
 * When running from a numbered folder, the dev launcher sets CRAFT_CONFIG_DIR
 * to ~/.drama-agent-1, allowing multiple instances to run
 * simultaneously with separate configurations.
 *
 * Default (non-numbered folders): ~/.drama-agent/
 * Instance 1 (-1 suffix): ~/.drama-agent-1/
 * Instance 2 (-2 suffix): ~/.drama-agent-2/
 */

import { homedir } from 'os';
import { join } from 'path';

// Allow override via environment variable for multi-instance dev.
// Drama must not share ~/.drama-agent with the upstream Craft Agents app:
// both runtimes use CONFIG_DIR/.server.lock for the embedded backend.
export const CONFIG_DIR = process.env.CRAFT_CONFIG_DIR || join(homedir(), '.drama-agent');
