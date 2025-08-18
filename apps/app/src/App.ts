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
      const existingButton = document.getElementById("publish-button");
      if (!existingButton) {
        const publishButton = document.createElement("button");
        publishButton.id = "publish-button";
        publishButton.innerHTML = `
          <span class="material-symbols-outlined" style="color:#F9D312; margin-right: 5px; font-size: 18px;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6668 13.3332H3.3335M4.00016 6.55344C5.0372 5.15117 6.24868 3.89173 7.60395 2.80619C7.72021 2.71306 7.86019 2.6665 8.00016 2.6665M12.0002 6.55344C10.9631 5.15117 9.75164 3.89173 8.39637 2.80619C8.28012 2.71306 8.14014 2.6665 8.00016 2.6665M8.00016 2.6665V10.6665" stroke="#F9D312" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</span>
          Publish
        `;
        publishButton.style.cssText = `
          position: fixed;
          top: 50px;
          right: 25px;
          background: #F9D31226;
          color: #F9D312;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          z-index: 10000;
          font-family: inherit;
          transition: opacity 0.3s ease;
          margin-top: 5px;
        `;
        publishButton.onclick = () => {
          console.log("Publish button clicked! Starting video export...");

          // Try to find and click the render button
          const renderButton = document.querySelector(
            'control-ui-render button[class*="btn-blue-fill"]',
          );
          if (renderButton) {
            console.log("Found render button, clicking it...");
            (renderButton as HTMLElement).click();
          } else {
            console.log("Render button not found, trying direct method...");
            // Try to find the control render component and call its method directly
            const controlRender = document.querySelector("control-ui-render");
            if (controlRender) {
              console.log("Found control render component");
              const component = controlRender as any;
              if (component.handleClickRenderV2Button) {
                console.log("Calling handleClickRenderV2Button...");
                component.handleClickRenderV2Button();
              } else if (component.requestHttpRender) {
                console.log("Calling requestHttpRender...");
                component.requestHttpRender();
              } else {
                console.log("No render methods found on component");
                alert("Render functionality not available");
              }
            } else {
              console.log("Control render component not found");
              alert("Render component not found");
            }
          }
        };
        document.body.appendChild(publishButton);

        /*** CHAT TOGGLE BUTTON ***/
        // Container to hold chat toggle button
        let chatToggleContainer = document.getElementById(
          "chat-toggle-container",
        ) as HTMLElement | null;
        if (!chatToggleContainer) {
          chatToggleContainer = document.createElement("div");
          chatToggleContainer.id = "chat-toggle-container";
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
        let actionBar = document.getElementById(
          "left-action-bar",
        ) as HTMLElement | null;
        if (!actionBar) {
          actionBar = document.createElement("div");
          actionBar.id = "left-action-bar";
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
            { name: "settings", tooltip: "Settings", target: "#nav-home" },
            { name: "draft", tooltip: "Assets", target: "#nav-draft" },
            { name: "text_fields", tooltip: "Text", target: "#nav-text" },
            { name: "library_books", tooltip: "Filter", target: "#nav-filter" },
            { name: "page_info", tooltip: "Utilities", target: "#nav-util" },
            { name: "extension", tooltip: "Options", target: "#nav-option" },
            { name: "output", tooltip: "Render", target: "#nav-output" },
          ];

          // Keep track of the currently active sidebar target and any pending timeouts.
          let currentSidebarTarget: string | null = null;
          let pendingSidebarTimeout: number | null = null;

          icons.forEach(({ name, tooltip, target }) => {
            const btn = document.createElement("button");
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
              btn.style.background = "rgba(255,255,255,0.1)";
              btn.style.borderColor = "rgba(255,255,255,0.2)";
              btn.style.transform = "scale(1.05)";
            };
            btn.onmouseleave = () => {
              btn.style.background = "rgba(255,255,255,0.05)";
              btn.style.borderColor = "rgba(255,255,255,0.1)";
              btn.style.transform = "scale(1)";
            };
            btn.onclick = () => {
              console.log(
                `Action bar button clicked: ${name}, target: ${target}`,
              );

              // Cancel any pending tab-activation timeout to avoid double execution
              if (pendingSidebarTimeout) {
                clearTimeout(pendingSidebarTimeout);
                pendingSidebarTimeout = null;
              }

              const panelElement = document.querySelector(
                "control-panel",
              ) as any;
              const panelOpen = panelElement && !panelElement.isPanelCollapsed;
              console.log("Panel state:", {
                panelElement,
                panelOpen,
                currentSidebarTarget,
              });

              // Toggle: if the same tab icon is clicked while panel is open, collapse it
              if (panelOpen && currentSidebarTarget === target) {
                console.log("Toggling panel closed");
                setSidebarCollapsed(true);
                currentSidebarTarget = null;
                applyNewLayout(false);
                return;
              }

              // Otherwise, make sure the panel is open and switch to the desired tab
              console.log("Opening panel and setting target tab");
              setSidebarCollapsed(false);
              currentSidebarTarget = target;
              applyNewLayout(true);

              // Update active state for action bar buttons
              document
                .querySelectorAll("#left-action-bar button")
                .forEach((b) => {
                  (b as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (b as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.1)";
                });
              btn.style.background = "rgba(74,144,226,0.3)";
              btn.style.borderColor = "rgba(74,144,226,0.6)";

              // Activate the corresponding (hidden) sidebar button after the slide animation
              pendingSidebarTimeout = window.setTimeout(() => {
                const targetBtn = document.querySelector(
                  `control-panel #sidebar button[data-bs-target="${target}"]`,
                ) as HTMLElement | null;
                console.log("Activating tab button:", targetBtn);
                targetBtn?.click();
                pendingSidebarTimeout = null;
              }, 350);
            };
            actionBar!.appendChild(btn);
          });
          document.body.appendChild(actionBar);

          // Ensure panel styling is applied
          const stylePanel = document.getElementById("panel-style");
          if (!stylePanel) {
            const st = document.createElement("style");
            st.id = "panel-style";
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
        document.body.classList.add("panel-closed");
        document.body.classList.add("right-panel-closed");

        // Helper functions to manipulate sidebar & chat states
        const setSidebarCollapsed = (collapsed: boolean) => {
          let panelElement = document.querySelector("control-panel") as any;

          // Update body class to control video sizing
          if (collapsed) {
            document.body.classList.remove("panel-open");
            document.body.classList.add("panel-closed");
          } else {
            document.body.classList.remove("panel-closed");
            document.body.classList.add("panel-open");
          }

          if (!panelElement && !collapsed) {
            // Create the panel element if it doesn't exist and we're opening it
            panelElement = document.createElement("control-panel");
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
            console.log("Control panel created and added to DOM");
          }

          if (panelElement) {
            panelElement.isPanelCollapsed = collapsed;
            if (panelElement.requestUpdate) panelElement.requestUpdate();

            // Remove panel from DOM when collapsed
            if (collapsed && panelElement.parentNode) {
              panelElement.remove();
              console.log("Control panel removed from DOM");
            }
          }
        };
        const openChat = () => {
          const chatEl = document.querySelector("react-chat-widget");
          if (chatEl) {
            const btn = chatEl.querySelector(
              'button[aria-label="Open chat"]',
            ) as HTMLElement;
            if (btn) btn.click();
          }
        };
        const closeChat = () => {
          const chatEl = document.querySelector("react-chat-widget");
          if (chatEl) {
            const btn = chatEl.querySelector(
              'button[aria-label="Close chat"]',
            ) as HTMLElement;
            if (btn) btn.click();
          }
        };

        // Right panel functions
        const setRightPanelCollapsed = (collapsed: boolean) => {
          let rightPanelElement = document.querySelector("right-panel") as any;

          // Update body class to control layout
          if (collapsed) {
            document.body.classList.remove("right-panel-open");
            document.body.classList.add("right-panel-closed");
          } else {
            document.body.classList.remove("right-panel-closed");
            document.body.classList.add("right-panel-open");
          }

          if (!rightPanelElement && !collapsed) {
            // Create the right panel element if it doesn't exist and we're opening it
            rightPanelElement = document.createElement("right-panel");
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
            console.log("Right panel created and added to DOM");
          }

          if (rightPanelElement) {
            rightPanelElement.isRightPanelCollapsed = collapsed;
            if (rightPanelElement.requestUpdate)
              rightPanelElement.requestUpdate();

            // Remove panel from DOM when collapsed
            if (collapsed && rightPanelElement.parentNode) {
              rightPanelElement.remove();
              console.log("Right panel removed from DOM");
            }
          }

          // Update the uiStore
          uiStore.getState().setRightPanelOpen(!collapsed);
        };

        const applyNewLayout = (panelVisible: boolean) => {
          const mainContainer = document.querySelector(
            ".d-flex.flex-column",
          ) as HTMLElement;
          const splitTop = document.getElementById("split_top") as HTMLElement;
          const splitBottom = document.getElementById(
            "split_bottom",
          ) as HTMLElement;

          if (panelVisible) {
            // Adjust main content to make room for the left panel (accounting for new panel positioning)
            if (splitTop) {
              splitTop.style.marginLeft = "calc(26% - 10px)";
              splitTop.style.width = "calc(74% + 10px)";
              splitTop.style.transition =
                "margin-left 0.3s ease, width 0.3s ease";
            }

            if (splitBottom) {
              splitBottom.style.marginLeft = "calc(26% - 10px)";
              splitBottom.style.width = "calc(74% + 10px)";
              splitBottom.style.transition =
                "margin-left 0.3s ease, width 0.3s ease";
            }
          } else {
            // Revert to original layout
            if (splitTop) {
              splitTop.style.marginLeft = "0";
              splitTop.style.width = "100%";
              splitTop.style.transition =
                "margin-left 0.3s ease, width 0.3s ease";
            }

            if (splitBottom) {
              splitBottom.style.marginLeft = "0";
              splitBottom.style.width = "100%";
              splitBottom.style.transition =
                "margin-left 0.3s ease, width 0.3s ease";
            }
          }
        };

        const applyRightLayout = (rightPanelVisible: boolean) => {
          const splitTop = document.getElementById("split_top") as HTMLElement;
          const splitBottom = document.getElementById(
            "split_bottom",
          ) as HTMLElement;

          if (rightPanelVisible) {
            // Adjust main content to make room for the right panel
            if (splitTop) {
              splitTop.style.marginRight = "30%";
              splitTop.style.width = "70%";
              splitTop.style.transition =
                "margin-right 0.3s ease, width 0.3s ease";
            }

            if (splitBottom) {
              splitBottom.style.marginRight = "30%";
              splitBottom.style.width = "70%";
              splitBottom.style.transition =
                "margin-right 0.3s ease, width 0.3s ease";
            }
          } else {
            // Revert to original layout
            if (splitTop) {
              splitTop.style.marginRight = "0";
              splitTop.style.width = "100%";
              splitTop.style.transition =
                "margin-right 0.3s ease, width 0.3s ease";
            }

            if (splitBottom) {
              splitBottom.style.marginRight = "0";
              splitBottom.style.width = "100%";
              splitBottom.style.transition =
                "margin-right 0.3s ease, width 0.3s ease";
            }
          }

          // Force timeline canvas to properly recalculate and redraw after layout change
          setTimeout(() => {
            console.log(
              "Forcing timeline canvas recalculation and redraw after right panel layout change...",
            );

            // Find the timeline canvas element
            const timelineCanvas = document.querySelector(
              "element-timeline-canvas",
            ) as any;
            if (timelineCanvas) {
              // Force canvas to recalculate its dimensions
              if (timelineCanvas.canvas) {
                const canvas = timelineCanvas.canvas;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                canvas.style.width = rect.width + "px";
                canvas.style.height = rect.height + "px";

                console.log(
                  "Canvas dimensions recalculated:",
                  rect.width,
                  "x",
                  rect.height,
                );
              }

              // Force timeline scroll state to refresh - this is crucial for coordinate calculations
              if (
                timelineCanvas.timelineState &&
                timelineCanvas.timelineState.scroll !== undefined
              ) {
                const currentScroll = timelineCanvas.timelineScroll || 0;
                console.log("Current timeline scroll:", currentScroll);

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
            window.dispatchEvent(new Event("resize"));

            // Double redraw with requestAnimationFrame to ensure it's processed
            requestAnimationFrame(() => {
              if (timelineCanvas && timelineCanvas.drawCanvas) {
                console.log("Second canvas redraw via requestAnimationFrame");
                timelineCanvas.drawCanvas();
              }
            });

            // Enhanced debug and fix for timeline clicks
            if (timelineCanvas && !timelineCanvas._debugClickAdded) {
              timelineCanvas._debugClickAdded = true;

              // COMPLETELY OVERRIDE the _handleMouseDown to prevent issues
              const originalHandleMouseDown =
                timelineCanvas._handleMouseDown?.bind(timelineCanvas);

              if (originalHandleMouseDown) {
                /* eslint-disable */
                // @ts-nocheck - This is a monkey patch override
                timelineCanvas._handleMouseDown = function (e: MouseEvent) {
                  console.log("INTERCEPTED _handleMouseDown");

                  // Prevent document click from interfering
                  e.stopPropagation();

                  const x = e.offsetX;
                  const y = e.offsetY;
                  const target = this.findTarget({ x: x, y: y });

                  console.log("Intercepted findTarget result:", target);
                  console.log(
                    "Timeline data available:",
                    Object.keys(this.timeline || {}),
                  );

                  // If we found a valid target, set it properly
                  if (target.targetId && target.targetId !== "") {
                    console.log("Setting targetId to:", target.targetId);
                    this.targetId = [target.targetId];
                    this.cursorType = target.cursorType;

                    // Call the original method but skip the problematic clearing logic
                    try {
                      // Set up the necessary state for the original method
                      this.timelineState.setCursorType("pointer");
                      this.firstClickPosition.x = e.offsetX;
                      this.firstClickPosition.y = e.offsetY;

                      // Initialize target properties
                      for (
                        let index = 0;
                        index < this.targetId.length;
                        index++
                      ) {
                        const elementId = this.targetId[index];
                        this.targetStartTime[elementId] =
                          this.timeline[elementId].startTime;
                        this.targetDuration[elementId] =
                          this.timeline[elementId].duration;
                        this.targetTrack[elementId] =
                          this.timeline[elementId].track ?? 0;

                        // Get element type (hardcoded check to avoid import issues)
                        let elementType =
                          this.timeline[elementId].filetype === "video" ||
                          this.timeline[elementId].filetype === "audio"
                            ? "dynamic"
                            : "static";
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
                      console.log(
                        "Successfully handled timeline click for:",
                        target.targetId,
                      );
                    } catch (error) {
                      console.error("Error in timeline click handler:", error);
                    }
                  } else {
                    console.log("No valid target found, clearing selection");
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
              timelineCanvas._handleDocumentClick = function (e: MouseEvent) {
                // Only clear targetId if clicking OUTSIDE the timeline canvas or if target is empty
                const target = e.target as HTMLElement;
                if (
                  target &&
                  target.id !== "elementTimelineCanvasRef" &&
                  !target.closest("element-timeline-canvas") &&
                  !target.closest("#elementTimelineCanvasRef")
                ) {
                  this.targetId = [];
                  this.drawCanvas();
                }
              }.bind(timelineCanvas);
              /* eslint-enable */
            }

            // Extreme fix: try to force a complete re-initialization of canvas event handling
            setTimeout(() => {
              if (timelineCanvas) {
                console.log("Forcing complete timeline canvas refresh...");

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
          const panelEl = document.querySelector(
            "control-panel",
          ) as HTMLElement | null;
          const panelOpen = panelEl && !panelEl.style.display?.includes("none");

          const timelineEl = document.querySelector(
            "timeline-ui",
          ) as HTMLElement;
          const topRow = document.getElementById(
            "split_top",
          ) as HTMLElement | null;
          const bottomRow = document.getElementById(
            "split_bottom",
          ) as HTMLElement | null;

          // Reset first
          if (timelineEl) {
            timelineEl.style.marginRight = "0";
          }

          if (panelOpen) {
            // Apply panel offset
            if (topRow) {
              topRow.style.marginLeft = "26%";
              topRow.style.width = "74%";
            }
            if (bottomRow) {
              bottomRow.style.marginLeft = "26%";
              bottomRow.style.width = "74%";
            }
          } else {
            // Reset panel offset
            if (topRow) {
              topRow.style.marginLeft = "0";
              topRow.style.width = "100%";
            }
            if (bottomRow) {
              bottomRow.style.marginLeft = "0";
              bottomRow.style.width = "100%";
            }
          }

          // Handle chat widget offset
          const chatWidgetOpen = document.querySelector(
            'react-chat-widget[data-open="true"]',
          );
          if (chatWidgetOpen) {
            const chatRect = (
              chatWidgetOpen as HTMLElement
            ).getBoundingClientRect();
            if (chatRect.width) {
              timelineEl &&
                (timelineEl.style.marginRight = chatRect.width + "px");
            }
          }
        };

        const applyLayout = (layout: "sidebar" | "chat" | "none") => {
          switch (layout) {
            case "sidebar":
              setSidebarCollapsed(false);
              closeChat();
              setTimeout(adjustOffsets, 300);
              break;
            case "chat":
              setSidebarCollapsed(true);
              openChat();
              setTimeout(adjustOffsets, 300);
              break;
            case "none":
              setSidebarCollapsed(true);
              closeChat();
              setTimeout(adjustOffsets, 300);
              break;
          }
        };

        // Update offsets whenever chat widget or sidebar drawer changes automatically
        const layoutObserver = new MutationObserver(adjustOffsets);
        const chatEl = document.querySelector("react-chat-widget");
        if (chatEl)
          layoutObserver.observe(chatEl, {
            attributes: true,
            attributeFilter: ["data-open"],
          });
        const controlDrawer = document.querySelector("control-ui");
        if (controlDrawer)
          layoutObserver.observe(controlDrawer, {
            attributes: true,
            attributeFilter: ["is-panel-collapsed"],
          });

        // Create chat toggle button
        const createChatToggleButton = () => {
          if (document.getElementById("chat-toggle-btn")) return; // avoid duplicates

          const btn = document.createElement("button");
          btn.id = "chat-toggle-btn";
          btn.title = "Open Chat";
          btn.style.cssText = `
            background-color: #191B1D;
            color: #ffffff;
            border: none;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            transition: background-color 0.2s ease;
          `;

          // SVGs for open and close states
          const openChatSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 9.6C0 6.23969 0 4.55953 0.653961 3.27606C1.2292 2.14708 2.14708 1.2292 3.27606 0.653961C4.55953 0 6.23969 0 9.6 0H18.4C21.7603 0 23.4405 0 24.7239 0.653961C25.8529 1.2292 26.7708 2.14708 27.346 3.27606C28 4.55953 28 6.23969 28 9.6V18.4C28 21.7603 28 23.4405 27.346 24.7239C26.7708 25.8529 25.8529 26.7708 24.7239 27.346C23.4405 28 21.7603 28 18.4 28H9.6C6.23969 28 4.55953 28 3.27606 27.346C2.14708 26.7708 1.2292 25.8529 0.653961 24.7239C0 23.4405 0 21.7603 0 18.4V9.6Z" fill="#94E7ED" fill-opacity="0.15"/>
<path d="M20.1734 5.7206C19.9524 5.6488 19.7144 5.6488 19.4934 5.7206C19.3166 5.77804 19.1921 5.87247 19.1186 5.93485C19.0575 5.9867 18.9953 6.04899 18.9522 6.09218L18.5922 6.45218C18.549 6.49531 18.4867 6.55752 18.4348 6.61861C18.3725 6.69208 18.278 6.81663 18.2206 6.9934C18.1488 7.21439 18.1488 7.45244 18.2206 7.67343C18.278 7.8502 18.3725 7.97475 18.4348 8.04822C18.4867 8.10932 18.549 8.17153 18.5922 8.21466L18.9522 8.57461C18.9953 8.6178 19.0575 8.68012 19.1186 8.73198C19.1921 8.79435 19.3166 8.88879 19.4934 8.94623C19.7144 9.01803 19.9524 9.01803 20.1734 8.94623C20.3502 8.88879 20.4748 8.79436 20.5482 8.73199C20.6093 8.68013 20.6715 8.61784 20.7146 8.57464L21.0746 8.21466C21.1178 8.17153 21.1802 8.10928 21.232 8.04822C21.2944 7.97475 21.3888 7.8502 21.4462 7.67343C21.518 7.45244 21.518 7.21439 21.4462 6.9934C21.3888 6.81662 21.2944 6.69208 21.232 6.61861C21.1801 6.55752 21.1178 6.4953 21.0746 6.45217L20.7146 6.0922C20.6715 6.049 20.6093 5.9867 20.5482 5.93484C20.4748 5.87247 20.3502 5.77804 20.1734 5.7206Z" fill="#94E7ED"/>
<path d="M13.0406 6.81167C12.5925 6.60174 12.0743 6.60174 11.6263 6.81167C11.2738 6.97682 11.0554 7.27177 10.9079 7.50359C10.7593 7.73722 10.6008 8.04508 10.4237 8.38936L9.41392 10.351C9.37832 10.4202 9.3607 10.4541 9.34712 10.4785L9.34616 10.4802L9.34449 10.4813C9.32087 10.4961 9.28783 10.5154 9.22057 10.5545L7.2016 11.7277C6.90191 11.9018 6.62927 12.0602 6.42112 12.2082C6.20926 12.3587 5.94953 12.5749 5.80202 12.9072C5.61091 13.3378 5.61091 13.8291 5.80202 14.2596C5.94953 14.5919 6.20926 14.8081 6.42112 14.9587C6.62926 15.1066 6.90189 15.265 7.20157 15.4391L9.22057 16.6124C9.28783 16.6514 9.32087 16.6708 9.34449 16.6856L9.34616 16.6866L9.34712 16.6883C9.3607 16.7127 9.37831 16.7467 9.41392 16.8158L10.4237 18.7775C10.6009 19.1218 10.7593 19.4296 10.9079 19.6632C11.0554 19.8951 11.2738 20.19 11.6263 20.3552C12.0743 20.5651 12.5925 20.5651 13.0406 20.3552C13.393 20.19 13.6115 19.8951 13.7589 19.6632C13.9075 19.4296 14.066 19.1217 14.2432 18.7775L15.2529 16.8158C15.2885 16.7467 15.3061 16.7127 15.3197 16.6883L15.3207 16.6866L15.3224 16.6856C15.346 16.6708 15.379 16.6514 15.4463 16.6124L17.4653 15.4391C17.7649 15.265 18.0376 15.1066 18.2457 14.9587C18.4576 14.8081 18.7173 14.5919 18.8648 14.2596C19.0559 13.8291 19.0559 13.3378 18.8648 12.9072C18.7173 12.5749 18.4576 12.3587 18.2457 12.2082C18.0376 12.0602 17.7649 11.9018 17.4652 11.7277L15.4463 10.5545C15.379 10.5154 15.346 10.4961 15.3224 10.4813L15.3207 10.4802L15.3197 10.4785C15.3061 10.4541 15.2885 10.4202 15.2529 10.351L14.2432 8.38935C14.066 8.04509 13.9075 7.73722 13.7589 7.50359C13.6115 7.27177 13.393 6.97682 13.0406 6.81167Z" fill="#94E7ED"/>
<path d="M20.312 16.594C20.0037 16.4688 19.6632 16.4688 19.3548 16.594C19.1301 16.6853 18.975 16.8319 18.876 16.937C18.7841 17.0345 18.6861 17.1571 18.5934 17.2729L17.899 18.141C17.8846 18.159 17.8694 18.1777 17.8538 18.1971C17.6927 18.3961 17.473 18.6675 17.3864 19.0008C17.3158 19.2724 17.3158 19.5611 17.3864 19.8326C17.473 20.166 17.6927 20.4374 17.8538 20.6364C17.8695 20.6558 17.8846 20.6745 17.899 20.6925L18.5934 21.5605C18.686 21.6763 18.7841 21.799 18.876 21.8965C18.975 22.0016 19.1301 22.1482 19.3548 22.2395C19.6632 22.3647 20.0037 22.3647 20.312 22.2395C20.5368 22.1482 20.6918 22.0016 20.7909 21.8965C20.8827 21.799 20.9808 21.6764 21.0734 21.5605L21.7679 20.6925C21.7822 20.6746 21.7972 20.656 21.8128 20.6368C21.9739 20.4377 22.1938 20.166 22.2805 19.8326C22.3511 19.5611 22.3511 19.2724 22.2805 19.0008C22.1938 18.6675 21.9742 18.3961 21.8131 18.1971C21.7974 18.1777 21.7823 18.159 21.7679 18.141L21.0734 17.273C20.9808 17.1572 20.8827 17.0344 20.7909 16.937C20.6918 16.8319 20.5368 16.6853 20.312 16.594Z" fill="#94E7ED"/>
</svg>`;

          const closeChatSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.1476 8.80306C11.5307 8.05886 11.7222 7.68676 11.9795 7.5662C12.2036 7.46123 12.4626 7.46123 12.6867 7.5662C12.944 7.68676 13.1355 8.05886 13.5186 8.80307L14.5117 10.7323C14.578 10.8612 14.6112 10.9257 14.6541 10.9826C14.6922 11.0332 14.736 11.0792 14.7845 11.1198C14.8392 11.1656 14.9019 11.202 15.0272 11.2749L17.0159 12.4305C17.6675 12.8091 17.9933 12.9985 18.1028 13.2452C18.1984 13.4605 18.1984 13.7062 18.1028 13.9214C17.9933 14.1682 17.6675 14.3575 17.0159 14.7362L15.0272 15.8918C14.9019 15.9646 14.8392 16.001 14.7845 16.0468C14.736 16.0875 14.6922 16.1335 14.6541 16.184C14.6112 16.241 14.578 16.3054 14.5117 16.4344L13.5186 18.3636C13.1355 19.1078 12.944 19.4799 12.6867 19.6005C12.4626 19.7054 12.2036 19.7054 11.9795 19.6005C11.7222 19.4799 11.5307 19.1078 11.1476 18.3636L10.1545 16.4344C10.0882 16.3054 10.055 16.241 10.012 16.184C9.97394 16.1335 9.9302 16.0875 9.88168 16.0468C9.82701 16.001 9.76432 15.9646 9.63894 15.8918L7.65029 14.7362C6.9987 14.3575 6.6729 14.1682 6.56336 13.9214C6.46781 13.7062 6.46781 13.4605 6.56336 13.2452C6.6729 12.9985 6.9987 12.8091 7.65029 12.4305L9.63894 11.2749C9.76432 11.202 9.82701 11.1656 9.88168 11.1198C9.9302 11.0792 9.97394 11.0332 10.012 10.9826C10.055 10.9257 10.0882 10.8612 10.1545 10.7323L11.1476 8.80306Z" stroke="white" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.5494 20.1718C18.3379 19.9075 18.2322 19.7753 18.1926 19.6229C18.1577 19.4889 18.1577 19.3445 18.1926 19.2104C18.2322 19.058 18.3379 18.9259 18.5494 18.6615L19.229 17.812C19.4404 17.5477 19.5462 17.4155 19.6681 17.366C19.7753 17.3224 19.8909 17.3224 19.9981 17.366C20.12 17.4155 20.2257 17.5477 20.4372 17.812L21.1168 18.6615C21.3283 18.9259 21.434 19.058 21.4736 19.2104C21.5085 19.3445 21.5085 19.4889 21.4736 19.6229C21.434 19.7753 21.3283 19.9075 21.1168 20.1718L20.4372 21.0213C20.2257 21.2857 20.12 21.4178 19.9981 21.4673C19.8909 21.5109 19.7753 21.5109 19.6681 21.4673C19.5462 21.4178 19.4404 21.2857 19.229 21.0213L18.5494 20.1718Z" stroke="white" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19.1912 7.63539C19.0855 7.52966 19.0326 7.47679 19.0128 7.41583C18.9954 7.36221 18.9954 7.30445 19.0128 7.25083C19.0326 7.18987 19.0855 7.13701 19.1912 7.03128L19.531 6.69147C19.6368 6.58574 19.6896 6.53287 19.7506 6.51307C19.8042 6.49564 19.862 6.49564 19.9156 6.51307C19.9766 6.53287 20.0294 6.58574 20.1351 6.69147L20.475 7.03128C20.5807 7.13701 20.6336 7.18987 20.6534 7.25083C20.6708 7.30445 20.6708 7.36221 20.6534 7.41583C20.6336 7.47679 20.5807 7.52966 20.475 7.63539L20.1351 7.9752C20.0294 8.08093 19.9766 8.13379 19.9156 8.1536C19.862 8.17102 19.8042 8.17102 19.7506 8.1536C19.6896 8.13379 19.6368 8.08093 19.531 7.9752L19.1912 7.63539Z" stroke="white" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

          const updateButtonState = () => {
            // Check if chat is open by looking for the chat widget's open state
            const chatWidget = document.querySelector("react-chat-widget");
            const isOpen =
              chatWidget && chatWidget.getAttribute("data-open") === "true";

            if (isOpen) {
              btn.style.backgroundColor = "#191B1D"; // Keep consistent dark background
              btn.innerHTML = openChatSVG; // Cyan/teal sparkle when chat is open
              btn.title = "Close Chat";
            } else {
              btn.style.backgroundColor = "#191B1D"; // Keep consistent dark background
              btn.innerHTML = closeChatSVG; // Grey outline when chat is closed
              btn.title = "Open Chat";
            }
          };

          btn.onclick = () => {
            console.log("Chat toggle button clicked");

            // Use the globally exposed functions from ChatWidget
            if (typeof window.toggleChat === "function") {
              setSidebarCollapsed(true); // Always close sidebar when opening chat
              window.toggleChat();
              console.log("Chat toggled via window.toggleChat");
            } else if (
              typeof window.openChat === "function" &&
              typeof window.closeChat === "function"
            ) {
              // Fallback: check current state and toggle manually
              const chatWidget = document.querySelector("react-chat-widget");
              const isOpen =
                chatWidget && chatWidget.getAttribute("data-open") === "true";

              setSidebarCollapsed(true); // Always close sidebar when opening chat

              if (isOpen) {
                window.closeChat();
                console.log("Chat closed via window.closeChat");
              } else {
                window.openChat();
                console.log("Chat opened via window.openChat");
              }
            } else {
              console.warn("Chat control functions not available on window");
              alert(
                "Chat functionality not available yet. Please wait for the page to fully load.",
              );
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
          const chatWidget = document.querySelector("react-chat-widget");
          if (chatWidget) {
            const observer = new MutationObserver(updateButtonState);
            observer.observe(chatWidget, {
              attributes: true,
              attributeFilter: ["data-open"],
            });
          }

          chatToggleContainer!.appendChild(btn);
        };

                // Create user profile button using React component
        const createUserProfileButton = () => {
          if (document.getElementById("user-profile-btn")) return; // avoid duplicates

          // Create container for the React component
          const container = document.createElement("div");
          container.id = "user-profile-btn";
          container.style.cssText = `
            display: flex;
            align-items: center;
          `;

          // Create the React component element
          const reactDropdown = document.createElement("react-user-profile-dropdown");
          console.log('Created React dropdown element:', reactDropdown);
          
          container.appendChild(reactDropdown);
          console.log('React dropdown appended to container');

          chatToggleContainer!.appendChild(container);
        };

        createUserProfileButton();
        createChatToggleButton();

        // Expose right panel functions globally for React components to use
        (window as any).toggleRightPanel = (isOpen: boolean) => {
          console.log("toggleRightPanel called with:", isOpen);
          setRightPanelCollapsed(!isOpen);
          applyRightLayout(isOpen);
        };

        (window as any).openRightPanel = () => {
          console.log("openRightPanel called");
          setRightPanelCollapsed(false);
          applyRightLayout(true);
        };

        (window as any).closeRightPanel = () => {
          console.log("closeRightPanel called");
          setRightPanelCollapsed(true);
          applyRightLayout(false);
        };

        // Function to check if widgets are open and hide/show publish button
        const updatePublishButtonVisibility = () => {
          const chatWidget = document.querySelector(
            'react-chat-widget[data-open="true"]',
          );
          const flowWidget = document.querySelector(
            'react-flow-widget[data-open="true"]',
          );

          if (chatWidget || flowWidget) {
            publishButton.style.opacity = "0";
            publishButton.style.pointerEvents = "none";
          } else {
            publishButton.style.opacity = "1";
            publishButton.style.pointerEvents = "auto";
          }
        };

        // Listen for widget state changes
        const observer = new MutationObserver(updatePublishButtonVisibility);

        // Observe chat widget
        const chatWidget = document.querySelector("react-chat-widget");
        if (chatWidget) {
          observer.observe(chatWidget, {
            attributes: true,
            attributeFilter: ["data-open"],
          });
        }

        // Observe flow widget
        const flowWidget = document.querySelector("react-flow-widget");
        if (flowWidget) {
          observer.observe(flowWidget, {
            attributes: true,
            attributeFilter: ["data-open"],
          });
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
    console.log("Publish button clicked!");
    alert("Publish button clicked!");
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
        html,
        body {
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

      <body
        class="h-100 w-100 bg-dark"
        style="margin: 0; padding: 0; overflow-x: hidden; width: 100vw !important;"
      >
        <div id="app"></div>

        <div
          class="d-flex flex-column"
          style="margin: 0; padding: 0; width: 100vw; height: 100vh;"
        >
          <div
            style="height: 97vh; width: 100vw; margin: 0; padding: 0;"
            class="d-flex flex-column"
          >
            <control-ui
              id="split_top"
              class="flex-grow-1 w-100"
              style="height: ${this.resize.vertical
                .top}%; background: linear-gradient(180deg, rgba(17, 18, 21, 0) 0%, rgba(50, 53, 62, 0.2) 100%);"
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
