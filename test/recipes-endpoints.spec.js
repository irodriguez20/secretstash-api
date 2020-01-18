require('dotenv').config();
const { expect } = require("chai");
const app = require("../src/app");
const knex = require("knex");
const { makeRecipesArray } = require("./recipes-fixtures");
const { makeFoldersArray } = require("./folders-fixtures");

describe(`Recipes Endpoints`, function () {
    let db;

    before("make knex instance", () => {
        db = knex({
            client: "pg",
            connection: process.env.TEST_DATABASE_URL
        });
        app.set("db", db);
    });

    after("disconnect from db", () => db.destroy());

    before("clean the table", () =>
        db.raw("TRUNCATE recipes, folders RESTART IDENTITY CASCADE")
    );

    afterEach("cleanup", () =>
        db.raw("TRUNCATE recipes, folders RESTART IDENTITY CASCADE")
    );

    describe(`GET /api/recipes`, () => {
        context(`Given no recipes`, () => {
            it(`Returns 200 and an empty list`, () => {
                return supertest(app)
                    .get("/api/recipes")
                    .expect(200, []);
            });
        });

        context(`Given there are recipes in the database`, () => {
            const testRecipes = makeRecipesArray();
            const testFolders = makeFoldersArray();

            beforeEach("insert folders and recipes", () => {
                return db
                    .into("folders")
                    .insert(testFolders)
                    .then(() => {
                        return db.into("recipes").insert(testRecipes);
                    });
            })

            it(`GET /api/recipes responds with 200 and all of the recipes`, () => {
                return supertest(app)
                    .get("/api/recipes")
                    .expect(200, testRecipes);
            });
        });

        context(`Given no recipes`, () => {
            const testFolders = makeFoldersArray();

            beforeEach(() => {
                return db.into("folders").insert(testFolders)
            });
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get("/api/recipes")
                    .expect(200, []);
            });
        });
    });

    describe(`GET /api/recipes/:recipe_id`, () => {
        context(`Given no recipes`, () => {
            it(`responds 400 no recipes`, () => {
                const recipeId = 123456;
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .expect(400, { error: { message: `Recipe doesn't exist` } });
            });
        });

        context("Given there are recipes in the database", () => {
            const testFolders = makeFoldersArray()
            const testRecipes = makeRecipesArray()

            beforeEach("insert folders and recipes", () => {
                return db
                    .into("folders")
                    .insert(testFolders)
                    .then(() => {
                        return db.into("recipes").insert(testRecipes);
                    });
            });
            it("GET /api/recipes/:recipe_id responds with 200 and the specified recipe", () => {
                const recipeId = 2;
                const expectedRecipe = testRecipes[recipeId - 1];
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .expect(200, expectedRecipe);
            });
        })

        context(`Given an XSS attack article`, () => {
            const testFolders = makeFoldersArray();
            const maliciousRecipe = {
                id: 911,
                name: 'Naughty naughty very naughty <script>alert("xss");</script>',
                folderid: 3,
                timetomake: 'bad time',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                ingredients: 'Bad ingredients',
                steps: 'Bad steps'
            }

            beforeEach('insert malicious recipe', () => {
                return db
                    .into("folders")
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert([maliciousRecipe])
                    })
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/recipes/${maliciousRecipe.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eq('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eq(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        })
    })

    describe(`POST /api/recipes`, () => {
        const testFolders = makeFoldersArray();

        beforeEach("insert folders and recipes", () => {
            return db
                .into("folders")
                .insert(testFolders)
        });

        it(`creates a recipe, responding with 201 and the new recipe`, function () {
            const newRecipe = {
                name: "Test new recipe",
                folderid: 1,
                timetomake: "test new time",
                description: "test new description",
                ingredients: "test new ingredients",
                steps: "test new steps"
            };
            return supertest(app)
                .post('/api/recipes')
                .send(newRecipe)
                .expect(res => {
                    expect(res.body.name).to.eql(newRecipe.name);
                    expect(res.body.folderid).to.eql(newRecipe.folderid);
                    expect(res.body.timetomake).to.eql(newRecipe.timetomake);
                    expect(res.body.description).to.eql(newRecipe.description);
                    expect(res.body.ingredients).to.eql(newRecipe.ingredients);
                    expect(res.body.steps).to.eql(newRecipe.steps);
                    expect(res.body).to.have.property("id");
                    expect(res.headers.location).to.eql(`/api/recipes/${res.body.id}`);
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/recipes/${res.body.id}`)
                        .expect(res.body)
                );
        });

        const requiredFields = ['name', 'folderid', 'timetomake', 'description', 'ingredients', 'steps']

        requiredFields.forEach(field => {
            const newRecipe = {
                name: 'test new recipe',
                folderid: 1,
                timetomake: 'test new time',
                description: 'test new description',
                ingredients: 'test new ingredients',
                steps: 'test new steps',
            }

            it(`responds with 400 and error message when the '${field}' is missing`, () => {
                delete newRecipe[field]

                return supertest(app)
                    .post('/api/recipes')
                    .send(newRecipe)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/recipes/:recipe_id`, () => {
        context(`Given no recipes`, () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
            })

            it(`responds with 400`, () => {
                const recipeId = 123456
                return supertest(app)
                    .delete(`/api/recipes/${recipeId}`)
                    .expect(400, { error: { message: `Recipe doesn't exist` } })
            })
        })
        context('Given there are recipes in the database', () => {
            const testFolders = makeFoldersArray()
            const testRecipes = makeRecipesArray()

            beforeEach('insert recipes', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert(testRecipes)
                    })
            })

            it('responds with 204 and removes the recipe', () => {
                const idToRemove = 2
                const expectedRecipes = testRecipes.filter(recipe => recipe.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/recipes/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/recipes`)
                            .expect(expectedRecipes)
                    )
            })
        })
    })
});
