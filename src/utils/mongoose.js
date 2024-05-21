//CONEXION A MONGODB A TRAVES DE MONGOOSE
import { info } from "console";
import mongoose from "mongoose";

const mongoose = require("mongoose");

export async function connectDB() {
  const db = await mongoose.connect("mongodb://localhost/apcontrol");
  console.log("Base de datos conectada");
}
