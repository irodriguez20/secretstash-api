require('dotenv').config
const FoldersService = require('./folders-service')
const express = require('express')

const foldersRouter = express.Router()
const jsonParser = express.json()

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(req.app.get('db'))
            .then(folders => {
                res.json(folders)
            })
            .catch(next)
    })

module.exports = foldersRouter