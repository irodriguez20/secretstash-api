require('dotenv').config
const express = require('express')
const xss = require('xss')
const path = require('path')
const RecipesService = require('./recipes-service')

const recipesRouter = express.Router()
const jsonParser = express.json()

const serializeRecipe = recipe => ({
    id: recipe.id,
    name: xss(recipe.name),
    folderid: recipe.folderid,
    timetomake: recipe.timetomake,
    description: xss(recipe.description),
    ingredients: recipe.ingredients,
    steps: recipe.steps,
})

recipesRouter
    .route('/')
    .get((req, res, next) => {
        RecipesService.getAllRecipes(req.app.get('db'))
            .then(recipes => {
                res.json(recipes)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, folderid, timetomake, description, ingredients, steps } = req.body
        const newRecipe = { name, folderid, timetomake, description, ingredients, steps }

        for (const [key, value] of Object.entries(newRecipe)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        RecipesService.insertRecipe(
            req.app.get('db'),
            newRecipe
        )
            .then(recipe => {
                res.status(201).location(path.posix.join(req.originalUrl, `/${recipe.id}`)).json(serializeRecipe(recipe))
            })
            .catch(next)
    })

recipesRouter
    .route('/:recipe_id')
    .all((req, res, next) => {
        RecipesService.getById(
            req.app.get('db'),
            req.params.recipe_id
        )
            .then(recipe => {
                if (!recipe) {
                    return res.status(404).json({
                        error: { message: `Recipe doesn't exist` }
                    })
                }
                res.recipe = recipe
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeRecipe(res.recipe))
    })
    .delete((req, res, next) => {
        RecipesService.deleteRecipe(
            req.app.get('db'),
            req.params.recipe_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, folderid, timetomake, description, ingredients, steps } = req.body
        const recipeToUpdate = { name, folderid, timetomake, description, ingredients, steps }

        const numberOfValues = Object.values(recipeToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'name', 'timetomake', 'folderid', 'description', 'ingredients', 'steps'`
                }
            })
        }

        RecipesService.updateRecipe(
            req.app.get('db'),
            req.params.recipe_id,
            recipeToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
module.exports = recipesRouter