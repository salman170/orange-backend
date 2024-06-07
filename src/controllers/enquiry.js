import generalModel from "../models/generalModel.js";
import moment from "moment";
import "moment-timezone";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const general = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let { phone, name, email, model } = data;

    if (
      !name ||
      name === "" ||
      name === undefined ||
      !phone ||
      phone === "" ||
      phone === undefined ||
      !email ||
      email === "" ||
      email === undefined
    ) {
      return res
        .status(400)
        .send({ status: false, message: "Data is missing" });
    }

    moment.tz.setDefault("Asia/Kolkata");
    let dates = moment().format("YYYY-MM-DD");
    let times = moment().format("HH:mm:ss");
    data.date = dates;
    data.time = times;
    let savedata = await generalModel.create(data);

    if (!model) model = "Contact us";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.error("Error connecting to email server:", error);
        return res
          .status(500)
          .send({
            status: false,
            message: "Failed to connect to email server",
          });
      }
      console.log("Server is ready to send emails");
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: `${process.env.GMAIL_USER}, info@orangeauto.in`,
      subject: `Enquiry for ${model} from ${phone}`,
      html: `<p>Hello,</p>
<p>You received an enquiry from:</p>
<ul>
  <li>Name: ${name}</li>
  <li>Phone: ${phone}</li>
  <li>Email: ${email}</li>
  <li>Model: ${model}</li>
</ul>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .send({ status: false, message: "Failed to send email" });
      }
      console.log("Email sent:", info.response);
      return res
        .status(200)
        .send({ status: true, message: "Email sent successfully" });
    });
    return res.status(200).send({ status: true, data: savedata });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send({ status: false, message: error.message });
  }
};

//==========================================================================

const getGenerals = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const filter = req.query;
    const sortOptions = {};
    let data = [];

    if (Object.keys(filter).length === 0) {
      // No query parameters provided
      sortOptions.createdAt = -1;
      const data = await generalModel
        .find({ isDeleted: false })
        .sort(sortOptions);
      return res.status(200).send({ status: true, data: data });
    } else {
      const filterDate = filter.date;

      data = await generalModel.aggregate([
        { $match: { isDeleted: false, date: filterDate } },
        {
          $group: {
            _id: {
              date: "$date",
              mobile: "$mobile",
            },
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { createdAt: -1 } },
      ]);
    }

    return res.status(200).send({ status: true, data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getGenerals2 = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const filter = req.query;
    const sortOptions = {};
    let data = [];

    if (Object.keys(filter).length === 0 || filter.date === "allData") {
      // No query parameters provided
      sortOptions.createdAt = -1;
      data = await generalModel.find({ isDeleted: false }).sort(sortOptions);
      return res.status(200).send({ status: true, data: data });
    } else {
      const filterDate = filter.date;

      let startDate, endDate;

      // Calculate start and end dates based on the selected value
      switch (filterDate) {
        case "thisMonth":
          startDate = moment().startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "lastMonth":
          startDate = moment().subtract(1, "month").startOf("month").toDate();
          endDate = moment().subtract(1, "month").endOf("month").toDate();
          break;
        case "last3Months":
          startDate = moment().subtract(3, "months").startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "last6Months":
          startDate = moment().subtract(6, "months").startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "last12Months":
          startDate = moment().subtract(12, "months").startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "today":
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
          break;
        case "yesterday":
          startDate = moment().subtract(1, "day").startOf("day").toDate();
          endDate = moment().subtract(1, "day").endOf("day").toDate();
          break;
        default:
          // Invalid date range option
          return res
            .status(400)
            .send({ status: false, message: "Invalid date range option" });
      }

      // Fetch data based on date range
      data = await generalModel
        .find({
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .sort(sortOptions);
    }

    return res.status(200).send({ status: true, data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};
//==========================================================================

const duplicateGeneral = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const repeatedPhoneNumbers = await generalModel.aggregate([
      {
        $group: {
          _id: {
            date: "$date",
            mobile: "$phone",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the result

          number: "$_id.mobile",
          date: "$_id.date",

          count: 1,
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    return res.status(200).send({ status: true, data: repeatedPhoneNumbers });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//=================================================================
const generalUniqueEntries = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = await generalModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: {
            date: "$date",
            mobile: "$phone",
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { createdAt: -1 } },
    ]);
    return res.status(200).send({ status: true, data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};
//===========================================================================

const generalRange = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const { startDate, endDate } = req.body; // Assuming startDate and endDate are provided in the request body

    let data = await generalModel.aggregate([
      {
        $match: {
          isDeleted: false,
          $expr: {
            $and: [
              { $gte: ["$date", startDate] },
              { $lte: ["$date", endDate] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            date: "$date",
            mobile: "$phone",
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { createdAt: -1 } }, // Note: createdAt field doesn't seem to be in the pipeline
    ]);

    return res.status(200).send({ status: true, data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};
//====================================================================================

export {
  general,
  getGenerals,
  getGenerals2,
  duplicateGeneral,
  generalUniqueEntries,
  generalRange,
};
