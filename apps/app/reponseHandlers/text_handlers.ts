export function addTextElement(data: any): boolean {
    try {
        // Wait for DOM to be ready
        const elementControlComponent = document.querySelector("element-control") as any;
        
        if (!elementControlComponent) {
            console.error("Element control component not found. Make sure the component is loaded first.");
            return false;
        }
        
        // Validate required data
        if (!data?.text) {
            console.error("Text content is required");
            return false;
        }

        // Add the text element with the provided data
        elementControlComponent.addText({
            text: data.text,
            textcolor: data?.textcolor || "#ff6b6b",
            fontsize: data?.fontsize || 64,
            locationX: data?.locationX || 100,
            locationY: data?.locationY || 150,
            width: data?.width || 600,
            height: data?.height || 80,
            startTime: data?.startTime || 0,
            duration: data?.duration || 3000,
            dataAlign: data?.dataAlign || "center",
            backgroundEnable: typeof data?.backgroundEnable === 'boolean' ? data.backgroundEnable : true
        });
      
        console.log("Text element added successfully with data:", data);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  