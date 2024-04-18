import express from "express"

import { GitlabController } from "../controllers/gitlab-controller.js"

export const router = express.Router()

const controller = new GitlabController()

// router.get("/", (req, res, next) => controller.index(req, res, next))
router.get("/projects", (req, res, next) => controller.getProjects(req, res, next))
router.get("/activities", (req, res, next) => controller.getActivities(req, res, next))
// router.get("/profile", (req, res, next) => controller.getProfile(req, res, next))
