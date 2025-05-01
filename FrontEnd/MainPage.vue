<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark py-0 custom-navbar">
      <div class="container-fluid d-flex align-items-center justify-content-between">
        <a class="navbar-brand" href="#"><span class="fw-bold mb-0 fs-3">NDMI</span></a>
        <div class="dropdown">
          <button class="btn btn-primary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            Hi {{ userName }}
          </button>
          <ul class="dropdown-menu dropdown-menu-light dropdown-menu-end py-1 my-1" aria-labelledby="dropdownMenuButton">
            <li><button class="dropdown-item slim py-0 custom-dropdown-item" @click="openEditAccount">Edit Account</button></li>
            <li><button class="dropdown-item slim py-0 custom-dropdown-item" @click="handleSignOut">Sign Out</button></li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="d-flex" style="height: calc(100vh - 56px);">
      <div class="bg-light border-end p-3 d-flex flex-column" style="width: 240px;">
        <div class="list-group">
          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 sidebar-btn"
            @click="openCreateFolderModal"
          >
            <i class="bi bi-folder-plus me-3"></i> Create Folder
          </button>

          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 sidebar-btn"
            @click="openDeleteFolderModal"
          >
            <i class="bi bi-folder-x me-3"></i> Delete Folder
          </button>

          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 sidebar-btn"
            @click="triggerUploadFile"
          >
            <i class="bi bi-upload me-3"></i> Upload File
          </button>

          <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleUploadFile"
          />

          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 sidebar-btn"
            @click="handleDeleteSelectedFiles"
          >
            <i class="bi bi-file-earmark-x me-3"></i> Delete File
          </button>

          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 sidebar-btn"
            @click="handleDownloadSelectedFiles"
          >
            <i class="bi bi-download me-3"></i> Download File
          </button>
        </div>

        <div class="mt-auto text-center text-muted small pt-4">
          <p class="mb-0">&copy; SonnySon</p>
          <p class="mb-0">Ver 1.0.0</p>
        </div>
      </div>

      <div class="flex-grow-1 p-4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-3">
            <li class="breadcrumb-item">
              <a href="#" @click.prevent="handleFetchFiles(userName)">{{ userName }}</a>
            </li>
            <li
              v-for="(folder, index) in currentPath.slice(1)" 
              :key="index"
              class="breadcrumb-item"
            >
              <a href="#" @click.prevent="handleBreadcrumb(index + 1)">
                {{ folder }}
              </a>
            </li>
          </ol>
        </nav>

        <ul class="list-group" @contextmenu.prevent>
          <li
            v-for="item in fileList"
            :key="item.name"
            class="list-group-item d-flex align-items-center"
            @click="item.isBack ? handleNavigateToPreviousLayer() : (item.isFolder ? handleNavigateToFolder(item.name) : null)"
            @contextmenu.prevent="showContextMenu($event, item)"
            style="cursor: pointer;"
          >
            <input
              v-if="!item.isFolder && !item.isBack"
              type="checkbox"
              class="form-check-input me-2"
              v-model="selectedFiles"
              :value="item.name"
              @click.stop
            />
            <i
              :class="item.isBack
                ? 'bi bi-arrow-left-circle text-primary'
                : item.isFolder
                ? 'bi bi-folder text-warning'
                : 'bi bi-file-earmark text-secondary'"
              class="me-2 fs-5"
            ></i>
            {{ item.name }}
          </li>
        </ul>

        <div v-if="uploadProgress !== null" class="mt-3">
          <div class="progress">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              :style="{ width: uploadProgress + '%' }"
              :aria-valuenow="uploadProgress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {{ uploadProgress }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      :class="{ show: showEditAccountModal }"
      v-if="showEditAccountModal"
      tabindex="-1"
      :style="{ display: showEditAccountModal ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <p class="h5 fw-bold text-center">Edit Account</p>
            <button type="button" class="btn-close" @click="closeEditAccount"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleEditAccount">
              <div class="mb-3">
                <label for="editName" class="form-label">Name</label>
                <input id="editName" v-model="editName" type="text" class="form-control" placeholder="Please enter your name" required />
              </div>
              <div class="mb-3">
                <label for="editEmail" class="form-label">Email</label>
                <input id="editEmail" v-model="editEmail" type="email" class="form-control" placeholder="Please enter your email" required />
              </div>
              <div class="mb-3">
                <label for="editPassword" class="form-label">Password</label>
                <input id="editPassword" v-model="editPassword" type="password" class="form-control" placeholder="Please enter your password" required />
              </div>
              <button type="submit" class="btn btn-success w-100">Modify</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      :class="{ show: showCreateFolderModal }"
      v-if="showCreateFolderModal"
      tabindex="-1"
      :style="{ display: showCreateFolderModal ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <p class="h5 fw-bold text-center">Create Folder</p>
            <button type="button" class="btn-close" @click="closeCreateFolderModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleCreateFolder">
              <div class="mb-3">
                <label for="folderName" class="form-label">Name</label>
                <input id="folderName" v-model="folderName" type="text" class="form-control" placeholder="Please enter folder name" required />
              </div>
              <button type="submit" class="btn btn-success w-100">Create</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      :class="{ show: showDeleteFolderModal }"
      v-if="showDeleteFolderModal"
      tabindex="-1"
      :style="{ display: showDeleteFolderModal ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <p class="h5 fw-bold text-center">Delete Folder</p>
            <button type="button" class="btn-close" @click="closeDeleteFolderModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleDeleteSelectedFolder">
              <div class="mb-3">
                <label class="form-label">Select Folder</label>
                <select
                  id="folderSelect"
                  class="form-select"
                  v-model="selectedFolder"
                >
                  <option disabled value="">-- Please select folder name --</option>
                  <option
                    v-for="folder in folderList"
                    :key="folder.name"
                    :value="folder.name"
                  >
                    {{ folder.name }}
                  </option>
                </select>
              </div>
              <button type="submit" class="btn btn-danger w-100">Delete</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from "axios";
  import { jwtDecode } from "jwt-decode";

  export default {
    name: "MainPage",
    data() {
      return {
        userName: "",
        editName: "",
        editEmail: "",
        editPassword: "",
        createFolderName: "",
        deleteFolderName: "",
        showEditAccountModal: false,
        showCreateFolderModal: false,
        showDeleteFolderModal: false,
        decodedToken: null,
        uploadProgress: null,
        fileList: [],
        selectedFiles: [],
        currentPath: []
      };
    },
    created() {
      const token = localStorage.getItem("NDMI_JWT_Token");
      if (!token) {
        this.$router.push({ name: "Login" });
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp < currentTime) {
          localStorage.removeItem("NDMI_JWT_Token");
          this.$router.push({ name: "Login" });
        } else {
          this.userName = decodedToken.name || "";
          this.decodedToken = decodedToken;
          this.editName = decodedToken.name || "";
          this.editEmail = decodedToken.email || "";
        }
      } catch (err) {
        localStorage.removeItem("NDMI_JWT_Token");
        this.$router.push({ name: "Login" });
      }

      this.handleFetchFiles(this.userName);
    },
    methods: {
      openEditAccount() {
        this.showEditAccountModal = true;
      },
      closeEditAccount() {
        this.showEditAccountModal = false;
        this.editName = this.decodedToken.name || "";
        this.editEmail = this.decodedToken.email || "";
        this.editPassword = "";
      },
      openCreateFolderModal() {
        this.showCreateFolderModal = true;
      },
      closeCreateFolderModal() {
        this.showCreateFolderModal = false;
        this.folderName = "";
      },
      openDeleteFolderModal() {
        this.folderList = this.fileList.filter(item => item.isFolder);
        this.showDeleteFolderModal = true;
      },
      closeDeleteFolderModal() {
        this.showDeleteFolderModal = false;
        this.deleteFolderName = "";
      },
      handleSignOut() {
        localStorage.removeItem("NDMI_JWT_Token");
        this.$router.push({ name: "Login" });
      },
      handleBreadcrumb(index) {
        const navigateToPath = this.currentPath.slice(0, index + 1).join("/");
        this.handleFetchFiles(navigateToPath);
      },
      handleNavigateToPreviousLayer() {
        if (this.currentPath.length > 1) {
          const previousPath = this.currentPath.slice(0, this.currentPath.length - 1).join("/");
          this.handleFetchFiles(previousPath);
        } else {
          this.handleFetchFiles("");
        }
      },
      handleNavigateToFolder(folderName) {
        const navigateToPath = [...this.currentPath, folderName].join("/");
        this.handleFetchFiles(navigateToPath);
      },
      triggerUploadFile() {
        this.$refs.fileInput?.click();
      },
      async handleFetchFiles(path) {
        const token = localStorage.getItem("NDMI_JWT_Token");
        if (!token) {
          return;
        }

        this.fileList = [];

        try {
          const response = await axios.get(`http://127.0.0.1:3095/files/?path=${path}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (Array.isArray(response.data) && response.data.length > 0) {
            this.fileList = response.data;
          }

          this.currentPath = path.split("/").filter(Boolean);

          if (this.currentPath.length > 1) {
            this.fileList.unshift({
              name: "...",  // 返回上一層項目，顯示的名稱
              isFolder: true,  // 標記為文件夾
              isBack: true,  // 用來區分返回上一層的項目
            });
          }
        } catch (err) {
          alert("Failed to fetch files.");
        }
      },
      async handleEditAccount() {
        const token = localStorage.getItem("NDMI_JWT_Token");
        const userId = this.decodedToken?._id;

        if (!userId || !token) return;

        try {
          await axios.put(
            `http://127.0.0.1:3095/users/${userId}`,
            {
              name: this.editName,
              email: this.editEmail,
              password: this.editPassword,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          this.showEditAccountModal = false;
          alert("Account updated successfully!");
          this.handleSignOut();
        } catch (error) {
          alert("Failed to update account.");
        }
      },
      async handleCreateFolder(){
        const token = localStorage.getItem("NDMI_JWT_Token");

        if (!token) return;

        try {
          await axios.post(
            "http://127.0.0.1:3095/create-folder",
            {
              path: this.currentPath.join("/"),
              folderName: this.folderName,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          this.closeCreateFolderModal();
          alert("Floder create successfully!");
          this.handleFetchFiles(this.currentPath.join("/"));
        } catch (error) {
          alert("Failed to create floder.");
        }
      },
      async handleDeleteSelectedFolder() {
        const token = localStorage.getItem("NDMI_JWT_Token");
        if (!token) return;

        if (!this.selectedFolder) {
          alert("Please select a folder.");
          return;
        }

        if (!confirm(`Are you sure you want to delete the ${this.selectedFolder} folder?`)) {
          return;
        }

        const deleteFolderPath = [...this.currentPath, this.selectedFolder].join("/");
        try {
          const response = await axios.delete('http://127.0.0.1:3095/delete-folder', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {
              path: deleteFolderPath
            }
          });

          if (response.status === 200) {
            alert("Folder deleted successfully.");
          }
        } catch (err) {
          alert("Failed to delete the folder. Please try again.");
        }

        this.closeDeleteFolderModal();
        this.handleFetchFiles(this.currentPath.join("/"));
      },
      async handleDeleteSelectedFiles() {
        const token = localStorage.getItem("NDMI_JWT_Token");
        if (!token) return;

        if (this.selectedFiles.length === 0) {
          alert("Please select the file to delete.");
          return;
        }

        if (!confirm(`Are you sure you want to delete the following ${this.selectedFiles.length} files? \n${this.selectedFiles.join('\n')}`)) {
          return;
        }

        for (const fileName of this.selectedFiles) {
          const deleteFilePath = [...this.currentPath, fileName].join("/");
          try {
            await axios.delete("http://127.0.0.1:3095/delete-file", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              params: {
                path: deleteFilePath,
              },
            });
          } catch (err) {
            alert(`Failed to delete ${fileName}. Please try again.`);
          }
        }

        this.selectedFiles = [];
        this.handleFetchFiles(this.currentPath.join("/"));
      },    
      async handleUploadFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const token = localStorage.getItem("NDMI_JWT_Token");
        if (!token) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", this.currentPath.join("/"));

        try {
          this.uploadProgress = 0;

          await axios.post("http://127.0.0.1:3095/upload-file", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              this.uploadProgress = percent;
            },
          });

          alert("File uploaded successfully!");
          this.handleFetchFiles(this.currentPath.join("/"));
        } catch (err) {
          alert("Failed to upload file.");
        } finally {
          this.$refs.fileInput.value = null;
          setTimeout(() => {
            this.uploadProgress = null;
          }, 1000);
        }
      },
      async handleDownloadSelectedFiles() {
        const token = localStorage.getItem("NDMI_JWT_Token");
        if (!token) return;

        if (this.selectedFiles.length === 0) {
          alert("Please select the file to download.");
          return;
        }

        for (const fileName of this.selectedFiles) {
          const downloadFilePath = [...this.currentPath, fileName].join("/");

          try {
            const response = await axios.get("http://127.0.0.1:3095/download-file", {
              params: { path: downloadFilePath },
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const blob = new Blob([response.data]);
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = downloadFilePath;
            link.click();
          } catch (err) {
            alert(`Failed to download ${fileName}. Please try again.`);
          }
        }

        this.selectedFiles = [];
      },
    }
  }
</script>

<style scoped>
  .custom-navbar {
    height: 60px;
    line-height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .custom-dropdown-item {
    height: 40px;
    line-height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dropdown-item.slim:hover {
    background-color: #e6f0ff;
    color: #0056b3;
  }
  
  .sidebar-btn {
    background-color: transparent;
    font-weight: normal;
    color: inherit;
    transition: color 0.2s ease-in-out, font-weight 0.2s ease-in-out;
  }

  .sidebar-btn:hover {
    color: #0056b3 !important;
    font-weight: bold;
  }
</style>