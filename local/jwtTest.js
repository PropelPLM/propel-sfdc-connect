const PropelJwtConnect = require('../lib/PropelJwtConnect')

const thekey =
`-----BEGIN RSA PRIVATE KEY-----
[the insides of the key, do not save the key in code]
-----END RSA PRIVATE KEY-----`

async function main() {
    const response = await PropelJwtConnect.getJwt({
        clientId: '3MVG9p1Q1BCe9GmDW5YDKl_5Udkb5kyGZrff0TV7qUlPpAAGA3Ii27bZmeHFMjhmO7p0_3eM9AIhw02yCKQw7',
        isTest: false,
        privateKey: thekey,
        user: 'mike.fullmore@propelpim.dev'
    })
console.log(response)
}

main()
