<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow p-4 w-100" style="max-width: 400px;">
      <p class="h4 fw-bold text-center">NDMI Login</p>
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="loginEmail" class="form-label">Email</label>
          <input id="loginEmail" v-model="loginEmail" type="email" class="form-control" placeholder="Please enter your email" required />
        </div>
        <div class="mb-3">
          <label for="loginPassword" class="form-label">Password</label>
          <input id="loginPassword" v-model="loginPassword" type="password" class="form-control" placeholder="Please enter your password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
        <button type="button" class="btn btn-link w-100 mt-2" @click="showRegisterModal=true">Register</button>
      </form>
    </div>

    <div
      class="modal fade"
      :class="{ show: showRegisterModal }"
      v-if="showRegisterModal"
      tabindex="-1"
      :style="{ display: showRegisterModal ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <p class="h5 fw-bold text-center">Register</p>
            <button type="button" class="btn-close" @click="closeRegisterModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <label for="registerName" class="form-label">Name</label>
                <input id="registerName" v-model="registerName" type="text" class="form-control" placeholder="Please enter your name" required />
              </div>
              <div class="mb-3">
                <label for="registerEmail" class="form-label">Email</label>
                <input id="registerEmail" v-model="registerEmail" type="email" class="form-control" placeholder="Please enter your email" required />
              </div>
              <div class="mb-3">
                <label for="registerPassword" class="form-label">Password</label>
                <input id="registerPassword" v-model="registerPassword" type="password" class="form-control" placeholder="Please enter your password" required />
              </div>
              <button type="submit" class="btn btn-success w-100">Register</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from "axios";

  export default {
    name: "UserLogin",
    data() {
      return {
        loginEmail: "",
        loginPassword: "",
        showRegisterModal: false,
        registerName: "",
        registerEmail: "",
        registerPassword: "",
      };
    },
    methods: {
      async handleLogin() {
        try {
          const response = await axios.post("http://127.0.0.1:3095/login", {
            email: this.loginEmail,
            password: this.loginPassword,
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          });

          const token = response.data.token;
          if (token) {
            localStorage.setItem("NDMI_JWT_Token", token);
            this.$router.push({ name: "Main" });
          }
        } catch (err) {
          console.error("Login failed：", err);
          alert("Login failed. Please check your username and password.");
        }
      },
      async handleRegister() {
        try {
          await axios.post("http://127.0.0.1:3095/users", {
            name: this.registerName,
            email: this.registerEmail,
            password: this.registerPassword,
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          });

          alert("Registered successfully. Please login with your new account.");
          this.closeRegisterModal();
        } catch (err) {
          console.error("Registration failed：", err);
          alert("Register failed. Please check if the information is correct.");
        }
      },
      closeRegisterModal() {
        this.showRegisterModal = false;
        this.registerName = "";
        this.registerEmail = "";
        this.registerPassword = "";
      }
    }
  };
</script>

<style scoped>

</style>