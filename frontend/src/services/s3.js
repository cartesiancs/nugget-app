export const s3Api = {
  downloadImage: async (s3Key) => {
    try {
      // Construct CloudFront URL directly from S3 key
      const cloudfrontUrl = `https://ds0fghatf06yb.cloudfront.net/${s3Key}`;

      console.log("Image CloudFront URL:", cloudfrontUrl);
      return cloudfrontUrl;
    } catch (error) {
      console.error("Error in downloadImage:", error);
      throw error;
    }
  },

  downloadVideo: async (s3Key) => {
    try {
      // Construct CloudFront URL directly from S3 key
      const cloudfrontUrl = `https://ds0fghatf06yb.cloudfront.net/${s3Key}`;

      console.log("Video CloudFront URL:", cloudfrontUrl);
      return cloudfrontUrl;
    } catch (error) {
      console.error("Error in downloadVideo:", error);
      throw error;
    }
  },
};
