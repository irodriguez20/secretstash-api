const RecipesService = {
    getAllRecipes(knex) {
        return knex.select('*').from('recipes')
    },
    getById(knex, id) {
        return knex.from('recipes').select('*').where('id', id).first()
    },
    insertRecipe(knex, newRecipe) {
        return knex
            .insert(newRecipe)
            .into('recipes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
}

module.exports = RecipesService