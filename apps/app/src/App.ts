/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
// @ts-nocheck
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IUIStore, uiStore } from "./states/uiStore";
import "./features/demo/warningDemoEnv";
import "./ui/control/ControlPanel";
import "./ui/control/RightPanel";


@customElement("app-root")
export class App extends LitElement {
  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  topBarTitle = this.uiState.topBarTitle;

  @property()
  rightPanel = this.uiState.rightPanel;

  createRenderRoot() {
    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.topBarTitle = state.topBarTitle;
      this.rightPanel = state.rightPanel;
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

        /*** CHAT TOGGLE BUTTON ***/
        // Container to hold chat toggle button
        let chatToggleContainer = document.getElementById('chat-toggle-container') as HTMLElement | null;
        if (!chatToggleContainer) {
          chatToggleContainer = document.createElement('div');
          chatToggleContainer.id = 'chat-toggle-container';
          chatToggleContainer.style.cssText = `
            position: fixed;
            top: 50px;
            right: 130px; /* Keep a bit left to the publish button */
            display: flex;
            gap: 8px;
            margin-top: 1px;
            margin-right: 20px;
            z-index: 10000;
          `;
          document.body.appendChild(chatToggleContainer);
        }

        /*** VERTICAL ACTION BAR (persistent) ***/
        let actionBar = document.getElementById('left-action-bar') as HTMLElement | null;
        if (!actionBar) {
          actionBar = document.createElement('div');
          actionBar.id = 'left-action-bar';
          actionBar.style.cssText = `
            position: fixed;
            top: 37%;
            left: 8px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 8px;
            background: rgba(20,20,20,0.9);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
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
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 8px;
              cursor: pointer;
              padding: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              width: 44px;
              height: 44px;
            `;

            // Add hover effects
            btn.onmouseenter = () => {
              btn.style.background = 'rgba(255,255,255,0.1)';
              btn.style.borderColor = 'rgba(255,255,255,0.2)';
              btn.style.transform = 'scale(1.05)';
            };
            btn.onmouseleave = () => {
              btn.style.background = 'rgba(255,255,255,0.05)';
              btn.style.borderColor = 'rgba(255,255,255,0.1)';
              btn.style.transform = 'scale(1)';
            };
            btn.onclick = () => {
              console.log(`Action bar button clicked: ${name}, target: ${target}`);

              // Cancel any pending tab-activation timeout to avoid double execution
              if (pendingSidebarTimeout) {
                clearTimeout(pendingSidebarTimeout);
                pendingSidebarTimeout = null;
              }

              const panelElement = document.querySelector('control-panel') as any;
              const panelOpen = panelElement && !panelElement.isPanelCollapsed;
              console.log('Panel state:', { panelElement, panelOpen, currentSidebarTarget });

              // Toggle: if the same tab icon is clicked while panel is open, collapse it
              if (panelOpen && currentSidebarTarget === target) {
                console.log('Toggling panel closed');
                setSidebarCollapsed(true);
                currentSidebarTarget = null;
                applyNewLayout(false);
                return;
              }

              // Otherwise, make sure the panel is open and switch to the desired tab
              console.log('Opening panel and setting target tab');
              setSidebarCollapsed(false);
              currentSidebarTarget = target;
              applyNewLayout(true);

              // Update active state for action bar buttons
              document.querySelectorAll('#left-action-bar button').forEach(b => {
                (b as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                (b as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              });
              btn.style.background = 'rgba(74,144,226,0.3)';
              btn.style.borderColor = 'rgba(74,144,226,0.6)';

              // Activate the corresponding (hidden) sidebar button after the slide animation
              pendingSidebarTimeout = window.setTimeout(() => {
                const targetBtn = document.querySelector(
                  `control-panel #sidebar button[data-bs-target="${target}"]`
                ) as HTMLElement | null;
                console.log('Activating tab button:', targetBtn);
                targetBtn?.click();
                pendingSidebarTimeout = null;
              }, 350);
            };
            actionBar!.appendChild(btn);
          });
          document.body.appendChild(actionBar);

          // Ensure panel styling is applied
          const stylePanel = document.getElementById('panel-style');
          if (!stylePanel) {
            const st = document.createElement('style');
            st.id = 'panel-style';
            st.innerHTML = `
              control-panel #sidebar{display:none !important;}
              control-panel .tab-content{width:100% !important;}

              /* Enhanced video canvas 16:9 aspect ratio styling */
              #videobox {
                padding: 0 20px 20px 20px !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                position: relative !important;
              }

              /* Right panel layout styles */
              body.right-panel-open #split_top,
              body.right-panel-open #split_bottom {
                margin-right: 10% ;
                width: 70% !important;
                transition: margin-right 0.3s ease, width 0.3s ease !important;
              }

              body.right-panel-closed #split_top,
              body.right-panel-closed #split_bottom {
                margin-right: 0 !important;
                width: 100% !important;
                transition: margin-right 0.3s ease, width 0.3s ease !important;
              }

              /* Preview section responsive to right panel */
              body.right-panel-open #split_col_2 {
                width: 100% !important;
              }

              body.right-panel-open .video-container {
                transform: translateX(-50%) !important;
                max-width: 100% !important;
                width: 100% !important;
              }

              body.right-panel-open #videobox {
                width: 100% !important;
                max-width: 100% !important;
              }

              body.right-panel-open #video {
                max-width: 80% !important;
              }

              /* Timeline elements responsive to right panel */
              body.right-panel-open timeline-ui,
              body.right-panel-open element-timeline,
              body.right-panel-open element-timeline-canvas,
              body.right-panel-open element-timeline-ruler,
              body.right-panel-open element-timeline-bottom {
                width: 100% !important;
                max-width: 100% !important;
                pointer-events: auto !important;
                z-index: auto !important;
              }

              /* BOTH PANELS OPEN - compress timeline and center preview */
              body.panel-open.right-panel-open #split_top,
              body.panel-open.right-panel-open #split_bottom {
                margin-left: calc(26% - 10px) !important;
                margin-right: 30% !important;
                width: calc(54% + 10px) !important;
                transition: margin-left 0.3s ease, margin-right 0.3s ease, width 0.3s ease !important;
              }

              body.panel-open.right-panel-open .video-container {
                transform: translateX(-59%) !important;
                transition: transform 0.3s ease !important;
              }

              body.panel-open.right-panel-open #video {
                max-width: 85% !important;
              }



              #video {
                aspect-ratio: 16/9 !important;
                width: 600px !important;
                max-width: 70% !important;
                height: auto !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                border: 2px solid rgba(255,255,255,0.1) !important;
                border-radius: 20px !important;
                overflow: hidden !important;
                position: relative !important;
                margin: 0 auto !important;
                /* Ensure strict 16:9 ratio maintenance */
                min-width: 320px !important;
                min-height: 180px !important;
              }

              /* Remove size variations - keep consistent size */
              body.panel-closed #video {
                width: 600px !important;
                max-width: 70% !important;
                margin: 0 auto !important;
              }

              body.panel-open #video {
                width: 600px !important;
                max-width: 70% !important;
                margin: 0 auto !important;
              }

              preview-canvas {
                width: 100% !important;
                height: 100% !important;
                display: block !important;
                aspect-ratio: 16/9 !important;
              }

              /* Responsive adjustments - consistent smaller size */
              @media (max-width: 1200px) {
                #video {
                  width: 500px !important;
                  max-width: 65% !important;
                  margin: 0 auto !important;
                }
                body.panel-closed #video,
                body.panel-open #video {
                  width: 500px !important;
                  max-width: 65% !important;
                  margin: 0 auto !important;
                }
                #videobox {
                  justify-content: center !important;
                  align-items: center !important;
                }
              }

              @media (max-width: 900px) {
                #video {
                  width: 450px !important;
                  max-width: 60% !important;
                  margin: 0 auto !important;
                }
                body.panel-closed #video,
                body.panel-open #video {
                  width: 450px !important;
                  max-width: 60% !important;
                  margin: 0 auto !important;
                }
                #videobox {
                  padding: 15px !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
              }

              @media (max-width: 768px) {
                #video {
                  width: 80% !important;
                  max-width: 85% !important;
                  margin: 0 auto !important;
                }
                body.panel-closed #video,
                body.panel-open #video {
                  width: 80% !important;
                  max-width: 85% !important;
                  margin: 0 auto !important;
                }
                #videobox {
                  padding: 10px !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
              }

              @media (max-width: 480px) {
                #video {
                  width: 90% !important;
                  max-width: 95% !important;
                  margin: 0 auto !important;
                  min-width: 280px !important;
                  min-height: 157px !important;
                }
                body.panel-closed #video,
                body.panel-open #video {
                  width: 90% !important;
                  max-width: 95% !important;
                  margin: 0 auto !important;
                }
                #videobox {
                  padding: 8px !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
              }
            `;
            document.head.appendChild(st);
          }
        }

        // Initialize body class for panel state (default closed)
        document.body.classList.add('panel-closed');
        document.body.classList.add('right-panel-closed');

        // Helper functions to manipulate sidebar & chat states
        const setSidebarCollapsed = (collapsed: boolean) => {
          let panelElement = document.querySelector('control-panel') as any;

          // Update body class to control video sizing
          if (collapsed) {
            document.body.classList.remove('panel-open');
            document.body.classList.add('panel-closed');
          } else {
            document.body.classList.remove('panel-closed');
            document.body.classList.add('panel-open');
          }

          if (!panelElement && !collapsed) {
            // Create the panel element if it doesn't exist and we're opening it
            panelElement = document.createElement('control-panel');
            panelElement.isPanelCollapsed = false; // Set it to open state
            panelElement.style.cssText = `
              position: fixed;
              top: 50px;
              left: 70px;
              height: calc(100vh - 60px);
              width: calc(26% - 80px);
              z-index: 9999;
              pointer-events: auto;
              background: rgba(25,25,25,0.95);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.4);
              overflow: hidden;
            `;
            document.body.appendChild(panelElement);
            console.log('Control panel created and added to DOM');
          }

          if (panelElement) {
            panelElement.isPanelCollapsed = collapsed;
            if (panelElement.requestUpdate) panelElement.requestUpdate();

            // Remove panel from DOM when collapsed
            if (collapsed && panelElement.parentNode) {
              panelElement.remove();
              console.log('Control panel removed from DOM');
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

        // Right panel functions
        const setRightPanelCollapsed = (collapsed: boolean) => {
          let rightPanelElement = document.querySelector('right-panel') as any;

          // Update body class to control layout
          if (collapsed) {
            document.body.classList.remove('right-panel-open');
            document.body.classList.add('right-panel-closed');
          } else {
            document.body.classList.remove('right-panel-closed');
            document.body.classList.add('right-panel-open');
          }

          if (!rightPanelElement && !collapsed) {
            // Create the right panel element if it doesn't exist and we're opening it
            rightPanelElement = document.createElement('right-panel');
            rightPanelElement.isRightPanelCollapsed = false;
            rightPanelElement.style.cssText = `
              position: fixed;
              top: 100px;
              right: 0;
              height: calc(100vh - 100px);
              width: 30%;
              z-index: 10;
              pointer-events: auto;
              background: #000000;
              overflow: hidden;
            `;
            document.body.appendChild(rightPanelElement);
            console.log('Right panel created and added to DOM');
          }

          if (rightPanelElement) {
            rightPanelElement.isRightPanelCollapsed = collapsed;
            if (rightPanelElement.requestUpdate) rightPanelElement.requestUpdate();

            // Remove panel from DOM when collapsed
            if (collapsed && rightPanelElement.parentNode) {
              rightPanelElement.remove();
              console.log('Right panel removed from DOM');
            }
          }

          // Update the uiStore
          uiStore.getState().setRightPanelOpen(!collapsed);
        };

        const applyNewLayout = (panelVisible: boolean) => {
          const mainContainer = document.querySelector('.d-flex.flex-column') as HTMLElement;
          const splitTop = document.getElementById('split_top') as HTMLElement;
          const splitBottom = document.getElementById('split_bottom') as HTMLElement;

          if (panelVisible) {
            // Adjust main content to make room for the left panel (accounting for new panel positioning)
            if (splitTop) {
              splitTop.style.marginLeft = 'calc(26% - 10px)';
              splitTop.style.width = 'calc(74% + 10px)';
              splitTop.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
            }

            if (splitBottom) {
              splitBottom.style.marginLeft = 'calc(26% - 10px)';
              splitBottom.style.width = 'calc(74% + 10px)';
              splitBottom.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
            }
          } else {
            // Revert to original layout
            if (splitTop) {
              splitTop.style.marginLeft = '0';
              splitTop.style.width = '100%';
              splitTop.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
            }

            if (splitBottom) {
              splitBottom.style.marginLeft = '0';
              splitBottom.style.width = '100%';
              splitBottom.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
            }
          }
        };

        const applyRightLayout = (rightPanelVisible: boolean) => {
          const splitTop = document.getElementById('split_top') as HTMLElement;
          const splitBottom = document.getElementById('split_bottom') as HTMLElement;

          if (rightPanelVisible) {
            // Adjust main content to make room for the right panel
            if (splitTop) {
              splitTop.style.marginRight = '30%';
              splitTop.style.width = '70%';
              splitTop.style.transition = 'margin-right 0.3s ease, width 0.3s ease';
            }

            if (splitBottom) {
              splitBottom.style.marginRight = '30%';
              splitBottom.style.width = '70%';
              splitBottom.style.transition = 'margin-right 0.3s ease, width 0.3s ease';
            }
          } else {
            // Revert to original layout
            if (splitTop) {
              splitTop.style.marginRight = '0';
              splitTop.style.width = '100%';
              splitTop.style.transition = 'margin-right 0.3s ease, width 0.3s ease';
            }

            if (splitBottom) {
              splitBottom.style.marginRight = '0';
              splitBottom.style.width = '100%';
              splitBottom.style.transition = 'margin-right 0.3s ease, width 0.3s ease';
            }
          }

          // Force timeline canvas to properly recalculate and redraw after layout change
          setTimeout(() => {
            console.log('Forcing timeline canvas recalculation and redraw after right panel layout change...');
            
            // Find the timeline canvas element
            const timelineCanvas = document.querySelector('element-timeline-canvas') as any;
            if (timelineCanvas) {
              // Force canvas to recalculate its dimensions
              if (timelineCanvas.canvas) {
                const canvas = timelineCanvas.canvas;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                
                console.log('Canvas dimensions recalculated:', rect.width, 'x', rect.height);
              }

              // Force timeline scroll state to refresh - this is crucial for coordinate calculations
              if (timelineCanvas.timelineState && timelineCanvas.timelineState.scroll !== undefined) {
                const currentScroll = timelineCanvas.timelineScroll || 0;
                console.log('Current timeline scroll:', currentScroll);
                
                // Force the timeline scroll property to update
                timelineCanvas.timelineScroll = currentScroll;
                
                // Update the scroll in the store to trigger all subscriptions
                if (timelineCanvas.timelineState.setScroll) {
                  timelineCanvas.timelineState.setScroll(currentScroll);
                }
              }
              
              // Force redraw
              if (timelineCanvas.drawCanvas) {
                timelineCanvas.drawCanvas();
              }
              
              // Trigger requestUpdate to force LitElement to re-render
              if (timelineCanvas.requestUpdate) {
                timelineCanvas.requestUpdate();
              }
            }

            // Force window resize event to trigger other elements
            window.dispatchEvent(new Event('resize'));
            
            // Double redraw with requestAnimationFrame to ensure it's processed
            requestAnimationFrame(() => {
              if (timelineCanvas && timelineCanvas.drawCanvas) {
                console.log('Second canvas redraw via requestAnimationFrame');
                timelineCanvas.drawCanvas();
              }
            });

            // Enhanced debug and fix for timeline clicks
            if (timelineCanvas && !timelineCanvas._debugClickAdded) {
              timelineCanvas._debugClickAdded = true;
              
              // COMPLETELY OVERRIDE the _handleMouseDown to prevent issues
              const originalHandleMouseDown = timelineCanvas._handleMouseDown?.bind(timelineCanvas);
              
              if (originalHandleMouseDown) {
                /* eslint-disable */
                // @ts-nocheck - This is a monkey patch override
                timelineCanvas._handleMouseDown = function(e: MouseEvent) {
                  console.log('INTERCEPTED _handleMouseDown');
                  
                  // Prevent document click from interfering
                  e.stopPropagation();
                  
                  const x = e.offsetX;
                  const y = e.offsetY;
                  const target = this.findTarget({ x: x, y: y });
                  
                  console.log('Intercepted findTarget result:', target);
                  console.log('Timeline data available:', Object.keys(this.timeline || {}));
                  
                  // If we found a valid target, set it properly
                  if (target.targetId && target.targetId !== "") {
                    console.log('Setting targetId to:', target.targetId);
                    this.targetId = [target.targetId];
                    this.cursorType = target.cursorType;
                    
                    // Call the original method but skip the problematic clearing logic
                    try {
                      // Set up the necessary state for the original method
                      this.timelineState.setCursorType("pointer");
                      this.firstClickPosition.x = e.offsetX;
                      this.firstClickPosition.y = e.offsetY;
                      
                      // Initialize target properties
                      for (let index = 0; index < this.targetId.length; index++) {
                        const elementId = this.targetId[index];
                        this.targetStartTime[elementId] = this.timeline[elementId].startTime;
                        this.targetDuration[elementId] = this.timeline[elementId].duration;
                        this.targetTrack[elementId] = this.timeline[elementId].track ?? 0;
                        
                        // Get element type (hardcoded check to avoid import issues)
                        let elementType = this.timeline[elementId].filetype === 'video' || this.timeline[elementId].filetype === 'audio' ? 'dynamic' : 'static';
                        if (elementType == "dynamic") {
                          this.targetTrim[elementId] = {
                            startTime: this.timeline[elementId].trim.startTime,
                            endTime: this.timeline[elementId].trim.endTime,
                          };
                        }
                      }
                      
                      // CRITICAL: Enable drag mode and show side options
                      this.isDrag = true;
                      this.showSideOption(this.targetId[0]);
                      
                      // Update timeline state
                      this.timelineState.patchTimeline(this.timeline);
                      
                      // Force redraw to show selection
                      this.drawCanvas();
                      console.log('Successfully handled timeline click for:', target.targetId);
                      
                    } catch (error) {
                      console.error('Error in timeline click handler:', error);
                    }
                  } else {
                    console.log('No valid target found, clearing selection');
                    this.targetId = [];
                    this.drawCanvas();
                  }
                }.bind(timelineCanvas);
                /* eslint-enable */
              }
            }

            // CRITICAL FIX: Temporarily patch the problematic _handleDocumentClick function
            if (timelineCanvas && timelineCanvas._handleDocumentClick) {
              const originalDocumentClick = timelineCanvas._handleDocumentClick;
              
              // Replace with a safer version that doesn't clear targetId on canvas clicks
              /* eslint-disable */
              // @ts-nocheck - This is a monkey patch override
              timelineCanvas._handleDocumentClick = function(e: MouseEvent) {
                // Only clear targetId if clicking OUTSIDE the timeline canvas or if target is empty
                const target = e.target as HTMLElement;
                if (target && target.id !== "elementTimelineCanvasRef" && 
                    !target.closest('element-timeline-canvas') &&
                    !target.closest('#elementTimelineCanvasRef')) {
                  this.targetId = [];
                  this.drawCanvas();
                }
              }.bind(timelineCanvas);
              /* eslint-enable */
            }

            // Extreme fix: try to force a complete re-initialization of canvas event handling
            setTimeout(() => {
              if (timelineCanvas) {
                console.log('Forcing complete timeline canvas refresh...');
                
                // Force one more redraw
                if (timelineCanvas.drawCanvas) {
                  timelineCanvas.drawCanvas();
                }
              }
            }, 800);
          }, 400);
        };

        const adjustOffsets = () => {
          // Check if panel is open
          const panelEl = document.querySelector('control-panel') as HTMLElement | null;
          const panelOpen = panelEl && !panelEl.style.display?.includes('none');

          const timelineEl = document.querySelector('timeline-ui') as HTMLElement;
          const topRow = document.getElementById('split_top') as HTMLElement | null;
          const bottomRow = document.getElementById('split_bottom') as HTMLElement | null;

          // Reset first
          if (timelineEl) {
            timelineEl.style.marginRight = '0';
          }

          if (panelOpen) {
            // Apply panel offset
            if (topRow) {
              topRow.style.marginLeft = '26%';
              topRow.style.width = '74%';
            }
            if (bottomRow) {
              bottomRow.style.marginLeft = '26%';
              bottomRow.style.width = '74%';
            }
          } else {
            // Reset panel offset
            if (topRow) {
              topRow.style.marginLeft = '0';
              topRow.style.width = '100%';
            }
            if (bottomRow) {
              bottomRow.style.marginLeft = '0';
              bottomRow.style.width = '100%';
            }
          }

          // Handle chat widget offset
          const chatWidgetOpen = document.querySelector('react-chat-widget[data-open="true"]');
          if (chatWidgetOpen) {
            const chatRect = (chatWidgetOpen as HTMLElement).getBoundingClientRect();
            if (chatRect.width) {
              timelineEl && (timelineEl.style.marginRight = chatRect.width + 'px');
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

        // Create chat toggle button
        const createChatToggleButton = () => {
          if (document.getElementById('chat-toggle-btn')) return; // avoid duplicates
          
          const btn = document.createElement('button');
          btn.id = 'chat-toggle-btn';
          btn.innerHTML = `<span class="material-symbols-outlined" style="color:#000000;font-size:18px;">chat</span>`;
          btn.title = 'Open Chat';
          btn.style.cssText = `
            background-color: #FFFFFF;
            color: #000000;
            border: none;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            transition: background-color 0.2s ease;
          `;
          
          const updateButtonState = () => {
            // Check if chat is open by looking for the chat widget's open state
            const chatWidget = document.querySelector('react-chat-widget');
            const isOpen = chatWidget && chatWidget.getAttribute('data-open') === 'true';
            
            if (isOpen) {
              btn.style.backgroundColor = '#4CAF50'; // Green when chat is open
              btn.innerHTML = `<span class="material-symbols-outlined" style="color:#ffffff;font-size:18px;">close</span>`;
              btn.title = 'Close Chat';
            } else {
              btn.style.backgroundColor = '#FFFFFF';
              btn.innerHTML = `<span class="material-symbols-outlined" style="color:#000000;font-size:18px;">chat</span>`;
              btn.title = 'Open Chat';
            }
          };
          
          btn.onclick = () => {
            console.log('Chat toggle button clicked');
            
            // Use the globally exposed functions from ChatWidget
            if (typeof window.toggleChat === 'function') {
              setSidebarCollapsed(true); // Always close sidebar when opening chat
              window.toggleChat();
              console.log('Chat toggled via window.toggleChat');
            } else if (typeof window.openChat === 'function' && typeof window.closeChat === 'function') {
              // Fallback: check current state and toggle manually
              const chatWidget = document.querySelector('react-chat-widget');
              const isOpen = chatWidget && chatWidget.getAttribute('data-open') === 'true';
              
              setSidebarCollapsed(true); // Always close sidebar when opening chat
              
              if (isOpen) {
                window.closeChat();
                console.log('Chat closed via window.closeChat');
              } else {
                window.openChat();
                console.log('Chat opened via window.openChat');
              }
            } else {
              console.warn('Chat control functions not available on window');
              alert('Chat functionality not available yet. Please wait for the page to fully load.');
            }
            
            // Update button state after a short delay to allow React to update
            setTimeout(() => {
              updateButtonState();
              adjustOffsets();
            }, 100);
          };
          
          // Initial button state
          updateButtonState();
          
          // Watch for chat widget state changes and update button accordingly
          const chatWidget = document.querySelector('react-chat-widget');
          if (chatWidget) {
            const observer = new MutationObserver(updateButtonState);
            observer.observe(chatWidget, { attributes: true, attributeFilter: ['data-open'] });
          }
          
          chatToggleContainer!.appendChild(btn);
        };

        createChatToggleButton();
        
        // Create user profile button
        const createUserProfileButton = () => {
          if (document.getElementById('user-profile-btn')) return; // avoid duplicates
          
          const btn = document.createElement('button');
          btn.id = 'user-profile-btn';
          btn.title = 'User Profile';
          btn.style.cssText = `
            background-color: #FFFFFF;
            color: #000000;
            border: none;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            transition: background-color 0.2s ease;
            position: relative;
            display: flex;
            align-items: center;
            gap: 4px;
          `;
          
          let showUserMenu = false;
          let userMenuElement: HTMLElement | null = null;
          
          const updateProfileButton = () => {
            const authData = (window as any).getChatAuthData?.();
            
            if (!authData || !authData.isAuthenticated || !authData.user) {
              btn.style.display = 'none';
              return;
            }
            
            btn.style.display = 'flex';
            const user = authData.user;
            
            // Clear existing content
            btn.innerHTML = '';
            
            // Create avatar
            if (user.avatar) {
              const img = document.createElement('img');
              img.src = user.avatar;
              img.alt = 'Profile';
              img.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 1px solid #666;
              `;
              btn.appendChild(img);
            } else {
              const avatarDiv = document.createElement('div');
              avatarDiv.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #4CAF50;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
              `;
              avatarDiv.textContent = user.name?.charAt(0) || user.email?.charAt(0) || 'U';
              btn.appendChild(avatarDiv);
            }
            
            // Create dropdown arrow
            const arrow = document.createElement('span');
            arrow.innerHTML = '▼';
            arrow.style.cssText = `
              font-size: 8px;
              color: #666;
              transition: transform 0.2s ease;
            `;
            btn.appendChild(arrow);
          };
          
          const createUserMenu = () => {
            if (userMenuElement) return;
            
            const authData = (window as any).getChatAuthData?.();
            if (!authData || !authData.isAuthenticated || !authData.user) return;
            
            userMenuElement = document.createElement('div');
            userMenuElement.style.cssText = `
              position: absolute;
              top: 100%;
              right: 0;
              margin-top: 4px;
              width: 180px;
              background: rgba(0,0,0,0.95);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 8px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.4);
              z-index: 10002;
              overflow: hidden;
            `;
            
            // Prevent menu from closing when clicking inside it
            userMenuElement.onclick = (e) => {
              e.stopPropagation();
              console.log('Clicked inside user menu, preventing close');
            };
            
            // User info section
            const userInfo = document.createElement('div');
            userInfo.style.cssText = `
              padding: 12px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              color: white;
              font-size: 12px;
            `;
            userInfo.textContent = authData.user.name || authData.user.email;
            userMenuElement.appendChild(userInfo);
            
            // Sign out button
            const signOutBtn = document.createElement('button');
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.style.cssText = `
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: white;
              text-align: left;
              font-size: 12px;
              cursor: pointer;
              transition: background-color 0.2s ease;
            `;
            signOutBtn.onmouseenter = () => {
              signOutBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
            };
            signOutBtn.onmouseleave = () => {
              signOutBtn.style.backgroundColor = 'transparent';
            };
            signOutBtn.onclick = (e) => {
              e.stopPropagation();
              const authData = (window as any).getChatAuthData?.();
              if (authData && authData.logout) {
                authData.logout();
                hideUserMenu();
                updateProfileButton();
              }
            };
            userMenuElement.appendChild(signOutBtn);
            
            btn.appendChild(userMenuElement);
          };
          
          const showUserMenuFn = () => {
            if (showUserMenu) return;
            showUserMenu = true;
            createUserMenu();
            if (userMenuElement) {
              userMenuElement.style.display = 'block';
              // Rotate arrow
              const arrow = btn.querySelector('span');
              if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
          };
          
          const hideUserMenu = () => {
            if (!showUserMenu) return;
            showUserMenu = false;
            if (userMenuElement) {
              userMenuElement.remove();
              userMenuElement = null;
              // Reset arrow
              const arrow = btn.querySelector('span');
              if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
          };
          
          btn.onclick = (e) => {
            e.stopPropagation();
            console.log('Profile button clicked, current showUserMenu:', showUserMenu);
            if (showUserMenu) {
              hideUserMenu();
            } else {
              showUserMenuFn();
            }
          };
          
          // Close menu when clicking outside (but not on the button itself)
          document.addEventListener('click', (e) => {
            const target = e.target as Node;
            if (showUserMenu && !btn.contains(target) && !userMenuElement?.contains(target)) {
              console.log('Clicking outside profile menu, closing it');
              hideUserMenu();
            }
          });
          
          // Initial update
          updateProfileButton();
          
          // Watch for auth state changes
          const checkAuthState = () => {
            updateProfileButton();
          };
          
          // Check periodically for auth state changes
          setInterval(checkAuthState, 1000);
          
          chatToggleContainer!.appendChild(btn);
        };
        
        createUserProfileButton();

        // Expose right panel functions globally for React components to use
        (window as any).toggleRightPanel = (isOpen: boolean) => {
          console.log('toggleRightPanel called with:', isOpen);
          setRightPanelCollapsed(!isOpen);
          applyRightLayout(isOpen);
        };

        (window as any).openRightPanel = () => {
          console.log('openRightPanel called');
          setRightPanelCollapsed(false);
          applyRightLayout(true);
        };

        (window as any).closeRightPanel = () => {
          console.log('closeRightPanel called');
          setRightPanelCollapsed(true);
          applyRightLayout(false);
        };

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

      <style>
        html, body {
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        app-root {
          width: 100vw !important;
          height: 100vh !important;
          display: block !important;
        }
      </style>

      <body class="h-100 w-100 bg-dark" style="margin: 0; padding: 0; overflow-x: hidden; width: 100vw !important;">
        <div id="app">

        </div>

        <div class="d-flex flex-column" style="margin: 0; padding: 0; width: 100vw; height: 100vh;">
          <div
            style="height: 97vh; width: 100vw; margin: 0; padding: 0;"
            class="d-flex flex-column"
          >
            <control-ui
              id="split_top"
              class="flex-grow-1 w-100"
              style="height: ${this.resize.vertical.top}%; background: linear-gradient(180deg, rgba(17, 18, 21, 0) 0%, rgba(50, 53, 62, 0.2) 100%);"
            ></control-ui>
            <timeline-ui
              id="split_bottom"
              class="w-100 position-relative split-top align-items-end bg-darker line-top"
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
