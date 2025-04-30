// 載入環境變數
require("dotenv").config();

// 載入套件
const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

// 宣告變數
const app = express();

// 設定port
const port = 3095;

// 設定MongoDB
const uri = "mongodb://172.18.0.3";  // MongoDB位址
const dbName = "ndmi";  // 資料庫名稱
const client = new MongoClient(uri);  // 建立一個MongoDB的客戶端物件

// 中介軟體
app.use(express.static("public"));  // 設定靜態資源路徑
app.use(express.json());  // 解析JSON格式的請求
app.use(cors());  // 啟用跨來源請求

// 啟動伺服器的主流程
async function startServer() {
    try {
        // 連線資料庫
        await client.connect();
        const db = client.db(dbName);

        // 新增用戶
        app.post("/users", async (req, res) => {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: "Missing name, email or password"});
            }

            try {
                const createUserResult = await db.collection("users").insertOne({ 
                    name, 
                    email, 
                    password: bcrypt.hashSync(password, parseInt(process.env.BCRYPT_SALT_ROUNDS))
                });

                const folderPath = path.join(__dirname, "../Cloud Drive/", name); 
                const createFolderResult = await createFolder(folderPath);

                return res.status(200).json({ message: "User created successfully" });
            } catch (err) {
                if (err.error === "Failed to create folder") {
                    return res.status(500).json({ error: err.error });
                }
                return res.status(500).json({ error: "Failed to create user" });
            }
        });

        // 更新用戶
        app.put("/users/:id", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }
        
                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }
        
                const userID = req.params.id;
                const { name, email, password } = req.body;
        
                const updateFields = {};
                if (name) updateFields.name = name;
                if (email) updateFields.email = email;
                if (password) updateFields.password = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        
                try {
                    const result = await db.collection("users").updateOne(
                        { _id: new ObjectId(userID) },
                        { $set: updateFields }
                    );
                    if (result.matchedCount === 0) {
                        return res.status(404).json({ error: "User not found" });
                    }
                    return res.status(200).json({ message: "User updated successfully" });
                } catch (err) {
                    return res.status(500).json({ error: "Failed to update user" });
                }
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });
        
        // 用戶登入
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "Missing email or password" });
            }
        
            try {
                const loginResult = await db.collection("users").findOne({ email });
                if (!loginResult) {
                    return res.status(404).json({ error: "User not found" });
                }

                if (!bcrypt.compareSync(password, loginResult.password)) {
                    return res.status(401).json({ error: "Authentication failed" });
                }

                const payload = {
                    _id: loginResult._id,
                    name: loginResult.name,
                    email: loginResult.email,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 有效期1天
                };
 
                return res.status(200).json({
                    message: "Login successful",
                    token: jwt.sign(payload, process.env.JWT_SECRET_KEY)
                });
            } catch (err) {
                return res.status(500).json({ error: "Failed to process login" });
            }
        });

        // 取得雲端硬碟檔案清單
        app.get("/files", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }
        
                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }
                
                const drivePath = path.join(__dirname, "../Cloud Drive/", req.query.path);

                if (!fs.existsSync(drivePath)) {
                    return res.status(404).json({ error: "User drive folder not found" });
                }
            
                fs.readdir(drivePath, (err, files) => {
                    if (err) {
                        return res.status(401).json({ error: "Failed to read the file" });
                    }

                    const fileDetails = [];

                    files.forEach(file => {
                        const filePath = path.join(drivePath, file);

                        fs.lstat(filePath, (err, stats) => {
                            if (err) {
                                return res.status(500).json({ error: "Failed to get file stats" });
                            }

                            fileDetails.push({
                                name: file,
                                isFolder: stats.isDirectory(), // 如果是資料夾，isDirectory()為true
                            });

                            if (fileDetails.length === files.length) {
                                return res.json(fileDetails);
                            }
                        });
                    });
                });   
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });

        // 新增資料夾
        app.post("/create-folder", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }
        
                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }

                const drivePath = path.join(__dirname, "../Cloud Drive/", req.body.path);          
                if (!fs.existsSync(drivePath)) {
                    return res.status(404).json({ error: "Folder not found" });
                }
                
                const folderPath = path.join(drivePath, req.body.folderName);
                try {
                    const createFolderResult = await createFolder(folderPath);
                    return res.status(200).json({ message: "Folder created successfully", folder: createFolderResult.message });
                } catch (err) {
                    return res.status(500).json({ error: "Failed to create folder", details: err.message });
                }
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });

        // 刪除資料夾
        app.delete("/delete-folder", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }

                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }

                let folderPath = path.join(__dirname, "../Cloud Drive/", req.query.path);              
                if (!fs.existsSync(folderPath)) {
                    return res.status(404).json({ error: "Folder not found" });
                }

                fs.rmdir(folderPath, { recursive: true }, (err) => {
                    if (err) {
                        return res.status(401).json({ error: "Failed to delete folder" });
                    }
                    return res.status(200).json({ message: "Folder deleted successfully" });
                });
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });

        // 上傳檔案
        const upload = multer({ storage: multer.memoryStorage() });
        app.post("/upload-file", upload.single("file"), async (req, res) => {
          try {
            const authHeader = req.header("authorization");
        
            if (!authHeader) {
              return res.status(400).json({ error: "Missing token" });
            }
        
            const tokenParts = authHeader.split(" ");
            if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
              return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
            }
        
            const verifyToken = (token) => {
                return new Promise((resolve, reject) => {
                    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(payload);
                        }
                    });
                });
            };
    
            const payload = await verifyToken(tokenParts[1]);
    
            if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                return res.status(401).json({ error: "Token has expired" });
            }
        
            const relativePath = req.body.path || "";
            const folderPath = path.join(__dirname, "../Cloud Drive/", relativePath);
    
            if (!fs.existsSync(folderPath)) {
            return res.status(404).json({ error: "Folder not found" });
            }
    
            if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
            }
    
            const filePath = path.join(folderPath, req.file.originalname);
    
            fs.writeFile(filePath, req.file.buffer, (err) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to save file" });
                }
        
                return res.status(200).json({ message: "File uploaded successfully" });
            });
          } catch (err) {
            return res.status(500).json({ error: "Failed to process request" });
          }
        });

        // 下載檔案
        app.get("/download-file", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }
        
                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }

                let filePath = path.join(__dirname, "../Cloud Drive/", req.query.path);

                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ error: "File not found" });
                }

                res.download(filePath, (err) => {
                    if (err) {
                        return res.status(500).json({ error: "File download failed" });
                    }
                });
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });

        // 刪除檔案
        app.delete("/delete-file", async (req, res) => {
            try {
                const authHeader = req.header("authorization");
        
                if (!authHeader) {
                    return res.status(400).json({ error: "Missing token" });
                }
        
                const tokenParts = authHeader.split(" ");
                if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
                    return res.status(400).json({ error: "Invalid token format. Expected: Bearer <token>" });
                }
        
                const verifyToken = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(payload);
                            }
                        });
                    });
                };
        
                const payload = await verifyToken(tokenParts[1]);
        
                if (Math.floor(new Date().getTime() / 1000) > payload.exp) {
                    return res.status(401).json({ error: "Token has expired" });
                }
                    
                let filePath = path.join(__dirname, "../Cloud Drive/", req.query.path); 
                console.log(filePath);             
                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ error: "File not found" });
                }
                console.log(filePath);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return res.status(401).json({ error: "File deletion failed" });
                    }
                    return res.status(200).json({ message: "File deleted successfully" });
                });
            } catch (err) {
                return res.status(500).json({ error: "Failed to process request" });
            }
        });

        // 創建資料夾
        function createFolder(folderPath) {
            return new Promise((resolve, reject) => {
                fs.mkdir(folderPath, { recursive: true }, (err) => {
                    if (err) {
                        reject({ error: "Failed to create folder" });
                    } else {
                        resolve({ message: "Folder created successfully" });
                    }
                });
            });
        }

        // 啟動Express應用程式
        app.listen(port, () => {
            console.log(`Server running on port ${port}.`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1); // 強制中止，避免Express在沒連上資料庫下啟動
    }
}

// 啟動伺服器
startServer();