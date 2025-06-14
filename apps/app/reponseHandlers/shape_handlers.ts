// Helper function to convert "NULL" to null
const handleNull = (value: any) => value === "NULL" ? null : value;

export function addShapeElement(params: any): boolean {
    try {
        const PreviewCanvas = document.querySelector("preview-canvas") as any;
        
        if (!PreviewCanvas) {
            console.error("Preview canvas component not found");
            return false;
        }

        // Create the shape element with all parameters
        const elementId = PreviewCanvas.createShapeWithParams({
            x: handleNull(params?.locationX) ?? 0,
            y: handleNull(params?.locationY) ?? 0,
            width: handleNull(params?.width) ?? 800,
            height: handleNull(params?.height) ?? 800,
            fillColor: handleNull(params?.fillColor) ?? "#ffffff",
            startTime: handleNull(params?.startTime) ?? 0,
            duration: handleNull(params?.duration) ?? 3000,
            shape: handleNull(params?.shape) ?? "rectangle"
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
  