import { addTextElement } from "./text_handlers";
import { addShapeElement } from "./shape_handlers";

// Helper function to convert "NULL" to null
const handleNull = (value: any) => value === "NULL" ? null : value;

export function addSlideElement(params: any): boolean {
    try {
        let startTime = 0;
        // First create the background shape
        if(params?.position == "begin"){
            startTime = 0
        }
        else if (params.position == "end"){
            startTime = 0 // TODO get from the timeline information!
        }
        else{
            startTime = 0 // TODO get from timeline information!
        }
        const bgShapeParams = {
            locationX: handleNull(params?.locationX) ?? 0,
            locationY: handleNull(params?.locationY) ?? 0,
            width: handleNull(params?.width) ?? 1920, // Full screen width
            height: handleNull(params?.height) ?? 1080, // Full screen height
            fillColor: handleNull(params?.bgColor) ?? "#ffffff",
            startTime: startTime,
            duration: handleNull(params?.duration) ?? 3000,
            shape: "rectangle"
        };

        const shapeSuccess = addShapeElement(bgShapeParams);
        if (!shapeSuccess) {
            console.error("Failed to create background shape");
            return false;
        }

        // Calculate text box dimensions
        const textWidth = 1600;
        const textHeight = 200;

        // Calculate center position (subtract half of text box dimensions from screen center)
        const centerX = (1920 - textWidth) / 2;
        const centerY = (1080 - textHeight) / 2;

        // Then create the text element
        const textParams = {
            text: handleNull(params?.text) ?? "Welcome to the Hack!",
            textColor: handleNull(params?.textColor) ?? "#2A2AEA",
            fontsize: 110,
            locationX: centerX,
            locationY: centerY,
            width: textWidth,
            height: textHeight,
            startTime: handleNull(params?.startTime) ?? 0,
            duration: handleNull(params?.duration) ?? 3000,
            dataAlign: handleNull(params?.dataAlign) ?? "center",
            backgroundEnable: false, 
            fontname:"calibri",
            optionsAlign:"center",
            isBold:true,
        };

        const textSuccess = addTextElement(textParams);
        if (!textSuccess) {
            console.error("Failed to create text element");
            return false;
        }

        console.log("Slide created successfully:", params);
        return true;
    } catch (error) {
        console.error("Error creating slide:", error);
        return false;
    }
}
  