const { Pool } = require('pg')
const moment = require('moment')
const m = moment()
const Cursor = require('pg-cursor')

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'banco',
    password: 'postgres',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000
}
const pool = new Pool(config)

pool.connect(async (error_conexion, client, release) => {
    if (error_conexion) {
        return console.error(error_conexion.code)
    }

    // Capturando argumentos desde el terminal
    const argumentos = process.argv.slice(2)
    let accion = argumentos[0]
    let monto = Number(argumentos[1])

    await client.query("BEGIN")

    try {
        let id1 = argumentos[2]
        let cuenta1 = id1
        let id2 = argumentos[3]
        let cuenta2 = id2

        //PARA DEPOSITOS
        const existeId1 = `SELECT saldo FROM cuentas WHERE id=${id1};`
        const existeId2 = `SELECT saldo FROM cuentas WHERE id=${id2};`


        // PASO 1:
        async function transacciones() {

            if (accion == 'abonar') {
                const deposito = `UPDATE cuentas SET saldo=saldo + ${monto} WHERE id=${id1}  RETURNING *;`
                // console.log(`este es el query deposito: ${deposito}`)
                client.query(deposito, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    // console.log('aqui', error_query, result)
                })

                const transaccionDeposito = `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) values ('deposito', '${m.format('DD-MM-YYYY')}', ${monto}, ${cuenta1}) RETURNING *;`
                // console.log(`este es el query de la transaccion deposito: ${transaccionDeposito}`)
                console.log('--------------------------------------')
                client.query(transaccionDeposito, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    console.log(`Transaccion: ${result.rows[0].descripcion} - ${result.rows[0].fecha} - $${result.rows[0].monto} - cuenta ${result.rows[0].cuenta}`)
                })
            }

            if (accion == 'retirar') {

                const retiro = `UPDATE cuentas SET saldo=saldo-${monto} WHERE id=${id1} RETURNING *;`
                // console.log(`este es el query retiro: ${retiro}`)
                console.log('--------------------------------------')
                client.query(retiro, (error_query, result) => {
                    // console.log('Ultimo retiro', error_query, result)
                })
                const transaccionRetiro = `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) values ('retiro', '${m.format('DD-MM-YYYY')}', ${monto}, ${cuenta1}) RETURNING *;`
                // console.log(`este es el query de la transaccion retiro: ${transaccionRetiro}`)
                console.log('--------------------------------------')
                client.query(transaccionRetiro, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    console.log(`Transaccion: ${result.rows[0].descripcion} - ${result.rows[0].fecha} - $${result.rows[0].monto} - cuenta ${result.rows[0].cuenta}`)
                })

            }
            if (accion == 'transaccion') {
                const retirar = `UPDATE cuentas SET saldo=saldo-${monto} WHERE id=${cuenta1} RETURNING *;`
                // console.log(`este es el retiro: ${retirar}`)
                client.query(retirar, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    // console.log('Ultimo', result.rows[0])
                })
                
                const transaccionCuenta1 = `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) values ('retiro', '${m.format('DD-MM-YYYY')}', ${monto}, ${cuenta1}) RETURNING *;`
                // console.log(`transaccion 1: ${transaccionCuenta1}`)
                
                client.query(transaccionCuenta1, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    console.log('--------------------------------------')
                    console.log(`Transaccion: ${result.rows[0].descripcion} - ${result.rows[0].fecha} - $${result.rows[0].monto} - cuenta ${result.rows[0].cuenta}`)
                })
                const depositar = `UPDATE cuentas SET saldo=saldo+${monto} WHERE id=${cuenta2} RETURNING *;`
                client.query(depositar, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    // console.log('Ultimo registro agregado', result.rows[0])
                })
                
                const transaccionCuenta2 = `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) values ('deposito', '${m.format('DD-MM-YYYY')}', ${monto}, ${cuenta2}) RETURNING *;`
                // console.log(`transaccion 2: ${transaccionCuenta2}`)
                
                client.query(transaccionCuenta2, (error_query, result) => {
                    if (error_query) {
                        console.log(`Este es el error`, err)
                    }
                    console.log('--------------------------------------')
                    console.log(`Transaccion: ${result.rows[0].descripcion} - ${result.rows[0].fecha} - $${result.rows[0].monto} - cuenta ${result.rows[0].cuenta}`)
                })
            }
        }
        transacciones()

        // PASO 2:
        async function consulta() {
            if (accion == 'consulta') {
                let id1 = monto
                const consulta = new Cursor(`SELECT * FROM transacciones WHERE cuenta=${id1}`)
                const cursor = client.query(consulta)
                cursor.read(10, (err, rows) => {
                    console.log('--------------------------------------')
                    if (err) {
                        console.log(`Este es el error`, err)
                    }
                    console.log(`Estas son las transacciones, `, rows)
                    cursor.close()
                })
            }
        }
        consulta()

        //PASO 3:
        async function saldo() {
            if (accion == 'saldo') {
                let id1 = monto
                const saldo = new Cursor(`SELECT * FROM cuentas WHERE id=${id1}`)
                const cursor = client.query(saldo)
                cursor.read(1, (err, rows) => {
                    console.log('--------------------------------------')
                    if (err) {
                        console.log(`Este es el error`, err)
                    }
                    if (rows.length == 0) {
                        console.log(`No existe esa cuenta`)
                    }
                    else {
                        console.log(`Este es el saldo de la cuenta ${id1}: $${rows[0].saldo}`)
                    }
                    cursor.close()
                })
            }
        }
        saldo()

        await client.query("COMMIT")

    } catch (e) {
        await client.query("ROLLBACK")
        console.log('Error codigo: ' + e.code)
        console.log('Detalle del error: ' + e.detail)
        console.log('Tabla originaria del error: ' + e.table)
        console.log('Restriccion violada en el campo: ' + e.constraint)
    }
    console.log('--------------------------------------')
    release()
    pool.end()
})



