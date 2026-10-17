import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import clientRoutes from "./routes/client.js";
import generalRoutes from "./routes/general.js";
import managementRoutes from "./routes/management.js";
import salesRoutes from "./routes/sales.js";

// data imports
import User from "./models/User.js";
import Product from "./models/Product.js";
import ProductStat from "./models/ProductStat.js";
import Transaction from "./models/Transaction.js";
import OverallStat from "./models/OverallStat.js";
import AffiliateStat from "./models/AffiliateStat.js";
import {
  dataUser,
  dataProduct,
  dataProductStat,
  dataTransaction,
  dataOverallStat,
  dataAffiliateStat,
} from "./data/index.js";

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.use("/client", clientRoutes);
app.use("/general", generalRoutes);
app.use("/management", managementRoutes);
app.use("/sales", salesRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 9000;
const MAX_CONNECT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 10_000;

async function connectAndStart(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10_000,
    });

    // Only accept traffic once the database is ready.
    app.listen(PORT, "0.0.0.0", () => console.log(`Server Port: ${PORT}`));

    /* ONLY ADD DATA ONE TIME */
    // AffiliateStat.insertMany(dataAffiliateStat);
    // OverallStat.insertMany(dataOverallStat);
    // Product.insertMany(dataProduct);
    // ProductStat.insertMany(dataProductStat);
    // Transaction.insertMany(dataTransaction);
    // User.insertMany(dataUser);
  } catch (error) {
    console.error(`MongoDB startup attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed:`, error);
    if (attempt >= MAX_CONNECT_ATTEMPTS) {
      console.error("MongoDB unavailable after retries; terminating for Render to restart the service.");
      process.exitCode = 1;
      return;
    }
    setTimeout(() => void connectAndStart(attempt + 1), RETRY_DELAY_MS);
  }
}

if (!process.env.MONGO_URL) {
  console.error("MONGO_URL is missing. Configure it in the Render service environment.");
  process.exitCode = 1;
} else {
  void connectAndStart();
}
