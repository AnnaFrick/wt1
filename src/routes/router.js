/**
 * @file Defines the main router.
 * @module router
 * @author Anna Frick
 */

// User-land modules.
import express from 'express'

import { router as authRouter } from './auth-router.js'
import { router as homeRouter } from './home-router.js'
import { router as gitlabRouter } from './gitlab-router.js'

export const router = express.Router()

router.use('/gitlab', gitlabRouter)
router.use('/auth', authRouter)
router.use('/', homeRouter)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
