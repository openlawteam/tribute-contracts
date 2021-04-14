// Whole-script strict mode syntax
"use strict";

/**
MIT License
Copyright (c) 2020 Openlaw
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
const {
  TestFairShareCalc,
  toWei,
  expectRevert,
} = require("../../utils/DaoFactory.js");

describe("Helper - FairShareHelper", () => {
  it("should calculate the fair share if the given parameters are valid", async () => {
    const fairShareCalc = await TestFairShareCalc.new();
    const balance = toWei("4.3", "ether");
    const shares = toWei("100", "ether");
    const totalShares = toWei("1000", "ether");
    const fairShare = await fairShareCalc.calculate(
      balance,
      shares,
      totalShares
    );
    // It should return 43% of the shares based on the balance
    expect(fairShare.toString() / 10 ** 18).toEqual(0.43);
  });

  it("should revert when the totalShares parameter is.toEqual to zero", async () => {
    const fairShareCalc = await TestFairShareCalc.new();
    const balance = toWei("4.3", "ether");
    const shares = toWei("100", "ether");
    const totalShares = toWei("0", "ether");
    await expectRevert(
      fairShareCalc.calculate(balance, shares, totalShares),
      "revert totalShares must be greater than 0"
    );
  });

  it("should revert when the shares is greater than the totalShares", async () => {
    const fairShareCalc = await TestFairShareCalc.new();
    const balance = toWei("4.3", "ether");
    const shares = toWei("100", "ether");
    const totalShares = toWei("10", "ether");
    await expectRevert(
      fairShareCalc.calculate(balance, shares, totalShares),
      "revert shares must be less than or equal to totalShares"
    );
  });

  it("should return 100% of the shares if the member holds all the shares of the dao", async () => {
    const fairShareCalc = await TestFairShareCalc.new();
    const balance = toWei("1", "ether");
    const shares = toWei("100", "ether");
    const totalShares = toWei("100", "ether");
    const fairShare = await fairShareCalc.calculate(
      balance,
      shares,
      totalShares
    );
    // It should return 100% of the shares based on the balance
    expect(fairShare.toString() / 10 ** 18).toEqual(1.0);
  });
});
