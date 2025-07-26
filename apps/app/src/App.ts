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
        <div id="app"></div>

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
