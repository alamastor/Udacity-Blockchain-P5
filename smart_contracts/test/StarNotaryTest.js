const StarNotary = artifacts.require("StarNotary");

contract("StarNotary", accounts => {
  beforeEach(async function() {
    this.contract = await StarNotary.new({ from: accounts[0] });
  });

  describe("creatStar", () => {
    it("can create a star and get its name", async function() {
      await this.contract.createStar(
        "awesome star!",
        "1234",
        "2345",
        "3456",
        "asdf",
        1,
        { from: accounts[0] }
      );

      assert.deepEqual(await this.contract.tokenIdToStarInfo(1), [
        "awesome star!",
        "1234",
        "2345",
        "3456",
        "asdf"
      ]);
    });
  });

  describe("checkIfStarExist", () => {
    it("returns false if star not exists", async function() {
      assert.isFalse(
        await this.contract.checkIfStarExist("1234", "2345", "3456")
      );
    });

    it("returns true if star exists", async function() {
      await this.contract.createStar(
        "awesome star!",
        "1234",
        "2345",
        "3456",
        "asdf",
        1,
        { from: accounts[0] }
      );

      assert.isTrue(
        await this.contract.checkIfStarExist("1234", "2345", "3456")
      );
    });
  });

  describe("buying and selling stars", () => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let randomMaliciousUser = accounts[3];

    let starId = 1;
    let starPrice = web3.toWei(0.01, "ether");

    beforeEach(async function() {
      await this.contract.createStar(
        "awesome star!",
        "1234",
        "2345",
        "3456",
        "asdf",
        starId,
        { from: user1 }
      );
    });

    it("user1 can put up their star for sale", async function() {
      assert.equal(await this.contract.ownerOf(starId), user1);
      await this.contract.putStarUpForSale(starId, starPrice, { from: user1 });

      assert.equal(await this.contract.starsForSale(starId), starPrice);
    });

    describe("user2 can buy a star that was put up for sale", () => {
      beforeEach(async function() {
        await this.contract.putStarUpForSale(starId, starPrice, {
          from: user1
        });
      });

      it("user2 is the owner of the star after they buy it", async function() {
        await this.contract.buyStar(starId, {
          from: user2,
          value: starPrice,
          gasPrice: 0
        });
        assert.equal(await this.contract.ownerOf(starId), user2);
      });

      it("user2 ether balance changed correctly", async function() {
        let overpaidAmount = web3.toWei(0.05, "ether");
        const balanceBeforeTransaction = web3.eth.getBalance(user2);
        await this.contract.buyStar(starId, {
          from: user2,
          value: overpaidAmount,
          gasPrice: 0
        });
        const balanceAfterTransaction = web3.eth.getBalance(user2);

        assert.equal(
          balanceBeforeTransaction.sub(balanceAfterTransaction),
          starPrice
        );
      });
    });
  });
});
