// Whole-script strict mode syntax
'use strict';

async function checkLastEvent(dao, testObject) {
    let pastEvents = await dao.getPastEvents();
    let returnValues  = pastEvents[0].returnValues;
    
    Object.keys(testObject).forEach(key => {
        assert.equal(testObject[key], returnValues[key], "value mismatch for key " + key);
    });
}

async function checkBalance(dao, address, token, expectedBalance) {
    const balance = await dao.balanceOf(address, token);

    assert.equal(balance.toString(), expectedBalance.toString());
}


module.exports = {checkLastEvent, checkBalance};