function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("Moloch tests", function () {
    beforeEach(function () {
       // console.log("running something before each test");
    });

    importTest("moloch V3", './v3/molochV3.test.js');

    //importTest("moloch V2 multitoken", '../v2_tests/molochV2-multitoken.test.js');
    // importTest("moloch V2", '../v2_tests/molochV2.test.js');
    //importTest("moloch V2 events", '../v2_tests/molochV2Events.test.js');
    after(function () {
        //console.log("after all tests");
    });
});