require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

async function startServer() {
  connectDB();

  app.listen(process.env.PORT, () => {
    console.log("Listening to port 4000");
  });
}
startServer()
