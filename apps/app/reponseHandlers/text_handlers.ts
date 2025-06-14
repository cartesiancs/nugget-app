export function addTextElement(options: any): boolean {
    try {
        // Wait for DOM to be ready
        const elementControlComponent = document.querySelector("element-control") as any;
        
        if (!elementControlComponent) {
            console.error("Element control component not found. Make sure the component is loaded first.");
            return false;
        }
        
        // Validate required options
        if (!options?.text) {
            console.error("Text content is required");
            return false;
        }

        // Add the text element with the provided options
        elementControlComponent.addText({
            text: options.text,
            textcolor: options?.textcolor || "#ff6b6b",
            fontsize: options?.fontsize || 64,
            locationX: options?.locationX || 100,
            locationY: options?.locationY || 150,
            width: options?.width || 600,
            height: options?.height || 80,
            startTime: options?.startTime || 0,
            duration: options?.duration || 3000,
            optionsAlign: options?.optionsAlign || "center",
            backgroundEnable: typeof options?.backgroundEnable === 'boolean' ? options.backgroundEnable : true
        });
      
        console.log("Text element added successfully with options:", options);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  