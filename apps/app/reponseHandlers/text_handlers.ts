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

        // Calculate animation parameters
        const width = handleNull(data?.width) ?? 1000;
        const locationX = handleNull(data?.locationX) ?? 800;
        const locationY = handleNull(data?.locationY) ?? 600;

        elementControlComponent.addCustomText({
            path: data?.font?.path ?? "default",
            name: data?.font?.name ??"notosanskr",
            text: handleNull(data?.text) ?? "Hello Quartz!",
            textcolor: handleNull(data?.textColor) ?? "#ffffff",
            fontsize: handleNull(data?.fontsize) ?? 64,
            locationX: locationX,
            locationY: locationY,
            width: width,
            height: handleNull(data?.height) ?? 600,
            startTime: handleNull(data?.startTime) ?? 0,
            duration: handleNull(data?.duration) ?? 3000,
            dataAlign: handleNull(data?.dataAlign) ?? "center",
            backgroundEnable: typeof data?.backgroundEnable === 'boolean' ? data.backgroundEnable : true,
            fontweight: handleNull(data?.fontweight) ?? "medium",
            isBold: handleNull(data?.isBold) ?? false,
            optionsAlign: handleNull(data?.optionsAlign) ?? "left",
            animation:{
                position: {
                  isActivate: false,
                  x: [],
                  y: [],
                  ax: [[], []],
                  ay: [[], []],
                },
                opacity: {
                  isActivate: false,
                  x: [],
                  ax: [[], []],
                },
                scale: {
                  isActivate: false,
                  x: [],
                  ax: [[], []],
                },
                rotation: {
                  isActivate: false,
                  x: [],
                  ax: [[], []],
                },
              },
        });

        console.log("Text element added successfully with data:", data);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  