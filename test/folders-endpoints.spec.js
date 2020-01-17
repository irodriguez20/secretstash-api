require('dotenv').config()
const app = require('../src/app')
const knex = require('knex')
const { makeFoldersArray } = require('./folders-fixtures')

describe(`Folders Endpoints`, function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE folders, recipes RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE folders, recipes RESTART IDENTITY CASCADE'))

    describe('GET /api/folders', () => {
        context(`Given no folders`, () => {

            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })

        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()

            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders)
            })

            it(`GET /api/folders responds with 200 and all of the folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
    })
})