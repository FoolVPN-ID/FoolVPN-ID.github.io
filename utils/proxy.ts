import { getFlagEmoji } from "./string";

const vlessTemplate =
  "vless://fc60147e-76b8-4bc5-b691-90b2da79e3d2@172.67.73.39:443?encryption=none&type=ws&host=nautica.foolvpn.me&security=tls&sni=nautica.foolvpn.me&path=%2F172.232.239.151-587#1%20%F0%9F%87%AE%F0%9F%87%A9%20Akamai%20Connected%20Cloud%20WS%20TLS%20[nautica]";
const trojanTemplate =
  "trojan://86768774-70b2-4c15-80c3-02066fb1e3b6@172.67.73.39:443?encryption=none&type=ws&host=nautica.foolvpn.me&security=tls&sni=nautica.foolvpn.me&path=%2F35.219.50.99-443#1%20%F0%9F%87%AE%F0%9F%87%A9%20Google%20Cloud%20WS%20TLS%20[nautica]";
const ssTemplate =
  "ss://bm9uZTpkMDIzMmM1NS1kZjE0LTRjMzMtYTMxOS1jNGM1NTVmMmIwZjQ%3D@172.67.73.39:443?plugin=v2ray-plugin%3Btls%3Bmux%3D0%3Bmode%3Dwebsocket%3Bpath%3D%2F43.218.77.16-1443%3Bhost%3Dnautica.foolvpn.me#1%20%F0%9F%87%AE%F0%9F%87%A9%20Amazon.com%20WS%20TLS%20[nautica]";

type proxyType = {
  ip: string;
  isp: string;
  port: string;
  country: string;
};
type protocolsType = "trojan" | "vless" | "ss";
export type ProxySettings = {
  server: string;
  host: string;
  protocol: protocolsType;
  format: "mihomo" | "clash" | "bfr" | "sfa" | "raw";
  tls: boolean;
};

export function getProtocols() {
  return ["trojan", "vless", "ss"];
}

export function getFormats() {
  return ["mihomo", "clash", "bfr", "sfa", "raw"];
}

export async function parseProxies(proxies: proxyType[], settings: ProxySettings) {
  const proxyParser = new ParseProxies(proxies, settings);

  switch (settings.format) {
    case "raw":
      return proxyParser.toRaw();
    case "clash":
    case "mihomo":
      return proxyParser.toClash();
    case "sfa":
      return await proxyParser.toSFA();
    case "bfr":
      return proxyParser.toBFR();
  }
}

class ParseProxies {
  proxies: proxyType[] = [];
  settings: ProxySettings;

  constructor(proxies: proxyType[], settings: ProxySettings) {
    this.proxies = proxies;
    this.settings = settings;
  }

  toRaw() {
    const results: string[] = [];
    let configTemplate: URL | undefined | null;

    switch (this.settings.protocol) {
      case "trojan":
        configTemplate = URL.parse(trojanTemplate);
        break;
      case "vless":
        configTemplate = URL.parse(vlessTemplate);
        break;
      case "ss":
        configTemplate = URL.parse(ssTemplate);
        break;
    }

    if (configTemplate) {
      // Preprocess config
      configTemplate.hostname = this.settings.server;
      if (!this.settings.tls) {
        configTemplate.port = "80";
      }

      // Assign proxies
      for (const proxy of this.proxies) {
        let config = configTemplate;
        let configSearchParams = config?.searchParams;

        if (config.protocol == "ss:") {
          let ssPlugin: string[] = (configSearchParams.get("plugin") as string)?.split(";");

          ssPlugin = ssPlugin?.map((key) => (key.startsWith("path") ? `path=/${proxy.ip}-${proxy.port}` : key));
          ssPlugin = ssPlugin?.map((key) => (key.startsWith("host") ? `host=${this.settings.host}` : key));

          if (!this.settings.tls) {
            ssPlugin?.splice(ssPlugin.indexOf("tls"), 1);
          }
          configSearchParams.set("plugin", ssPlugin?.join(";"));
        } else {
          configSearchParams?.set("path", `/${proxy.ip}-${proxy.port}`);
          if (!this.settings.tls) {
            configSearchParams?.set("security", "none");
          }
          configSearchParams?.set("host", this.settings.host);
          configSearchParams?.set("sni", this.settings.host);
        }

        config.hash = `${getFlagEmoji(proxy.country)} ${proxy.isp} WS ${this.settings.tls ? "TLS" : "NTLS"} [${
          proxy.ip
        }]`;

        config.search = configSearchParams.toString();
        results.push(config.toString());
      }
    }

    return results.join("\n");
  }

  // clash or mihomo
  async toClash() {
    const proxies = this.toRaw();
    const res = await fetch("https://api.foolvpn.web.id/convert", {
      method: "post",
      body: JSON.stringify({
        url: proxies.split("\n").join(","),
        format: "clash",
        template: "cf",
      }),
    });

    return await res.text();
  }

  async toSFA() {
    const proxies = this.toRaw();
    const res = await fetch("https://api.foolvpn.web.id/convert", {
      method: "post",
      body: JSON.stringify({
        url: proxies.split("\n").join(","),
        format: "sfa",
        template: "cf",
      }),
    });

    return JSON.stringify(await res.json(), null, "  ");
  }

  async toBFR() {
    const proxies = this.toRaw();
    const res = await fetch("https://api.foolvpn.web.id/convert", {
      method: "post",
      body: JSON.stringify({
        url: proxies.split("\n").join(","),
        format: "bfr",
        template: "cf",
      }),
    });

    return JSON.stringify(await res.json(), null, "  ");
  }
}
