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
});
