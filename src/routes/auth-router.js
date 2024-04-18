import express from "express"

import { AuthController } from "../controllers/auth-controller.js"

export const router = express.Router()

const controller = new AuthController()

router.get("/login", (req, res, next) => controller.loginGet(req, res, next))
router.post("/login", (req, res, next) => controller.loginPost(req, res, next))

router.get("/logout", (req, res, next) => controller.logout(req, res, next))

router.get("/callback", (req, res, next) => controller.handleCallback(req, res, next))

