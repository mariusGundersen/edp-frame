import createAzureFunctionHandler from "azure-aws-serverless-express";
import app from "../app.js";

// Binds the express app to an Azure Function handler
export default createAzureFunctionHandler(app);
