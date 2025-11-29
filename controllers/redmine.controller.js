import * as redmineService from "../services/redmine.service.js";

const createTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.createTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
};

const deleteTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.deleteTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
};

const updateTimeEntry = async (req, res, next) => {
    try {
        const result = await redmineService.updateTimeEntry(req.body);
        res.status(result.statusCode).json(result);
    } catch (err) {
        next(err);
    }
}

export {createTimeEntry, deleteTimeEntry, updateTimeEntry};