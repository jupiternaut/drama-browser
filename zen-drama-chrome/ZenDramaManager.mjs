// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { nsZenDOMOperatedFeature } from "chrome://browser/content/zen-components/ZenCommonUtils.mjs";

const { Subprocess } = ChromeUtils.importESModule(
  "resource://gre/modules/Subprocess.sys.mjs"
);

const DRAMA_DEFAULT_BASE_URL = "http://127.0.0.1:3198/app";
const DRAMA_DEFAULT_RUNTIME_URL = "http://127.0.0.1:3198";
const DRAMA_DEFAULT_INTERNAL_APP_URL = "chrome://browser/content/drama/app/index.html";
const DRAMA_BASE_URL_PREF = "zen.drama.base-url";
const DRAMA_RUNTIME_URL_PREF = "zen.drama.runtime-url";
const DRAMA_INTERNAL_APP_ENABLED_PREF = "zen.drama.internal-app.enabled";
const DRAMA_INTERNAL_APP_URL_PREF = "zen.drama.internal-app-url";
const DRAMA_RUNTIME_LAUNCH_ENABLED_PREF = "zen.drama.runtime-launch.enabled";
const DRAMA_RUNTIME_LAUNCH_COMMAND_PREF = "zen.drama.runtime-launch.command";
const DRAMA_RUNTIME_LAUNCH_ARGS_PREF = "zen.drama.runtime-launch.args";
const DRAMA_RUNTIME_LAUNCH_CWD_PREF = "zen.drama.runtime-launch.cwd";
const DRAMA_RUNTIME_LAUNCH_TIMEOUT_MS_PREF = "zen.drama.runtime-launch.timeout-ms";
const DRAMA_OPEN_ON_STARTUP_PREF = "zen.drama.open-on-startup";
const DRAMA_START_SURFACE_PREF = "zen.drama.start-surface";
const DRAMA_PRODUCTION_FIXTURE_ENABLED_PREF = "zen.drama.production-fixture.enabled";
const DRAMA_LOCKED_URL = "about:blank";

class nsZenDramaManager extends nsZenDOMOperatedFeature {
  #surface = "graph";
  #hasLoadedBrowser = false;
  #runtimeLaunchPromise = null;
  #tabSelectHandler = null;
  #panelOpenGeneration = 0;
  #isLocked = false;

