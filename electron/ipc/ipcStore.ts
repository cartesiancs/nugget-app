import Store from "electron-store";
const store = new Store();

export const ipcStore = {
  set: async (event, key, value) => {
    store.set(key, value);
    return { status: 1 };
  },

  get: async (event, key) => {
    let value = store.get(key);
    if (value == undefined) {
      return { status: 0 };
    }
    return { status: 1, value: value };
  },

  delete: async (event, key) => {
    store.delete(key);
    return { status: 1 };
  },
};
