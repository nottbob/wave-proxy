import fetch from "node-fetch";
import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  if (req.url === "/waves") {
    try {
      const url =
        "https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_multi.pl?" +
        "file=multi_1.at_10m.t00z.grib2" +
        "&lev_surface=on" +
        "&var_HTSGW=on" +
        "&subregion=&leftlon=262.8&rightlon=262.9&toplat=26.15&bottomlat=26.05" +
        "&dir=%2Fmulti_1";

      const r = await fetch(url);
      if (!r.ok) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "WW3 fetch failed", code: r.status })
        );
      }

      const buf = await r.arrayBuffer();
      const dv = new DataView(buf);

      let waveM = null;

      // Scan floats for a realistic value
      for (let i = 0; i < dv.byteLength - 4; i += 4) {
        const v = dv.getFloat32(i, false);
        if (v > 0 && v < 20) {
          waveM = v;
          break;
        }
      }

      const waveFt =
        waveM !== null ? Number((waveM * 3.28084).toFixed(1)) : null;

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ waveFt }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Wave proxy running on port ${PORT}`);
});