  init() {
    this.panel = document.getElementById("zen-drama-panel");
    this.browser = document.getElementById("zen-drama-browser");
    this.status = document.getElementById("zen-drama-runtime-status");
    this.sidebarButton = document.getElementById("zen-drama-button");
    this.launcherButton = document.getElementById("zen-drama-launcher-button");

    this.#ensureLauncherButton();
    this.#ensureSidebarSurfaceButtons();
    window.requestAnimationFrame(() => {
      this.#ensureLauncherButton();
      this.#ensureSidebarSurfaceButtons();
      this.#updateActiveSurface();
    });
    window.setTimeout(() => {
      this.#ensureLauncherButton();
      this.#ensureSidebarSurfaceButtons();
      this.#updateActiveSurface();
    }, 1200);
    this.#bindCommand("cmd_zenDramaToggle", () => this.toggle());
    this.#bindCommand("cmd_zenDramaOpenGraph", () => this.open("graph"));
    this.#bindCommand("cmd_zenDramaOpenPlm", () => this.open("plm"));
    this.#bindCommand("cmd_zenDramaOpenCrew", () => this.open("crew"));
    this.#bindCommand("cmd_zenDramaOpenInTab", () => this.openInTab());

    this.browser?.addEventListener("load", () => this.#sendTheme());
    window.addEventListener("focus", () => this.#sendTheme());
    this.#bindTabSelection();

    if (this.openOnStartup) {
      window.requestAnimationFrame(() => this.open(this.startSurface));
    }
  }

  #bindCommand(id, handler) {
    document.getElementById(id)?.addEventListener("command", event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  }

  #ensureLauncherButton() {
    let button = document.getElementById("zen-drama-launcher-button");
    if (!button) {
      const parent = this.panel?.parentElement || document.body || document.documentElement;
      if (!parent) {
        return null;
      }

      button = document.createXULElement("toolbarbutton");
      button.setAttribute("id", "zen-drama-launcher-button");
      parent.insertBefore(button, this.panel || parent.firstChild);
    }

    button.setAttribute("class", "toolbarbutton-1 zen-drama-launcher-button");
    button.setAttribute("image", "chrome://browser/content/zen-icons/drama-plm.svg");
    button.setAttribute("label", "PLM");
    button.setAttribute("tooltiptext", "Open Drama PLM");
    button.setAttribute("removable", "false");
    button.setAttribute("overflows", "false");

    if (button.getAttribute("zen-drama-launcher-bound") !== "true") {
      button.addEventListener("command", event => {
        event.preventDefault();
        event.stopPropagation();
        this.open("plm");
      });
      button.setAttribute("zen-drama-launcher-bound", "true");
    }

    this.launcherButton = button;
    return button;
  }

  #ensureSidebarSurfaceButtons() {
    const toolbar = document.getElementById("zen-sidebar-foot-buttons");
    if (!toolbar) {
      return;
    }

    const surfaces = [
      {
        id: "zen-drama-graph-sidebar-button",
        command: "cmd_zenDramaOpenGraph",
        image: "chrome://browser/content/zen-icons/drama-graph.svg",
        tooltip: "Drama Graph",
      },
      {
        id: "zen-drama-plm-sidebar-button",
        command: "cmd_zenDramaOpenPlm",
        image: "chrome://browser/content/zen-icons/drama-plm.svg",
        tooltip: "Drama PLM",
      },
      {
        id: "zen-drama-crew-sidebar-button",
        command: "cmd_zenDramaOpenCrew",
        image: "chrome://browser/content/zen-icons/drama-crew.svg",
        tooltip: "Skill Crew",
      },
    ];
    const insertBefore = document.getElementById("zen-create-new-button");

    for (const surface of surfaces) {
      let button = document.getElementById(surface.id);
      if (!button) {
        button = document.createXULElement("toolbarbutton");
        button.setAttribute("id", surface.id);
      }

      button.setAttribute(
        "class",
        "chromeclass-toolbar-additional toolbarbutton-1 zen-sidebar-action-button zen-drama-sidebar-surface-button"
      );
      button.setAttribute("command", surface.command);
      button.setAttribute("image", surface.image);
      button.setAttribute("tooltiptext", surface.tooltip);
      button.setAttribute("removable", "false");
      button.setAttribute("overflows", "false");

      if (button.parentElement !== toolbar || button.nextElementSibling !== insertBefore) {
        toolbar.insertBefore(button, insertBefore);
      }
    }
  }

  #bindTabSelection() {
    if (this.#tabSelectHandler || typeof gBrowser === "undefined" || !gBrowser?.tabContainer) {
      return;
    }

