const RecipesService = {
    getAllRecipes(knex) {
        return knex.select('*').from('recipes')
    },
}

module.exports = RecipesService