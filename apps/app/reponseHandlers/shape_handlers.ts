export function addShapeElement(data: any): boolean {
    try {
        // Wait for DOM to be ready
        const PreviewCanvas = document.querySelector("preview-canvas") as any;
        
        if (!PreviewCanvas) {
            console.error("Element control component not found. Make sure the component is loaded first.");
            return false;
        }
        
        // add validation steps here

        // Add the text element with the provided data
        PreviewCanvas.createShape(1,1) // TODO
      
        console.log("Text element added successfully with data:", data);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  