    this.#tabSelectHandler = () => this.#hideForBrowserTab();
    window.addEventListener("TabSelect", this.#tabSelectHandler);
    gBrowser.tabContainer.addEventListener("TabSelect", this.#tabSelectHandler);
    gBrowser.tabContainer.addEventListener("TabOpen", event => {
      const panelOpenGeneration = this.#panelOpenGeneration;
      window.requestAnimationFrame(() => {
        if (this.#panelOpenGeneration === panelOpenGeneration && gBrowser.selectedTab === event.target) {
          this.#hideForBrowserTab();
        }
      });
    });
  }

  get baseUrl() {
    return this.#getStringPref(DRAMA_BASE_URL_PREF, DRAMA_DEFAULT_BASE_URL);
  }

  get runtimeUrl() {
    return this.#getStringPref(DRAMA_RUNTIME_URL_PREF, DRAMA_DEFAULT_RUNTIME_URL);
  }

  get baseOrigin() {
    if (this.internalAppEnabled) {
      return "*";
    }

    try {
      return new URL(this.baseUrl).origin;
    } catch {
      return DRAMA_DEFAULT_RUNTIME_URL;
    }
  }

  get internalAppEnabled() {
    try {
      return Services.prefs.getBoolPref(DRAMA_INTERNAL_APP_ENABLED_PREF, true);
    } catch {
      return true;
    }
  }

  get internalAppUrl() {
    return this.#getStringPref(DRAMA_INTERNAL_APP_URL_PREF, DRAMA_DEFAULT_INTERNAL_APP_URL);
  }

  get currentUrl() {
    const params = new URLSearchParams({
      host: "zen",
      runtime: this.runtimeUrl,
      surface: this.#surface,
    });
    if (this.productionFixtureEnabled && this.#surface === "plm") {
      params.set("productionFixture", "1");
    }

    if (this.internalAppEnabled) {
      return `${this.internalAppUrl}?${params.toString()}`;
    }

    return `${this.baseUrl}/${this.#surface}?${params.toString()}`;
  }

  get runtimeLaunchEnabled() {
    try {
      return Services.prefs.getBoolPref(DRAMA_RUNTIME_LAUNCH_ENABLED_PREF, true);
    } catch {
      return true;
    }
  }

  get runtimeLaunchTimeoutMs() {
    try {
      return Math.max(1000, Services.prefs.getIntPref(DRAMA_RUNTIME_LAUNCH_TIMEOUT_MS_PREF, 30000));
    } catch {
      return 30000;
    }
  }

  get runtimeLaunchCwd() {
    const configured = this.#getStringPref(DRAMA_RUNTIME_LAUNCH_CWD_PREF, "").trim();
    if (configured) {
      return configured;
    }

    const home = Services.env.get("USERPROFILE") || Services.env.get("HOME") || "";
    if (!home) {
      return "";
    }

    if (AppConstants.platform === "win") {
      return `${home}\\Downloads\\drama`;
    }
    return PathUtils.join(home, "Downloads", "drama");
  }

  get openOnStartup() {
    try {
      return Services.prefs.getBoolPref(DRAMA_OPEN_ON_STARTUP_PREF, false);
    } catch {
      return false;
    }
  }

  get startSurface() {
    const surface = this.#getStringPref(DRAMA_START_SURFACE_PREF, "graph").trim();
    return surface === "plm" || surface === "crew" || surface === "graph" ? surface : "graph";
  }

  get productionFixtureEnabled() {
    try {
      return Services.prefs.getBoolPref(DRAMA_PRODUCTION_FIXTURE_ENABLED_PREF, false);
    } catch {
      return false;
    }
  }

  get runtimeLaunchCommand() {
    const configured = this.#getStringPref(DRAMA_RUNTIME_LAUNCH_COMMAND_PREF, "").trim();
    if (configured) {
      return configured;
    }

    if (AppConstants.platform === "win") {
      return "powershell.exe";
    }

    if (AppConstants.platform === "macosx" || AppConstants.platform === "linux") {
      return "/bin/bash";
    }

    return "";
  }

  get runtimeLaunchArgs() {
    const configured = this.#getStringPref(DRAMA_RUNTIME_LAUNCH_ARGS_PREF, "").trim();
    if (configured) {
      return this.#parseLaunchArgs(configured);
    }

    const cwd = this.runtimeLaunchCwd;
    if (AppConstants.platform === "win" && cwd) {
      return [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        `${cwd}\\scripts\\launch-drama-runtime.ps1`,
      ];
    }

    if ((AppConstants.platform === "macosx" || AppConstants.platform === "linux") && cwd) {
      return [
        `${cwd}/scripts/launch-drama-runtime.sh`,
      ];
    }

    return [];
  }

  toggle() {
    if (!this.panel || !this.browser) {
      return;
    }

    if (this.panel.hidden) {
      this.open(this.#surface);
      return;
    }

    this.lock();
  }

  lock() {
    this.#lockPanel(true);
  }

  open(surface = "graph") {
    if (!this.panel || !this.browser) {
      return;
    }

    this.#ensureLauncherButton();
    this.#ensureSidebarSurfaceButtons();
    this.#surface = surface;
    this.#panelOpenGeneration += 1;
    this.#isLocked = false;
    this.#bindTabSelection();
    this.#setPanelVisible(true);
    void this.#loadSurface();
  }

  openInTab() {
    const tab = gBrowser.addTrustedTab(this.currentUrl, {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    gBrowser.selectedTab = tab;
  }

  async #loadSurface() {
    const url = this.currentUrl;
    this.#setStatus(`Drama ${this.#surface.toUpperCase()}`);

    const runtimeReady = await this.#checkRuntimeStatus();
    if (!runtimeReady) {
      await this.#tryStartRuntime();
    }

    if (!this.#hasLoadedBrowser || this.browser.currentURI?.spec !== url) {
      this.#hasLoadedBrowser = true;
      try {
        this.browser.loadURI(Services.io.newURI(url), {
          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        });
      } catch (error) {
        console.error("[ZenDrama] Failed to load Drama surface:", error);
        this.browser.setAttribute("src", url);
      }
    }

    this.#sendTheme();
    void this.#checkRuntimeStatus();
  }

  #hideForBrowserTab() {
    if (!this.panel || this.panel.hidden) {
      return;
    }

    this.#lockPanel(true);
  }

  #lockPanel(releaseContent = true) {
    if (!this.panel || !this.browser || this.panel.hidden) {
      return;
    }

    this.#panelOpenGeneration += 1;
    this.#isLocked = true;
    this.#setPanelVisible(false);
    if (releaseContent) {
      this.#releaseBrowserContent();
    }
    this.#setStatus("Drama locked");
  }

  #releaseBrowserContent() {
    if (!this.browser) {
      return;
    }

    this.#hasLoadedBrowser = false;
    if (this.browser.currentURI?.spec === DRAMA_LOCKED_URL) {
      return;
    }

    try {
      this.browser.loadURI(Services.io.newURI(DRAMA_LOCKED_URL), {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
    } catch (error) {
      console.error("[ZenDrama] Failed to release Drama surface:", error);
      this.browser.setAttribute("src", DRAMA_LOCKED_URL);
    }
  }

  #setPanelVisible(visible) {
    if (!this.panel) {
      return;
    }

    this.panel.hidden = !visible;
    const launcherButton = this.#ensureLauncherButton();
    if (visible) {
      this.sidebarButton?.setAttribute("zen-drama-active", "true");
      launcherButton?.setAttribute("zen-drama-active", "true");
    } else {
      this.sidebarButton?.removeAttribute("zen-drama-active");
      launcherButton?.removeAttribute("zen-drama-active");
    }
    launcherButton?.setAttribute("zen-drama-locked", this.#isLocked ? "true" : "false");
    this.#updateActiveSurface();
  }

  #updateActiveSurface() {
    const launcherButton = this.#ensureLauncherButton();
    launcherButton?.setAttribute("zen-drama-surface", this.#surface);
    launcherButton?.setAttribute("zen-drama-locked", this.#isLocked ? "true" : "false");
    this.#ensureSidebarSurfaceButtons();
    const ids = {
      graph: ["zen-drama-graph-button", "zen-drama-graph-sidebar-button"],
      plm: ["zen-drama-plm-button", "zen-drama-plm-sidebar-button"],
      crew: ["zen-drama-crew-button", "zen-drama-crew-sidebar-button"],
    };
    const panelVisible = Boolean(this.panel && !this.panel.hidden);

    for (const [surface, surfaceIds] of Object.entries(ids)) {
      for (const id of surfaceIds) {
        const button = document.getElementById(id);
        if (panelVisible && surface === this.#surface) {
          button?.setAttribute("zen-drama-active", "true");
        } else {
          button?.removeAttribute("zen-drama-active");
        }
      }
    }
  }

  #setStatus(value) {
    if (this.status) {
      this.status.setAttribute("value", value);
    }
  }

  async #checkRuntimeStatus() {
    try {
      const response = await fetch(`${this.runtimeUrl}/runtime/status`, {
        cache: "no-store",
      });
      if (!response.ok) {
        this.#setStatus("Drama runtime offline");
        return false;
      }

      const status = await response.json();
      this.#setStatus(status?.state === "ready" ? `Runtime ready / ${this.#surface}` : "Drama runtime starting");
      return status?.state === "ready";
    } catch {
      this.#setStatus("Drama runtime offline");
      return false;
    }
  }

  async #tryStartRuntime() {
    if (!this.runtimeLaunchEnabled) {
      this.#setStatus("Drama runtime offline");
      return false;
    }

    if (this.#runtimeLaunchPromise) {
      return this.#runtimeLaunchPromise;
    }

    this.#runtimeLaunchPromise = this.#startRuntime();
    try {
      return await this.#runtimeLaunchPromise;
    } finally {
      this.#runtimeLaunchPromise = null;
    }
  }

