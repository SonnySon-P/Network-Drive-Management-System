<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view></router-view>  <!-- 渲染當前路由對應的組件 -->
  </div>
</template>

<script>
export default {
  name: "App",  // 根組件的名稱是App
};
</script>