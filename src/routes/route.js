import express from "express";
const router = express.Router();
import { general, getGenerals } from "../controllers/enquiry.js";
import { authentication } from "../middlewares/auth.js";

router.get("/test-me", function (req, res) {
  res.send("Hello World");
});

// // General Routes
router.post("/general", general);
router.get("/getGenerals", authentication, getGenerals);

router.all("/*", async function (req, res) {
  return res.status(400).send({ status: false, message: "Page not found" });
});
export default router;
