<script setup lang="ts">
const selectedProxies = useSelectedProxiesStore();
const props = defineProps({
  isp: String,
  ipPort: String,
  country: String,
});

const stats = reactive({
  proxyip: false,
  delay: 0,
  loading: false,
});
const isSelected = ref(false);

// Server side fetching
async function checkProxyHealth() {
  stats.loading = true;
  try {
    const res = await $fetch(`https://id1.foolvpn.web.id/api/v1/check?ip=${props.ipPort}`);

    const jsonValue = res as any;
    stats.proxyip = jsonValue.proxyip;
    stats.delay = jsonValue.delay;
  } catch (e) {
    console.error(e);
  }
  stats.loading = false;
}

function selectProxy() {
  selectedProxies.toggleSelectedProxies(props.ipPort as string);
  toggleIsSelected();
}

function toggleIsSelected() {
  if (selectedProxies.getSelectedProxies.includes(props.ipPort as string)) {
    isSelected.value = true;
  } else {
    isSelected.value = false;
  }
}

onMounted(() => {
  checkProxyHealth();
  toggleIsSelected();
});
watch(props, () => {
  checkProxyHealth();
  toggleIsSelected();
});
watch(selectedProxies.getSelectedProxies, () => {
  toggleIsSelected();
});
</script>

<template>
  <div
    class="w-full lg:w-max rounded-lg grid grid-cols-1 p-4 hover:scale-105 transition-all duration-200 h-max"
    :class="stats.proxyip == true ? 'bg-secondary text-secondary-content' : 'bg-accent text-accent-content'"
  >
    <div>
      <div
        v-on:click="selectProxy"
        class="flex justify-start items-center gap-2 font-bold cursor-pointer hover:bg-primary rounded-lg p-1 transition-all duration-200"
        :class="isSelected ? 'bg-primary' : ''"
      >
        <img
          width="32"
          :src="`https://hatscripts.github.io/circle-flags/flags/${props.country}.svg`"
          :alt="props.country"
        />
        <div class="flex flex-col">
          <span> {{ props.isp }} </span>
          <span> {{ props.ipPort }} </span>
        </div>
      </div>
      <div class="mt-1 gap-2 flex items-center">
        <span
          v-on:click="
            () => {
              if (stats.loading == false) checkProxyHealth();
            }
          "
          class="badge cursor-pointer"
          :class="stats.delay ? 'badge-primary' : 'badge-default'"
        >
          <span class="loading loading-xs loading-spinner" v-if="stats.loading"></span>
          <span v-else>
            {{ stats.delay }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
