const redmineService = require("../services/redmine.service");

exports.createTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.createTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
};

exports.deleteTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.deleteTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
};

exports.updateTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.updateTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
}