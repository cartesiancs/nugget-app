export function addShapeElement(params: any): boolean {
    try {
        const PreviewCanvas = document.querySelector("preview-canvas") as any;
        
        if (!PreviewCanvas) {
            console.error("Preview canvas component not found");
            return false;
        }

        // Create the shape element with all parameters
        const elementId = PreviewCanvas.createShapeWithParams({
            x: params?.locationX || 960,
            y: params?.locationY || 540,
            width: params?.width || 800,
            height: params?.height || 800,
            fillColor: params?.fillColor || "#ffffff",
            startTime: params?.startTime || 0,
            duration: params?.duration || 3000,
            shape: params?.shape || "rectangle"
        });

        if (!elementId) {
            console.error("Failed to create shape element");
            return false;
        }

        console.log("Shape element added successfully:", params);
        return true;
    } catch (error) {
        console.error("Error adding shape element:", error);
        return false;
    }
}
  