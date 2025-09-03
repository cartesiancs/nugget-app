import { useState, useCallback } from "react";
import { useProjectStore } from "../store/useProjectStore";
import {
  getTextCreditCost,
  getImageCreditCost,
  getVideoCreditCost,
  formatCreditDeduction,
} from "../lib/pricing";

export const useCreditManagement = (user) => {
  const { fetchBalance } = useProjectStore();
  
  // Credit deduction notification state
  const [creditDeductionMessage, setCreditDeductionMessage] = useState(null);

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = useCallback(
    (serviceName, model = null, count = 1) => {
      let credits = 0;
      let message = "";
      let additionalInfo = "";

      switch (serviceName) {
        case "Web Info Processing":
          credits = getTextCreditCost("web-info");
          message = formatCreditDeduction("Web Info Processing", credits);
          break;
        case "Concept Generation":
          credits = getTextCreditCost("concept generator");
          message = formatCreditDeduction("Concept Generation", credits);
          break;
        case "Script Generation":
          credits = getTextCreditCost("script & segmentation") * count;
          additionalInfo = count > 1 ? `${count} scripts` : "1 script";
          message = formatCreditDeduction(
            "Script Generation",
            credits,
            additionalInfo,
          );
          break;
        case "Image Generation":
          if (model) {
            credits = getImageCreditCost(model) * count;
            additionalInfo = `${count} image${
              count !== 1 ? "s" : ""
            } using ${model}`;
            message = formatCreditDeduction(
              "Image Generation",
              credits,
              additionalInfo,
            );
          } else {
            credits = getImageCreditCost("imagen") * count; // default to imagen
            additionalInfo = `${count} image${count !== 1 ? "s" : ""}`;
            message = formatCreditDeduction(
              "Image Generation",
              credits,
              additionalInfo,
            );
          }
          break;
        case "Video Generation":
          if (model) {
            credits = getVideoCreditCost(model, 5) * count; // 5 seconds default
            additionalInfo = `${count} video${
              count !== 1 ? "s" : ""
            } using ${model} (5s each)`;
            message = formatCreditDeduction(
              "Video Generation",
              credits,
              additionalInfo,
            );
          } else {
            credits = getVideoCreditCost("veo2", 5) * count; // default to veo2
            additionalInfo = `${count} video${
              count !== 1 ? "s" : ""
            } (5s each)`;
            message = formatCreditDeduction(
              "Video Generation",
              credits,
              additionalInfo,
            );
          }
          break;
        case "Concept Writer Process":
          // This is a combined operation
          credits =
            getTextCreditCost("web-info") +
            getTextCreditCost("concept generator");
          additionalInfo = "Web research + 4 concepts";
          message = formatCreditDeduction(
            "Concept Writer Process",
            credits,
            additionalInfo,
          );
          break;
        default:
          message = `${credits} credit${
            credits !== 1 ? "s" : ""
          } deducted for ${serviceName}`;
      }

      setCreditDeductionMessage(message);
      setTimeout(() => setCreditDeductionMessage(null), 5000); // Clear after 5 seconds

      // Refresh balance immediately and also with a slight delay to ensure backend processing is complete
      if (user?.id) {
        fetchBalance(user.id);
        // Also refresh after a short delay to ensure any backend processing is complete
        setTimeout(() => {
          fetchBalance(user.id);
        }, 1000);
      }
    },
    [user?.id, fetchBalance],
  );

  // Helper function to show request failure message
  const showRequestFailed = useCallback((serviceName = null) => {
    const message = serviceName
      ? `${serviceName} request failed`
      : "Request failed";
    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000);
  }, []);

  return {
    // States
    creditDeductionMessage,

    // Actions
    showCreditDeduction,
    showRequestFailed,
  };
};
