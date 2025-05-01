import { createApp } from "vue";  // 初始化和創建Vue應用的實例
import App from "./App.vue";  // 導入根組件，應用啟動時的初始組件"./views/UserLogin.vue"
import router from "./router";  //  導入專案中配置的Vue Router
import "bootstrap/dist/css/bootstrap.min.css";  // 導入Bootstrap CSS
import "bootstrap/dist/js/bootstrap.bundle.min.js";  // 導入Bootstrap 的JS和Popper.js
import "bootstrap-icons/font/bootstrap-icons.css";  // Bootstrap Icons套件
import "bootstrap";

createApp(App)  // 使用createApp初始化
   .use(router)   // 使用Vue Router
   .mount("#app");  // 將應用掛載到DOM上的#app元素
