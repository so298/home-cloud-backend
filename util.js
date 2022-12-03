const fs = require("fs");

const loadDeviceData = (path) => {
  const rawData = JSON.parse(fs.readFileSync(path, "utf-8"));
  return rawData.map((elem, idx) => ({ id: idx + 1, status: "down", ...elem }));
};

module.exports = {
  loadDeviceData,
};