  async #startRuntime() {
    const command = await this.#resolveLaunchCommand(this.runtimeLaunchCommand);
    const args = this.runtimeLaunchArgs;
    const cwd = this.runtimeLaunchCwd;

    if (!command || !args.length) {
      this.#setStatus("Drama runtime launch not configured");
      return false;
    }

    this.#setStatus("Starting Drama runtime");

    try {
      const process = await Subprocess.call({
        command,
        arguments: args,
        workdir: cwd || undefined,
        environmentAppend: true,
        environment: {
          DRAMA_RUNTIME_URL: this.runtimeUrl,
        },
      });
      const { exitCode } = await process.wait();
      if (exitCode !== 0) {
        console.error(`[ZenDrama] Runtime launcher exited with ${exitCode}`);
      }
    } catch (error) {
      console.error("[ZenDrama] Failed to launch Drama runtime:", error);
      this.#setStatus("Drama runtime launch failed");
      return false;
    }

    return this.#waitForRuntimeReady(this.runtimeLaunchTimeoutMs);
  }

  async #waitForRuntimeReady(timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await this.#checkRuntimeStatus()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.#setStatus("Drama runtime offline");
    return false;
  }

  #getStringPref(name, fallback) {
    try {
      return Services.prefs.getStringPref(name, fallback);
    } catch {
      return fallback;
    }
  }

  #parseLaunchArgs(value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
        return parsed;
      }
    } catch {
      // Fall through to whitespace parsing for simple commands.
    }

    return value.split(/\s+/).filter(Boolean);
  }

  async #resolveLaunchCommand(command) {
    if (!command || PathUtils.isAbsolute(command)) {
      return command;
    }

    try {
      return await Subprocess.pathSearch(command);
    } catch {
      return command;
    }
  }

  #sendTheme() {
    const win = this.browser?.contentWindow;
    if (!win) {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const theme = {
      source: "zen",
      variables: {
        "--zen-border-radius": styles.getPropertyValue("--zen-border-radius"),
        "--zen-primary-color": styles.getPropertyValue("--zen-primary-color"),
        "--zen-main-browser-background": styles.getPropertyValue("--zen-main-browser-background"),
        "--zen-colors-tertiary": styles.getPropertyValue("--zen-colors-tertiary"),
        "--zen-colors-border": styles.getPropertyValue("--zen-colors-border"),
        "--zen-element-separation": styles.getPropertyValue("--zen-element-separation"),
      },
    };

    try {
      win.postMessage({ type: "drama:host-theme", theme }, this.baseOrigin);
    } catch {
      // The embedded page may not be ready yet.
    }
  }
}

window.gZenDramaManager = new nsZenDramaManager();
