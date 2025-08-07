import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IUIStore, uiStore } from "./states/uiStore";
import "./features/demo/warningDemoEnv";


@customElement("app-root")
export class App extends LitElement {
  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  topBarTitle = this.uiState.topBarTitle;

  createRenderRoot() {
    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.topBarTitle = state.topBarTitle;
    });

    // Add the publish button to the document body after a short delay
    setTimeout(() => {
      const existingButton = document.getElementById('publish-button');
      if (!existingButton) {
        const publishButton = document.createElement('button');
        publishButton.id = 'publish-button';
        publishButton.innerHTML = `
          <span class="material-symbols-outlined" style="color: #000000; margin-right: 5px; font-size: 18px;">upload</span>
          Publish
        `;
        publishButton.style.cssText = `
          position: fixed;
          top: 50px;
          right: 25px;
          background-color: #F9D312;
          color: #000000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          z-index: 10000;
          font-family: inherit;
          transition: opacity 0.3s ease;
        `;
        publishButton.onclick = () => {
          console.log('Publish button clicked! Starting video export...');

          // Try to find and click the render button
          const renderButton = document.querySelector('control-ui-render button[class*="btn-blue-fill"]');
          if (renderButton) {
            console.log('Found render button, clicking it...');
            (renderButton as HTMLElement).click();
          } else {
            console.log('Render button not found, trying direct method...');
            // Try to find the control render component and call its method directly
            const controlRender = document.querySelector('control-ui-render');
            if (controlRender) {
              console.log('Found control render component');
              const component = controlRender as any;
              if (component.handleClickRenderV2Button) {
                console.log('Calling handleClickRenderV2Button...');
                component.handleClickRenderV2Button();
              } else if (component.requestHttpRender) {
                console.log('Calling requestHttpRender...');
                component.requestHttpRender();
              } else {
                console.log('No render methods found on component');
                alert('Render functionality not available');
              }
            } else {
              console.log('Control render component not found');
              alert('Render component not found');
            }
          }
        };
        document.body.appendChild(publishButton);

        /*** LAYOUT BUTTONS ***/
        // Container to hold layout buttons
        let layoutContainer = document.getElementById('layout-btn-group') as HTMLElement | null;
        if (!layoutContainer) {
          layoutContainer = document.createElement('div');
          layoutContainer.id = 'layout-btn-group';
          layoutContainer.style.cssText = `
            position: fixed;
            top: 50px;
            right: 130px; /* Keep a bit left to the publish button */
            display: flex;
            gap: 8px;
            margin-top: 1px;
            margin-right: 20px;
            z-index: 10000;
          `;
          document.body.appendChild(layoutContainer);
        }

        /*** VERTICAL ACTION BAR (persistent) ***/
        let actionBar = document.getElementById('left-action-bar') as HTMLElement | null;
        if (!actionBar) {
          actionBar = document.createElement('div');
          actionBar.id = 'left-action-bar';
          actionBar.style.cssText = `
            position: fixed;
            top: 40%;
            left: 0;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 4px;
            background: rgba(30,30,30,0.6);
            backdrop-filter: blur(4px);
            border-radius: 0 8px 8px 0;
            z-index: 10000;

          `;
          const icons = [
            { name: 'settings', tooltip: 'Settings', target: '#nav-home' },
            { name: 'draft', tooltip: 'Assets', target: '#nav-draft' },
            { name: 'text_fields', tooltip: 'Text', target: '#nav-text' },
            { name: 'library_books', tooltip: 'Filter', target: '#nav-filter' },
            { name: 'page_info', tooltip: 'Utilities', target: '#nav-util' },
            { name: 'extension', tooltip: 'Options', target: '#nav-option' },
            { name: 'output', tooltip: 'Render', target: '#nav-output' },
          ];

          // Keep track of the currently active sidebar target and any pending timeouts.
          let currentSidebarTarget: string | null = null;
          let pendingSidebarTimeout: number | null = null;

          icons.forEach(({ name, tooltip, target }) => {
            const btn = document.createElement('button');
            btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px;color:#fff;">${name}</span>`;
            btn.title = tooltip;
            btn.style.cssText = `
              background: transparent;
              border: none;
              cursor: pointer;
              padding: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            `;
            btn.onclick = () => {
              const control = document.querySelector('control-ui') as any;
              if (!control) return;

              // Cancel any pending tab-activation timeout to avoid double execution
              if (pendingSidebarTimeout) {
                clearTimeout(pendingSidebarTimeout);
                pendingSidebarTimeout = null;
              }

              const panelOpen = !control.isPanelCollapsed;

              // Toggle: if the same tab icon is clicked while panel is open, collapse it
              if (panelOpen && currentSidebarTarget === target) {
                setSidebarCollapsed(true);
                currentSidebarTarget = null;
                adjustOffsets();
                return;
              }

              // Otherwise, make sure the panel is open and switch to the desired tab
              setSidebarCollapsed(false);
              currentSidebarTarget = target;
              adjustOffsets();

              // Activate the corresponding (hidden) sidebar button after the slide animation
              pendingSidebarTimeout = window.setTimeout(() => {
                const targetBtn = document.querySelector(
                  `#sidebar button[data-bs-target="${target}"]`
                ) as HTMLElement | null;
                targetBtn?.click();
                pendingSidebarTimeout = null;
              }, 350);
            };
            actionBar!.appendChild(btn);
          });
          document.body.appendChild(actionBar);

          // Hide original sidebar nav inside panel
          const originalSidebar = document.querySelector('control-ui #sidebar') as HTMLElement | null;
          if (originalSidebar) originalSidebar.style.display = 'none';

          // Ensure sidebar nav remains hidden even if re-rendered
          const styleHide = document.getElementById('hide-side-nav-style');
          if (!styleHide) {
            const st = document.createElement('style');
            st.id = 'hide-side-nav-style';
            st.innerHTML = `
              control-ui #sidebar{display:none !important;}
              control-ui #split_col_1 .tab-content{width:100% !important;}
              control-ui #split_col_1 .d-flex.align-items-start{gap:0 !important;}
              control-ui #split_col_1 .d-flex.align-items-start::before{display:none !important;}
            `;
            document.head.appendChild(st);
          }
        }

        // Helper functions to manipulate sidebar & chat states
        const setSidebarCollapsed = (collapsed: boolean) => {
          const control = document.querySelector('control-ui') as any;
          if (control) {
            control.isPanelCollapsed = collapsed;
            if (control.requestUpdate) control.requestUpdate();

            // Access the panel column within control-ui
            const panelCol = document.querySelector('control-ui #split_col_1') as HTMLElement | null;
            if (panelCol) {
              if (!collapsed) {
                // Expand panel – make it overlay full height on the left
                const topBar = document.querySelector('.top-bar') as HTMLElement | null;
                const topOffset = topBar ? topBar.getBoundingClientRect().bottom : 0;
                // Capture original width for consistent layout
                let panelWidth = panelCol.getBoundingClientRect().width || panelCol.offsetWidth;
                if (!panelWidth || panelWidth < 50) {
                  // fallback default width (26% viewport) if collapsed width is 0
                  panelWidth = Math.round(window.innerWidth * 0.26);
                }

                panelCol.style.position = 'fixed';
                panelCol.style.top = '0';
                panelCol.style.bottom = '';
                const actionBarW = actionBar?.getBoundingClientRect().width || 0;
                const gap = 0; // Removed extra gap so the panel fits snugly against the action bar
                panelCol.style.left = actionBarW + gap + 'px';
                panelCol.style.height = '100vh';
                panelCol.style.zIndex = '9999';
                panelCol.style.width = panelWidth + 'px';
                panelCol.style.transform = 'translateX(0)';
                panelCol.style.background = panelCol.style.background || '#1e1e1e';
                // Visual consistency
                panelCol.style.borderTop = '1px solid rgba(255,255,255,0.2)';
                panelCol.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
                panelCol.style.borderLeft = '1px solid rgba(255,255,255,0.2)';
                panelCol.style.borderRadius = '8px';

                // Hide split column bar while panel is open
                const splitBar = document.querySelector('.split-col-bar') as HTMLElement | null;
                if (splitBar) splitBar.style.display = 'none';
              } else {
                // Collapse – restore original static positioning
                panelCol.style.position = '';
                panelCol.style.top = '';
                panelCol.style.bottom = '';
                panelCol.style.left = '';
                panelCol.style.height = '';
                panelCol.style.zIndex = '';
                panelCol.style.width = '';
                panelCol.style.background = '';
                panelCol.style.borderTop = '';
                panelCol.style.borderBottom = '';
panelCol.style.borderLeft = '';
panelCol.style.borderRadius = '';
panelCol.style.transform = '';

                // Restore split bar visibility
                const splitBar = document.querySelector('.split-col-bar') as HTMLElement | null;
                if (splitBar) splitBar.style.display = '';
              }
            }
          }
        };
        const openChat = () => {
          const chatEl = document.querySelector('react-chat-widget');
          if (chatEl) {
            const btn = chatEl.querySelector('button[aria-label="Open chat"]') as HTMLElement;
            if (btn) btn.click();
          }
        };
        const closeChat = () => {
          const chatEl = document.querySelector('react-chat-widget');
          if (chatEl) {
            const btn = chatEl.querySelector('button[aria-label="Close chat"]') as HTMLElement;
            if (btn) btn.click();
          }
        };

        const adjustOffsets = () => {
          // reset first for timeline & preview elements
          const timelineEl = document.querySelector('timeline-ui') as HTMLElement;
          const previewEl = document.querySelector('control-ui #split_col_2') as HTMLElement | null;
          if (timelineEl) {
            timelineEl.style.transform = 'translateX(0)';
            timelineEl.style.width = '';
            timelineEl.style.marginRight = '0';
          }
          if (previewEl) {
            previewEl.style.transform = 'translateX(0)';
            previewEl.style.width = '48%';
            previewEl.style.marginRight = '0';
          // Reset top and bottom row transforms
          const tRow = document.getElementById('split_top') as HTMLElement | null;
          const bRow = document.getElementById('split_bottom') as HTMLElement | null;
          if (tRow) {
            tRow.style.transform = '';
            tRow.style.width = '';
          }
          if (bRow) {
            bRow.style.transform = '';
            bRow.style.width = '';
          }
          }

          const sidebarEl = document.getElementById('split_col_1');
          if (sidebarEl && !sidebarEl.querySelector('.drawer-toggle')?.textContent?.includes('chevron_right')) {
            // sidebar visible (chevron_left icon means open)
            const sideRect = sidebarEl.getBoundingClientRect();
            const leftOffset = sideRect.left;
                        // Calculate horizontal space occupied by sidebar (panel + its current offset)
            const total = sideRect.width + leftOffset;
              const topRow = document.getElementById('split_top') as HTMLElement | null;
              const bottomRow = document.getElementById('split_bottom') as HTMLElement | null;
              if (total) {
                 const panelShift = total;
                if (topRow) {
                  topRow.style.transform = `translateX(${panelShift}px)`;
                  topRow.style.width = `calc(100% - ${panelShift}px)`;
                }
                if (bottomRow) {
                  bottomRow.style.transform = `translateX(${panelShift}px)`;
                  bottomRow.style.width = `calc(100% - ${panelShift}px)`;
                }
                const gradient = 'linear-gradient(180deg, rgba(17, 18, 21, 0) 0%, rgba(50, 53, 62, 0.2) 100%)';
                if (topRow) topRow.style.background = gradient;
                if (bottomRow) bottomRow.style.background = gradient;
              } else {
                if (topRow) topRow.style.background = 'transparent';
                if (bottomRow) bottomRow.style.background = 'transparent';
              }
          }

          const chatWidgetOpen = document.querySelector('react-chat-widget[data-open="true"]');
          if (chatWidgetOpen) {
            const chatRect = (chatWidgetOpen as HTMLElement).getBoundingClientRect();
                          if (chatRect.width) {
                timelineEl && (timelineEl.style.marginRight = chatRect.width + 'px');
                previewEl && (previewEl.style.marginRight = chatRect.width + 'px');
              }
          }
        };

        const applyLayout = (layout: 'sidebar' | 'chat' | 'none') => {
          switch (layout) {
            case 'sidebar':
              setSidebarCollapsed(false);
              closeChat();
              setTimeout(adjustOffsets, 300);
              break;
            case 'chat':
              setSidebarCollapsed(true);
              openChat();
              setTimeout(adjustOffsets, 300);
              break;
            case 'none':
              setSidebarCollapsed(true);
              closeChat();
              setTimeout(adjustOffsets, 300);
              break;
          }
        };

        // Update offsets whenever chat widget or sidebar drawer changes automatically
        const layoutObserver = new MutationObserver(adjustOffsets);
        const chatEl = document.querySelector('react-chat-widget');
        if (chatEl) layoutObserver.observe(chatEl, { attributes: true, attributeFilter: ['data-open'] });
        const controlDrawer = document.querySelector('control-ui');
        if (controlDrawer) layoutObserver.observe(controlDrawer, { attributes: true, attributeFilter: ['is-panel-collapsed'] });

        // Utility to create a single layout button
        const addLayoutBtn = (
          id: string,
          icon: string,
          tooltip: string,
          layout: 'sidebar' | 'chat' | 'none'
        ) => {
          if (document.getElementById(id)) return; // avoid duplicates
          const btn = document.createElement('button');
          btn.id = id;
          btn.innerHTML = `<span class="material-symbols-outlined" style="color:#000000;font-size:18px;">${icon}</span>`;
          btn.title = tooltip;
          btn.style.cssText = `
            background-color: #FFFFFF;
            color: #000000;
            border: none;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
          `;
          btn.onclick = () => applyLayout(layout);
          layoutContainer!.appendChild(btn);
        };

        // Create the three layout buttons
        addLayoutBtn('layout-sidebar-btn', 'view_sidebar', 'Sidebar Layout', 'sidebar');
        addLayoutBtn('layout-chat-btn', 'chat', 'Chat Layout', 'chat');
        addLayoutBtn('layout-none-btn', 'close_fullscreen', 'Clean Layout', 'none');

        // Function to check if widgets are open and hide/show publish button
        const updatePublishButtonVisibility = () => {
          const chatWidget = document.querySelector('react-chat-widget[data-open="true"]');
          const flowWidget = document.querySelector('react-flow-widget[data-open="true"]');

          if (chatWidget || flowWidget) {
            publishButton.style.opacity = '0';
            publishButton.style.pointerEvents = 'none';
          } else {
            publishButton.style.opacity = '1';
            publishButton.style.pointerEvents = 'auto';
          }
        };

        // Listen for widget state changes
        const observer = new MutationObserver(updatePublishButtonVisibility);

        // Observe chat widget
        const chatWidget = document.querySelector('react-chat-widget');
        if (chatWidget) {
          observer.observe(chatWidget, { attributes: true, attributeFilter: ['data-open'] });
        }

        // Observe flow widget
        const flowWidget = document.querySelector('react-flow-widget');
        if (flowWidget) {
          observer.observe(flowWidget, { attributes: true, attributeFilter: ['data-open'] });
        }

        // Initial check
        updatePublishButtonVisibility();
      }
    }, 1000);

    return this;
  }

  _handleClick() {
    this.uiState.updateVertical(this.resize.vertical.bottom + 2);
  }

    _handlePublishClick() {
    console.log('Publish button clicked!');
    alert('Publish button clicked!');
  }

  render() {
    return html`
      <asset-upload-drop></asset-upload-drop>
      <tutorial-group>
        <tutorial-popover
          tutorial-idx="1"
          tutorial-title="test"
          tutorial-message="fsdf"
          target-element-id="split_col_1"
        ></tutorial-popover>
      </tutorial-group>

      <div class="top-bar d-flex justify-content-between align-items-center">
        <b>${this.topBarTitle}</b>
      </div>

      <body class="h-100 bg-dark">
        <div id="app">
        
        </div>

        <div class="d-flex col justify-content-start">
          <div
            style="height: 97vh;padding-left: var(--bs-gutter-x,.75rem);width: 100%;"
          >
            <control-ui
              id="split_top"
              class="row align-items-start"
              style="height: ${this.resize.vertical.top}%; background: linear-gradient(180deg, rgba(17, 18, 21, 0) 0%, rgba(50, 53, 62, 0.2) 100%);"
            ></control-ui>
            <timeline-ui
              id="split_bottom"
              class="row position-relative split-top align-items-end bg-darker line-top"
              style="height: ${this.resize.vertical.bottom}%;"
            ></timeline-ui>
          </div>
        </div>

        <offcanvas-list-ui></offcanvas-list-ui>
        <modal-list-ui></modal-list-ui>
        <toast-list-ui></toast-list-ui>

        <div id="menuRightClick"></div>
        <style id="fontStyles" ref="fontStyles"></style>

        <toast-box></toast-box>

        <warning-demo></warning-demo>
      </body>
    `;
  }
}
