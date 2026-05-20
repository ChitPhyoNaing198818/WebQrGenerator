import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables
dotenv.config();

// Cloudinary Configuration
let cloudinaryConfigured = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryConfigured = true;
  console.log("------------------------------------------------------------");
  console.log("SUCCESS: Cloudinary configured successfully!");
  console.log("------------------------------------------------------------");
} else {
  console.log("------------------------------------------------------------");
  console.log("Cloudinary credentials not configured in environmental variables.");
  console.log("Falling back entirely to local folder uploads.");
  console.log("------------------------------------------------------------");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), "utf-8");
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface CardPayload {
  id: string;
  templateName: string;
  [key: string]: any;
}

interface ICard {
  id: string;
  templateName: string;
  payload: any;
}

// MongoDB schema definition
const CardSchema = new mongoose.Schema<ICard>({
  id: { type: String, required: true, unique: true, index: true },
  templateName: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const CardModel = mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);

let mongoConnected = false;

async function connectToMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("------------------------------------------------------------");
    console.log("MONGO_URI environment variable is not defined.");
    console.log("Using local JSON file fallback database persistence.");
    console.log("------------------------------------------------------------");
    return false;
  }
  try {
    console.log("Attempting to connect to MongoDB with URI:", uri.replace(/:([^@]+)@/, ":***@"));
    await mongoose.connect(uri);
    mongoConnected = true;
    console.log("------------------------------------------------------------");
    console.log("SUCCESS: Connected to MongoDB database successfully!");
    console.log("------------------------------------------------------------");
    return true;
  } catch (err) {
    console.error("------------------------------------------------------------");
    console.error("ERROR: Failed to connect to MongoDB, falling back safely to local JSON standard database.");
    console.error(err);
    console.error("------------------------------------------------------------");
    mongoConnected = false;
    return false;
  }
}

async function uploadToCloudinary(filePath: string): Promise<string | null> {
  if (!cloudinaryConfigured) return null;
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "surprise_cards"
    });
    // Try to unlink/delete the local file to save storage spacer
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("Failed to delete local uploaded file after Cloudinary sync", e);
    }
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed, falling back to local URL style storage.", err);
    return null;
  }
}

function loadDatabase(): Record<string, CardPayload> {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) || {};
  } catch (err) {
    return {};
  }
}

function saveDatabase(db: Record<string, CardPayload>) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

async function getCardById(id: string): Promise<CardPayload | null> {
  if (mongoConnected) {
    try {
      const doc = await CardModel.findOne({ id } as any);
      if (doc) {
        return {
          id: doc.id,
          templateName: doc.templateName,
          ...doc.payload
        };
      }
      return null;
    } catch (err) {
      console.error("MongoDB get error, accessing JSON fallback database:", err);
    }
  }
  const db = loadDatabase();
  return db[id] || null;
}

async function saveCard(id: string, templateName: string, fields: Record<string, any>): Promise<void> {
  if (mongoConnected) {
    try {
      // Remove metadata keys prior to payload persistence
      const { id: _, templateName: __, ...cleanedPayload } = fields;
      await CardModel.findOneAndUpdate(
        { id } as any,
        { 
          id, 
          templateName, 
          payload: cleanedPayload 
        },
        { upsert: true, new: true }
      );
      return;
    } catch (err) {
      console.error("MongoDB save error, writing to JSON fallback database:", err);
    }
  }
  const db = loadDatabase();
  db[id] = {
    id,
    templateName,
    ...fields
  };
  saveDatabase(db);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit to allow audio as well
  },
});

async function startServer() {
  // Connect to MongoDB if MONGO_URI is set, fail over gracefully to local storage
  await connectToMongo();

  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use("/uploads", express.static(UPLOADS_DIR));

  // DB & Media Connection Status Endpoint
  app.get("/api/db-status", (req, res) => {
    return res.json({
      connected: mongoConnected,
      databaseType: mongoConnected ? "MongoDB" : "Local JSON",
      envConfigured: !!process.env.MONGO_URI,
      cloudinaryConfigured: cloudinaryConfigured,
      cloudinaryEnvConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME)
    });
  });

  app.get("/api/card/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const card = await getCardById(id);
      if (card) {
        return res.json(card);
      }
      return res.status(404).json({ success: false, message: "Card not found" });
    } catch (err: any) {
      console.error("Error loading card:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to load card config" });
    }
  });

  app.post("/api/generate-card", upload.any(), async (req, res) => {
    try {
      const payloadString = req.body.payload;
      if (!payloadString) {
        return res.status(400).json({ success: false, message: "Missing design parameters payload" });
      }

      const parsedPayload = JSON.parse(payloadString);
      const cardId = Math.random().toString(36).substring(2, 10);

      const templateName = parsedPayload.templateName || "lovecard";
      const cardData: Record<string, any> = {
        ...parsedPayload,
      };

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if (cloudinaryConfigured) {
            const cloudUrl = await uploadToCloudinary(file.path);
            if (cloudUrl) {
              cardData[file.fieldname] = cloudUrl;
            } else {
              cardData[file.fieldname] = `/uploads/${file.filename}`;
            }
          } else {
            cardData[file.fieldname] = `/uploads/${file.filename}`;
          }
        }
      }

      await saveCard(cardId, templateName, cardData);

      return res.json({ success: true, id: cardId });
    } catch (err: any) {
      console.error("Error generating card:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to generate card config" });
    }
  });

  app.get("/view/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const card = await getCardById(id);
      if (card) {
        const tpl = card.templateName || "lovecard";
        return res.redirect(`/${tpl}.html?id=${id}`);
      }
    } catch (err) {
      console.error("Error loading view page:", err);
    }
    return res.status(404).send(`
      <html>
        <head>
          <title>Not Found</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #fafafa; color: #333; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Card not found</h1>
          <p>The card ID you are looking for does not exist or has expired.</p>
          <a href="/">Go to Studio</a>
        </body>
      </html>
    `);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
