const path = {
  encode: function (uri) {
    return uri.replaceAll("#", "%23");
  },
};

export { path };
