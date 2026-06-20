## 1. Spec and Boundary

- [x] 1.1 Define product-level skin system requirements in OpenSpec
- [x] 1.2 Document Warp-inspired architecture without copying Warp implementation

## 2. Skin Registry and State

- [x] 2.1 Add built-in Drama skin registry
- [x] 2.2 Add local persistence for selected skin
- [x] 2.3 Apply active skin to document root and shell root
- [x] 2.4 Emit active skin readiness signal for verification

## 3. Workbench UI

- [x] 3.1 Add compact skin switcher to Drama workbench chrome
- [x] 3.2 Keep switcher accessible in both Zen-hosted and browser-hosted modes
- [x] 3.3 Ensure the switcher does not crowd surface navigation at compact widths

## 4. Token Styling

- [x] 4.1 Convert root theme variables into skin-specific token blocks
- [x] 4.2 Preserve `zen-follow` token bridge for host-provided Zen variables
- [x] 4.3 Add token aliases for route-level text, panels, hover, selection, and code surfaces
- [x] 4.4 Apply skin tokens to shell chrome, shared controls, Graph overrides, and Crew surfaces

## 5. Verification

- [x] 5.1 Run `openspec validate drama-ui-skin-system --strict`
- [x] 5.2 Run browser shell typecheck
- [x] 5.3 Run browser shell build
- [x] 5.4 Run diff whitespace check

## 6. Future Skin Bases

- [x] 6.1 Register `jade-glass` and `opal-bloom` as first-class skin ids
- [x] 6.2 Add semantic token blocks for jade/cream glass and pink/blue opal glass
- [x] 6.3 Document that future skins branch from these two product art bases
