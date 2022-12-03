const express = require("express");
const bodyParser = require("body-parser");
const wol = require("wol");
const ping = require("ping");
const { loadDeviceData } = require("./util");

const app = express();
const apiRouter = express.Router();
app.use(bodyParser.json());

// load device data
const deviceJsonPath = process.env.DEVICE_JSON_PATH || "data/device.json";
let deviceData = loadDeviceData(deviceJsonPath);

// set get device data
const updateDeviceInterval = 5 * 1000;
const updateDeviceStatus = () => {
  const pingConfig = {
    timeout: 0.1,
  };
  deviceData.forEach((elem, idx) => {
    ping.sys.probe(
      elem.localip,
      (isAlive) => {
        if (isAlive) {
          deviceData[idx].status = "acitive";
        } else {
          deviceData[idx].status = "down";
        }
      },
      pingConfig
    );
  });
};
setInterval(() => {
  updateDeviceStatus();
}, updateDeviceInterval);

const server = app.listen(4000, () => {
  const addr = server.address();
  console.info(`Server listening on ${addr.address}:${addr.port}`);
});

console.info("### registered devices ###");
console.info(deviceData);

// returns devices info
apiRouter.get("/devices", (req, res, next) => {
  console.info(`[get]: /devices`);
  res.json(deviceData);
});

// reload device.json
apiRouter.post("/devices/reload", (req, res, next) => {
  console.info("[post]: /devices/reload reload devices");
  deviceData = loadDeviceData(deviceJsonPath);
  res.status(200).json(deviceData);
});

// call wake on lan command
apiRouter.post("/devices/wol/", (req, res, next) => {
  console.info(`[post]: /devices/wol/`);
  console.info(req.body);
  const reqDevice = req.body;
  if (reqDevice.mac == undefined) {
    res.status(404).json({ status: "Device mac is undefined" });
  }

  for (device of deviceData) {
    if (device.mac == reqDevice.mac) {
      wol.wake(reqDevice.mac, (err) => {
        if (err) {
          res.status(404).json({ status: "Exec command failed" });
          return;
        }
        res.status(200).json({ status: "Success wol" });
      });
      return;
    }
  }
  res.status(404).json({ status: "Invalid mac address" });
});

// configure routers
app.use("/api/", apiRouter);
app.use(express.static(__dirname + "/client_build"));
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/client_build/index.html");
});
