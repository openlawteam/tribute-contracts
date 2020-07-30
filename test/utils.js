// Copied from https://github.com/gnosis/safe-contracts/blob/development/test/utils.js

const util = require('util')

async function getParamFromTxEvent (transaction, eventName, paramName, contract, contractFactory, subject) {
  assert.isObject(transaction)
  if (subject != null) {
    // logGasUsage(subject, transaction)
  }
  let logs = transaction.logs
  if (eventName != null) {
    logs = logs.filter((l) => l.event === eventName && l.address === contract)
  }
  assert.equal(logs.length, 1, 'too many logs found!')
  let param = logs[0].args[paramName]
  if (contractFactory != null) {
    let contract = await contractFactory.at(param)
    assert.isObject(contract, `getting ${paramName} failed for ${param}`)
    return contract
  } else {
    return param
  }
}

function logGasUsage (subject, transactionOrReceipt) {
  let receipt = transactionOrReceipt.receipt || transactionOrReceipt
  console.log('    Gas costs for ' + subject + ': ' + receipt.gasUsed)
}

Object.assign(exports, {
  getParamFromTxEvent, // keep
  logGasUsage // keep
})
