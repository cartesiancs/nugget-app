// Helper function to convert "NULL" to null
const handleNull = (value: any) => value === "NULL" ? null : value;

export function addTextElement(data: any): boolean {
    try {
        // Wait for DOM to be ready
        const elementControlComponent = document.querySelector("element-control") as any;
        
        if (!elementControlComponent) {
            console.error("Element control component not found. Make sure the component is loaded first.");
            return false;
        }
        elementControlComponent.addText({
            text: handleNull(data?.text) ?? "Hello Quartz!",
            textcolor: handleNull(data?.textColor) ?? "#000000",
            fontsize: handleNull(data?.fontsize) ?? 64,
            locationX: handleNull(data?.locationX) ?? 100,
            locationY: handleNull(data?.locationY) ?? 150,
            width: handleNull(data?.width) ?? 600,
            height: handleNull(data?.height) ?? 600,
            startTime: handleNull(data?.startTime) ?? 0,
            duration: handleNull(data?.duration) ?? 3000,
            dataAlign: handleNull(data?.dataAlign) ?? "center",
            backgroundEnable: typeof data?.backgroundEnable === 'boolean' ? data.backgroundEnable : true,
            fontname:handleNull(data?.fontname) ?? "notosanskr",
            fontweight:handleNull(data?.fontweight) ??"medium",
            isBold:handleNull(data?.isBold) ??false,
            optionsAlign:handleNull(data?.optionsAlign) ?? "left"
        });
      
        console.log("Text element added successfully with data:", data);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  