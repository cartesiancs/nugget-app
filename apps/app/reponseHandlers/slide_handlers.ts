import { addTextElement } from "./text_handlers";
import { addShapeElement } from "./shape_handlers";
import { useTimelineStore } from "../src/states/timelineStore";
import { addImageSlide } from "./element_handlers";
import { projectStore } from "../src/states/projectStore";
// Helper function to convert "NULL" to null
const handleNull = (value: any) => value === "NULL" ? null : value;

export function addSlideElement(params: any): boolean {
    try {
        let startTime = 0;
        const timelineLatest = useTimelineStore.getState();
        const projectDir = projectStore.getState().nowDirectory;

        // First create the background shape
        if (params?.position === "begin") {
            startTime = 0;
        }
        else if (params?.position === "end") {
            // Get the end time of the last element in timeline
            const timeline = timelineLatest.timeline;
            const lastElementId = Object.keys(timeline).pop();
            if (lastElementId) {
                const lastElement = timeline[lastElementId];
                startTime = (lastElement.startTime + lastElement.duration);
            }
        }
        else {
            startTime = timelineLatest.cursor;
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
        // if(!handleNull(params?.bgColor)){
        //     const filename = `${projectDir}/assets/images/132.png` // get the path for this file from the asset folder
        //     addImageSlide(filename)
        // }
        // else{
        const shapeSuccess = addShapeElement(bgShapeParams);
        if (!shapeSuccess) {
            console.error("Failed to create background shape");
            return false;
        }
        // }
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
            fontsize: 120,
            locationX: centerX,
            locationY: centerY,
            width: textWidth,
            height: textHeight,
            startTime: startTime,
            duration: handleNull(params?.duration) ?? 3000,
            dataAlign: handleNull(params?.dataAlign) ?? "center",
            backgroundEnable: false,
            fontname: "calibri",
            optionsAlign: "center",
            isBold: true,
            font: {
                path: handleNull(params?.fontPath) ?? "default",
                name: handleNull(params?.fontName) ?? "calibri"
            }
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
