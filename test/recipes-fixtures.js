function makeRecipesArray() {
    return [
        {
            id: 1,
            name: 'First test recipe',
            folderid: 2,
            timetomake: 'First test time',
            description: 'First test description',
            ingredients: 'First test ingredients',
            steps: 'First test steps',
        },
        {
            id: 2,
            name: 'Second test recipe',
            folderid: 3,
            timetomake: 'Second test time',
            description: 'Second test description',
            ingredients: 'Second test ingredients',
            steps: 'Second test steps',
        },
        {
            id: 3,
            name: 'Third test recipe',
            folderid: 1,
            timetomake: 'Third test time',
            description: 'Third test description',
            ingredients: 'Third test ingredients',
            steps: 'Third test steps',
        }
    ]
}

module.exports = {
    makeRecipesArray
}