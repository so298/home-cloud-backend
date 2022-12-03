const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

const deviceJsonPath = "data/device.json";
let deviceData = JSON.parse(fs.readFileSync(deviceJsonPath, "utf-8"));

const server = app.listen(4000, () => {
  const addr = server.address();
  console.info(`Server listening on ${addr.address}:${addr.port}`);
});

console.info("### registered devices ###");
console.info(deviceData);

// returns devices info
app.get("/devices", (req, res, next) => {
  console.info(`[get]: /devices`);
  res.json(deviceData);
});

// reload device.json
app.post("/devices/reload", (req, res, next) => {
  console.info("[post]: /devices/reload reload devices");
  deviceData = JSON.parse(fs.readFileSync(deviceJsonPath, "utf-8"));
  res.status(200).json(deviceData);
});

// call wake on lan command
app.post("/devices/wol/", (req, res, next) => {
  console.info(`[post]: /devices/wol/`);
  console.info(req.body);
  const reqDevice = req.body;
  if (reqDevice.mac == undefined) {
    res.status(404).json({ status: "Device mac is undefined" });
  }

  for (device of deviceData) {
    if (device.mac == reqDevice.mac) {
      // TODO: change command to wol
      exec(`echo ${reqDevice.mac}`, (err, stdout, stderr) => {
        if (err) {
          res
            .status(404)
            .json({ status: "Exec command failed", stdout, stderr, err });
          return;
        }
        res.status(200).json({ status: "Success wol", stdout, stderr, err });
      });
      return;
    }
  }
  res.status(404).json({ status: "Invalid mac address" });
});
