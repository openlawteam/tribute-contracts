const {advanceTime, createDao, OnboardingContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('Member', async (accounts) => {

  it("should be possible to update delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[2];
    let dao = await createDao({}, myAccount);

    const onboardingAddr = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddr);

    const myAccountActive1 = await dao.isActiveMember(myAccount);
    const delegateKeyActive1 = await dao.isActiveMember(delegateKey);

    assert.equal(myAccountActive1, true);
    assert.equal(delegateKeyActive1, false);

    await onboarding.updateDelegateKey(dao.address, delegateKey, { from: myAccount, gasPrice: toBN("0") });

    const myAccountActive2 = await dao.isActiveMember(myAccount);
    const delegateKeyActive2 = await dao.isActiveMember(delegateKey);

    assert.equal(myAccountActive2, false);
    assert.equal(delegateKeyActive2, true);
  });
});