const fonts = {
  get: async function () {
    window.electronAPI.req.font.getLists().then((result) => {
      if (result.status == 0) {
        return 0;
      }

      console.log(result);
    });
  },
};

export default fonts;
