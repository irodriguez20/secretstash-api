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
});
