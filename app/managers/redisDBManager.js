const
    config = require('config'),
    redis = require('redis'),
    { promisify } = require('util'),
    client = redis.createClient(config.redis.port),
    hsetAsync = promisify(client.hset).bind(client),
    hgetAsync = promisify(client.hget).bind(client),
    hvalsAsync = promisify(client.hvals).bind(client),
    setAsync = promisify(client.set).bind(client),
    getAsync = promisify(client.get).bind(client),
    hdelAsync = promisify(client.hdel).bind(client),
    incrAsync = promisify(client.incr).bind(client)
;



module.exports = {
    /**
     * Get all records from memory DB
     * @return {Promise}
     */
    getAll: async function getAllFromDb() {
        let userList = await hvalsAsync(config.redis.database);
        return userList.map(val=>JSON.parse(val));
    },
    /**
     * Get record by id from memory DB
     * @param id
     * @return {Promise}
     */
    getById: async function getIdFromDb(id) {
        let gettedUser = await hgetAsync(config.redis.database, parseInt(id)) || {};
        return gettedUser;
    },
    /**
     * Add new record to memory DB
     * @param name
     * @return {Promise}
     */
    setNewId: async function setNewIdToDb(name) {

        let isUsers = await getAsync('usersLength'), length;
        if (isUsers === null) {
            hsetAsync(config.redis.database, 0, JSON.stringify({id: 0, name: name}));
            setAsync('usersLength', 1);
            length = 0;
        } else {
            length = await getAsync('usersLength');
            hsetAsync(config.redis.database, parseInt(length), JSON.stringify({id: parseInt(length), name: name}));
            incrAsync('usersLength');
        }
        return module.exports.getById(length);
    },
    /**
     * Update record into memory DB
     * @param id
     * @param name
     * @return {Promise}
     */
    updateId: async function updateIdToDb(id, name) {
        let updatedItem = {id: parseInt(id), name: name}
        hsetAsync(config.redis.database, parseInt(id), JSON.stringify(updatedItem));
        let isUsers = await getAsync('usersLength');
        if (isUsers < id) {
            setAsync('usersLength', parseInt(id)+1);
        }
        return module.exports.getById(id);
    },

    /**
     * Remove record from memory DB
     * @param id
     * @return {Promise}
     */
    removeId: function removeIdInDb(id) {
        hdelAsync(config.redis.database, parseInt(id));
    }
}