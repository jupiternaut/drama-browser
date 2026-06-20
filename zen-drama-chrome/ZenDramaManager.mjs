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
const DRAMA_NATIVE_SIDEBAR_VISIBILITY_PREF = "sidebar.visibility";
const DRAMA_NATIVE_SIDEBAR_EXPAND_ON_HOVER_PREF = "sidebar.expandOnHover";
const DRAMA_ZEN_SIDEBAR_EXPANDED_PREF = "zen.view.sidebar-expanded";
const DRAMA_PINNED_ENTRY_STYLE_PREF = "zen.drama.pinned-entry-style";
const DRAMA_LOCKED_URL = "about:blank";

class nsZenDramaManager extends nsZenDOMOperatedFeature {
  #surface = "graph";
  #hasLoadedBrowser = false;
  #runtimeLaunchPromise = null;
  #tabSelectHandler = null;
  #panelOpenGeneration = 0;
  #isLocked = false;
  #initialized = false;
  #suppressBrowserTabHideUntil = 0;
  #sidebarPinObserver = null;
  #sidebarMountObserver = null;
  #sidebarMountUpdatePending = false;
  #startupOpenActive = false;
  #startupOpenSettled = false;

  init() {
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;

    this.#prepareChromeShell();
    this.#bindNativeSidebarPinning();
    this.#bindSidebarMountObserver();
    window.requestAnimationFrame(() => {
      this.#prepareChromeShell();
    });
    window.setTimeout(() => {
      this.#prepareChromeShell();
    }, 1200);

    window.addEventListener("focus", () => this.#sendTheme());
    this.#bindTabSelection();

    this.ensureStartupOpen();
  }

  ensureStartupOpen() {
    if (!this.openOnStartup) {
      return;
    }

    this.#scheduleStartupOpen();
  }

  #refreshElements() {
    this.panel = document.getElementById("zen-drama-panel");
    this.browser = document.getElementById("zen-drama-browser");
    this.status = document.getElementById("zen-drama-runtime-status");
    this.sidebarButton = document.getElementById("zen-drama-button");
    this.launcherButton = document.getElementById("zen-drama-launcher-button");
  }

