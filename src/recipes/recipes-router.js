require('dotenv').config
const express = require('express')
const xss = require('xss')
const path = require('path')
const RecipesService = require('./recipes-service')

const recipesRouter = express.Router()
const jsonParser = express.json()

// const serializeRecipe = recipe => ({
//     id: recipe.id,
//     name: xss(recipe.name),
//     folderid: recipe.folderid,
//     timetomake: recipe.timetomake,
//     description: recipe.description,
//     ingredients: recipe.ingredients,
//     steps: recipe.steps,
// })

recipesRouter
    .route('/')
    .get((req, res, next) => {
        RecipesService.getAllRecipes(req.app.get('db'))
            .then(recipes => {
                res.json(recipes)
            })
            .catch(next)
    })

module.exports = recipesRouter