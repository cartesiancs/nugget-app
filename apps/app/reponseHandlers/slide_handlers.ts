export function addSlideElement(data: any): boolean {
    try {
        // Wait for DOM to be ready
        const elementControlComponent = document.querySelector("element-control") as any;
        
        if (!elementControlComponent) {
            console.error("Element control component not found. Make sure the component is loaded first.");
            return false;
        }
        console.log("data",data)
        elementControlComponent.addSlideElement({
            text: data?.text || "Hello Quartz!",
            position: data?.position || "current", // begin, current (default),end
            bgColor: data?.bgcolor || "#ff0000",
            duration: data?.duration || 3000,
            animation: data?.animation || "True" //  True and False
        });
      
        console.log("Text element added successfully with data:", data);
        return true;
    } catch (error) {
        console.error("Error adding text element:", error);
        return false;
    }
}
  