  #prepareChromeShell() {
    this.#refreshElements();
    this.#dockPanelInsideAppContent();
    this.#pinNativeSidebar();
    this.#bindCommands();
    this.#bindBrowserThemeBridge();
    this.#ensureLauncherButton();
    this.#ensurePinnedPlmSidebarEntry();
    this.#ensureSidebarSurfaceButtons();
    this.#updateActiveSurface();
  }

  #bindCommands() {
    this.#bindCommand("cmd_zenDramaToggle", () => this.toggle());
    this.#bindCommand("cmd_zenDramaOpenGraph", () => this.open("graph"));
    this.#bindCommand("cmd_zenDramaOpenPlm", () => this.open("plm"));
    this.#bindCommand("cmd_zenDramaOpenCrew", () => this.open("crew"));
    this.#bindCommand("cmd_zenDramaOpenInTab", () => this.openInTab());
  }

  #bindCommand(id, handler) {
    const command = document.getElementById(id);
    if (!command || command.getAttribute("zen-drama-command-bound") === "true") {
      return;
    }

    command.addEventListener("command", event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    command.setAttribute("zen-drama-command-bound", "true");
  }

  #bindBrowserThemeBridge() {
    if (!this.browser || this.browser.getAttribute("zen-drama-theme-bound") === "true") {
      return;
    }

    this.browser.addEventListener("load", () => this.#sendTheme());
    this.browser.setAttribute("zen-drama-theme-bound", "true");
  }

  #scheduleStartupOpen() {
    if (this.#startupOpenActive || this.#startupOpenSettled) {
      return;
    }

    this.#startupOpenActive = true;
    const targetSurface = this.startSurface;
    let attempts = 0;

    const tryOpen = () => {
      attempts += 1;
      this.#suppressBrowserTabHideUntil = Math.max(this.#suppressBrowserTabHideUntil, Date.now() + 3500);
      this.#prepareChromeShell();

      if (this.panel && this.browser && !this.panel.hidden) {
        this.#startupOpenSettled = true;
        this.#startupOpenActive = false;
        return;
      }

      this.open(targetSurface);
      if (this.panel && !this.panel.hidden) {
        this.#startupOpenSettled = true;
        this.#startupOpenActive = false;
        return;
      }

      if (attempts < 20) {
        window.setTimeout(tryOpen, 250);
      } else {
        this.#startupOpenActive = false;
      }
    };

    window.requestAnimationFrame(tryOpen);
    window.setTimeout(tryOpen, 1200);
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

  #dockPanelInsideAppContent() {
    const host = document.getElementById("zen-appcontent-wrapper");
    if (!host || !this.panel || this.panel.parentElement === host) {
      return;
    }

    host.appendChild(this.panel);
  }

  #pinNativeSidebar() {
    try {
      Services.prefs.setStringPref(DRAMA_NATIVE_SIDEBAR_VISIBILITY_PREF, "always-show");
      Services.prefs.setBoolPref(DRAMA_NATIVE_SIDEBAR_EXPAND_ON_HOVER_PREF, false);
      Services.prefs.setBoolPref(DRAMA_ZEN_SIDEBAR_EXPANDED_PREF, true);
    } catch (error) {
      console.warn("[ZenDrama] Failed to persist native sidebar state:", error);
    }

    document.documentElement.setAttribute("zen-sidebar-expanded", "true");
    document.documentElement.setAttribute("zen-drama-sidebar-pinned", "true");
  }

  #bindNativeSidebarPinning() {
    if (this.#sidebarPinObserver) {
      return;
    }

    this.#sidebarPinObserver = new MutationObserver(() => {
      if (document.documentElement.getAttribute("zen-sidebar-expanded") !== "true") {
        window.requestAnimationFrame(() => this.#pinNativeSidebar());
      }
    });
    this.#sidebarPinObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["zen-sidebar-expanded"],
    });
  }

  #bindSidebarMountObserver() {
    if (this.#sidebarMountObserver) {
      return;
    }

    const scheduleSidebarMountUpdate = () => {
      if (this.#sidebarMountUpdatePending) {
        return;
      }

      this.#sidebarMountUpdatePending = true;
      window.requestAnimationFrame(() => {
        this.#sidebarMountUpdatePending = false;
        this.#ensurePinnedPlmSidebarEntry();
        this.#ensureSidebarSurfaceButtons();
        this.#updatePinnedPlmActiveState();
      });
    };

    this.#sidebarMountObserver = new MutationObserver(scheduleSidebarMountUpdate);
    this.#sidebarMountObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    scheduleSidebarMountUpdate();
  }

  #ensurePinnedPlmSidebarEntry() {
    const tabs = document.getElementById("tabbrowser-tabs");
    const tabWrapper = document.getElementById("zen-tabs-wrapper");
    if (!tabs || !tabWrapper) {
      return null;
    }

    const htmlNamespace = "http://www.w3.org/1999/xhtml";
    let button = document.getElementById("zen-drama-plm-pinned-sidebar-entry");
    if (!button || button.namespaceURI !== htmlNamespace || button.localName !== "button") {
      button?.remove();
      button = document.createElementNS(htmlNamespace, "button");
      button.setAttribute("id", "zen-drama-plm-pinned-sidebar-entry");
    }

    if (!button.querySelector(".zen-drama-pinned-sidebar-entry-label")) {
      const icon = document.createElementNS(htmlNamespace, "span");
      icon.setAttribute("class", "zen-drama-pinned-sidebar-entry-icon");
      icon.setAttribute("aria-hidden", "true");

      const label = document.createElementNS(htmlNamespace, "span");
      label.setAttribute("class", "zen-drama-pinned-sidebar-entry-label");
      label.textContent = "Drama PLM";

      button.replaceChildren(icon, label);
    }

    button.setAttribute("class", "zen-drama-pinned-sidebar-entry");
    button.setAttribute("type", "button");
    button.setAttribute("title", "Drama PLM");
    button.setAttribute("aria-label", "Drama PLM");
    button.setAttribute("zen-drama-pinned-style", this.pinnedEntryStyle);

    if (button.getAttribute("zen-drama-pinned-entry-bound") !== "true") {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.open("plm");
      });
      button.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.open("plm");
      });
      button.setAttribute("zen-drama-pinned-entry-bound", "true");
    }

    if (button.parentElement !== tabs || tabWrapper.previousElementSibling !== button) {
      tabs.insertBefore(button, tabWrapper);
    }

    return button;
  }

  #updatePinnedPlmActiveState() {
    const pinnedEntry = document.getElementById("zen-drama-plm-pinned-sidebar-entry");
    const panelVisible = Boolean(this.panel && !this.panel.hidden);
    if (panelVisible && this.#surface === "plm") {
      pinnedEntry?.setAttribute("zen-drama-active", "true");
    } else {
      pinnedEntry?.removeAttribute("zen-drama-active");
    }
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

  get pinnedEntryStyle() {
    const style = this.#getStringPref(DRAMA_PINNED_ENTRY_STYLE_PREF, "jade").trim().toLowerCase();
    return style === "opal" ? "opal" : "jade";
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
    this.#prepareChromeShell();
    if (!this.panel || !this.browser) {
      return;
    }

    this.#dockPanelInsideAppContent();
    this.#pinNativeSidebar();
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
    if (Date.now() < this.#suppressBrowserTabHideUntil) {
      return;
    }

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
    this.#ensurePinnedPlmSidebarEntry();
    this.#ensureSidebarSurfaceButtons();
    const ids = {
      graph: ["zen-drama-graph-button", "zen-drama-graph-sidebar-button"],
      plm: ["zen-drama-plm-button", "zen-drama-plm-sidebar-button", "zen-drama-plm-pinned-sidebar-entry"],
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
const initializeZenDramaManager = () => window.gZenDramaManager?.init();
const ensureZenDramaStartupOpen = () => window.gZenDramaManager?.ensureStartupOpen?.();
if (document.readyState !== "loading") {
  window.queueMicrotask(initializeZenDramaManager);
} else {
  document.addEventListener("DOMContentLoaded", initializeZenDramaManager, { once: true });
}
window.addEventListener("load", initializeZenDramaManager, { once: true });
window.addEventListener("load", () => window.setTimeout(ensureZenDramaStartupOpen, 300), { once: true });
window.setTimeout(ensureZenDramaStartupOpen, 1500);
window.setTimeout(ensureZenDramaStartupOpen, 3000);
