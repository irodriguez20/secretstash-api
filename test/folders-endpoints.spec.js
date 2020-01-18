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

    describe('GET /api/folders/:folder_id', () => {

        context(`Given no folders`, () => {
            it(`Responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } });
            })
        })

        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()

            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders)
            })

            it(`responds with 200 and the specified folder`, () => {
                const folderId = 3
                const expectedFolder = testFolders[folderId - 1]

                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })
    })

    describe('POST /api/folders', () => {
        it(`creates a folder, responding with 201 and the new folder`, () => {
            const newFolder = {
                foldername: 'Test new folder',
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.foldername).to.eql(newFolder.foldername)
                    expect(res.body).to.have.property('id')
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/folders/${res.body.id}`)
                        .expect(res.body)
                )
        })

        it(`responds with 400 and an error message when the 'foldername' is missing`, () => {
            return supertest(app)
                .post('/api/folders')
                .send({})
                .expect(400, {
                    error: { message: `Missing 'foldername' in request body` }
                })
        })
    })
})
