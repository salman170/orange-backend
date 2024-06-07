import generalModel from "../models/generalModel.js";
import moment from "moment";
import "moment-timezone";

const general = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    const { phone, name, email } = data;
if(!name || name === "" || name === undefined || !phone || phone === "" || phone === undefined || !email || email === "" || email === undefined){
    return res.status(400).send({ status: false, message: "data is missing" });
}


    moment.tz.setDefault("Asia/Kolkata");
    let dates = moment().format("YYYY-MM-DD");
    let times = moment().format("HH:mm:ss");
    data.date = dates;
    data.time = times;
    let savedata = await generalModel.create(data);
    res.status(201).send({ status: true, data: savedata });
  } catch (error) {
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
