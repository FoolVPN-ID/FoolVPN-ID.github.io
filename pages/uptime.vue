<script setup lang="ts">
import prettyBytes from "pretty-bytes";

const refreshInterval = ref(2);
const serverList = ref<
  Array<{
    url: string;
    ping: any;
    info: any;
    status: any;
    speed: any;
    errors: Array<any>;
  }>
>([
  {
    url: "id1.foolvpn.web.id",
    ping: [],
    info: {},
    status: {},
    speed: {},
    errors: [],
  },
  {
    url: "id2.foolvpn.web.id",
    ping: [],
    info: {},
    status: {},
    speed: {},
    errors: [],
  },
  {
    url: "sg1.foolvpn.web.id",
    ping: [],
    info: {},
    status: {},
    speed: {},
    errors: [],
  },
  {
    url: "sg2.foolvpn.web.id",
    ping: [],
    info: {},
    status: {},
    speed: {},
    errors: [],
  },
]);

async function getServerPing(server: string) {
  try {
    const startTime = new Date().getTime();
    const res = await fetch(`https://${server}/api/v1/ping`);
    const finishTime = new Date().getTime();

    if (res.status == 200) {
      return {
        error: false,
        result: finishTime - startTime,
      };
    } else {
      throw new Error(res.statusText);
    }
  } catch (e: any) {
    return {
      error: true,
      message: e.message,
    };
  }
}

async function getServerInfo(server: string) {
  try {
    const res = await fetch(`https://${server}/api/v1/info`);
    if (res.status == 200) {
      return {
        error: false,
        result: await res.json(),
      };
    } else {
      throw new Error(res.statusText);
    }
  } catch (e: any) {
    return {
      error: true,
      message: e.message,
    };
  }
}

async function getServerStatus(server: string) {
  try {
    const res = await fetch(`https://${server}/api/v1/status`);
    if (res.status == 200) {
      return {
        error: false,
        result: await res.json(),
      };
    } else {
      throw new Error(res.statusText);
    }
  } catch (e: any) {
    return {
      error: true,
      message: e.message,
    };
  }
}

onMounted(async () => {
  for (let server of serverList.value) {
    getServerInfo(server.url).then((res) => {
      if (res.error) {
        server.errors.unshift(res.message);
        return;
      }

      server.info = res.result;
    });

    setInterval(() => {
      for (const server of serverList.value) {
        if (server.errors.length) {
          server.errors.pop();
        }
      }
    }, 5000);

    setInterval(async () => {
      getServerStatus(server.url).then((res) => {
        if (res.error) {
          server.errors.unshift(res.message);
          return;
        }

        server.speed["upload"] =
          res.result.nic[0].bytesSent - server.status.nic?.[0].bytesSent || 0 / refreshInterval.value;
        server.speed["download"] =
          res.result.nic[0].bytesRecv - server.status.nic?.[0].bytesRecv || 0 / refreshInterval.value;

        server.status = res.result;
      });

      getServerPing(server.url).then((res) => {
        if (res.error) {
          server.errors.unshift(res.message);
        }

        server.ping.push({
          delay: res.result ? res.result : 0,
          date: new Date(),
        });

        if (server.ping.length > 22) {
          server.ping.shift();
        }
      });
    }, refreshInterval.value * 1000);
  }
});
</script>

<template>
  <div class="flex justify-center overflow-hidden">
    <div class="w-[80%] lg:w-[50%] flex justify-around flex-wrap gap-2 p-2">
      <Card v-for="server in serverList">
        <div class="mx-5 my-2 grid grid-rows-3 gap-3 lg:grid-rows-none lg:grid-cols-3 font-bold">
          <div class="w-full h-full">
            <div
              v-if="server.info.country && server.status.host"
              class="flex items-center justify-center lg:justify-start font-bold gap-3"
            >
              <span class="text-3xl hidden lg:block">
                {{ getFlagEmoji(server.info.country) }}
              </span>
              <div class="flex flex-col items-center lg:items-start">
                <span class="text-sm">
                  {{ server.info.country_name }}
                </span>
                <span class="text-xl">
                  {{ server.info.org }}
                </span>
                <span class="text-xs font-normal italic">
                  {{ server.status.host.os }}
                  {{ server.status.host.platform }}
                  {{ server.status.host.platformVersion }}
                </span>
              </div>
            </div>
            <div v-else class="w-full h-16 skeleton bg-primary flex justify-center items-center text-neutral-content">
              Fetching {{ server.url }}
            </div>
          </div>
          <div class="row-span-2 lg:col-span-2 flex flex-col justify-center items-center gap-5">
            <div v-if="server.status.cpu" class="flex flex-col lg:flex-row lg:gap-5">
              <div class="flex gap-5">
                <div class="flex flex-col">
                  <div>CPU</div>
                  <div v-if="server.status.cpu">
                    <div class="text-xs">{{ parseInt(server.status.cpu[0]).toFixed() }} %</div>
                    <div>
                      <progress
                        class="progress progress-secondary w-12"
                        :value="parseInt(server.status.cpu[0]).toFixed()"
                        max="100"
                      ></progress>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div>RAM</div>
                  <div v-if="server.status.mem">
                    <div class="text-xs">{{ prettyBytes(server.status.mem.used) }}</div>
                    <div>
                      <progress
                        class="progress progress-secondary w-12"
                        :value="server.status.mem.used"
                        :max="server.status.mem.total"
                      ></progress>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div>Upload</div>
                  <div v-if="server.speed.upload && server.status.nic">
                    <div class="text-xs">
                      {{ prettyBytes(server.speed.upload) }}
                    </div>
                    <div class="text-sm">
                      {{ prettyBytes(server.status.nic[0].bytesSent) }}
                    </div>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div>Download</div>
                  <div v-if="server.speed.download && server.status.nic">
                    <div class="text-xs">
                      {{ prettyBytes(server.speed.download) }}
                    </div>
                    <div class="text-sm">
                      {{ prettyBytes(server.status.nic[0].bytesRecv) }}
                    </div>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div>Ping</div>
                  <div v-if="server.ping.length > 0">
                    <div class="text-xs">{{ server.ping[server.ping.length - 1].delay }} ms</div>
                    <div>
                      <progress
                        class="progress progress-secondary w-12"
                        :value="server.ping.filter((data: any) => data.delay > 0).length"
                        :max="server.ping.length"
                      ></progress>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="server.ping.length > 0" class="flex flex-wrap gap-1 lg:w-48 h-full justify-end px-1">
                <div
                  v-for="pingData in server.ping"
                  class="tooltip"
                  :data-tip="`${pingData.delay} ms (${pingData.date})`"
                >
                  <div class="badge badge-xs" :class="pingData.delay > 0 ? 'badge-secondary' : 'badge-accent'"></div>
                </div>
              </div>
            </div>
            <div v-else class="skeleton w-full h-16 bg-primary"></div>
          </div>
        </div>
        <div v-if="server.errors.length" class="w-full flex justify-center badge badge-accent">
          {{ server.errors[0] }}
        </div>
      </Card>
    </div>
  </div>
</template>
