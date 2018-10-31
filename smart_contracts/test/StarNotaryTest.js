const StarNotary = artifacts.require("StarNotary");

contract("StarNotary", accounts => {
  let user1 = accounts[1];
  let user2 = accounts[2];
  let user3 = accounts[3];

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
        "asdf",
        true
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

  describe("toking minting", () => {
    const tokenId = 1;
    let tx;
    let user1 = accounts[1];

    beforeEach(async function() {
      tx = await this.contract.mint(tokenId, { from: user1 });
    });

    it("sets owner of token to creator", async function() {
      assert.equal(await this.contract.ownerOf(tokenId), user1);
    });

    it("increments balance of creator", async function() {
      assert.equal((await this.contract.balanceOf(user1)).toNumber(), 1);
    });

    it("emits the the transfer event when creating a new token", async function() {
      assert.equal(tx.logs[0].event, "Transfer");
    });
  });

  describe("approve", () => {
    const tokenId = 1;
    let tx;

    beforeEach(async function() {
      await this.contract.mint(tokenId, { from: user1 });
      tx = await this.contract.approve(user2, tokenId, { from: user1 });
    });

    it("can set a user as approved for transfer", async function() {
      assert.equal(await this.contract.getApproved(tokenId), user2);
    });

    it("allows approved user to transfer to themselves", async function() {
      await this.contract.transferFrom(user1, user2, tokenId, { from: user2 });

      assert.equal(await this.contract.ownerOf(tokenId), user2);
    });

    it("emits the Approval event", async function() {
      assert.equal(tx.logs[0].event, "Approval");
    });
  });

  describe("safeTransferFrom", () => {
    const tokenId = 1;

    beforeEach(async function() {
      await this.contract.mint(tokenId, { from: user1 });
      await this.contract.approve(user2, tokenId, { from: user1 });
    });

    it("transfers ownership", async function() {
      await this.contract.safeTransferFrom(user1, user2, tokenId, {
        from: user2
      });

      assert.equal(await this.contract.ownerOf(tokenId), user2);
    });

    it("thows if user not approved", async function() {
      await expectThrow(
        this.contract.safeTransferFrom(user1, user3, tokenId, {
          from: user3
        })
      );
    });
  });

  describe("setApprovalForAll", () => {
    const tokenId = 1;

    beforeEach(async function() {
      await this.contract.mint(tokenId, { from: user1 });
    });

    it("allow approved user to transer to themselves", async function() {
      await this.contract.setApprovalForAll(user2, true, { from: user1 });
      await this.contract.transferFrom(user1, user2, tokenId, {
        from: user2
      });

      assert.equal(await this.contract.ownerOf(tokenId), user2);
    });
  });

  describe("getApproved", () => {
    const tokenId = 1;

    beforeEach(async function() {
      await this.contract.mint(tokenId, { from: user1 });
    });

    it("returns approved user", async function() {
      await this.contract.approve(user2, tokenId, { from: user1 });
      assert.equal(await this.contract.getApproved(tokenId), user2);
    });
  });

  describe("isApprovedForAll", () => {
    const tokenId = 1;

    beforeEach(async function() {
      await this.contract.mint(tokenId, { from: user1 });
    });

    it("returns false if not approved for all", async function() {
      assert.isFalse(await this.contract.isApprovedForAll(user1, user2));
    });

    it("returns true if approved for all", async function() {
      await this.contract.setApprovalForAll(user2, true, { from: user1 });
      assert.isTrue(await this.contract.isApprovedForAll(user1, user2));
    });
  });

  describe("ownerOf", () => {
    it("returns the owner of the token", async function() {
      const tokenId = 1;
      await this.contract.mint(tokenId, { from: user1 });
      assert.equal(await this.contract.ownerOf(tokenId), user1);
    });
  });

  describe("starsForSale", () => {
    it("returns the stars for sale", async function() {
      const tokenId = 1;
      const starCost = 10;
      await this.contract.createStar(
        "awesome star!",
        "1234",
        "2345",
        "3456",
        "asdf",
        tokenId,
        { from: accounts[0] }
      );
      await this.contract.putStarUpForSale(tokenId, starCost);

      assert.equal(
        (await this.contract.starsForSale(tokenId)).toNumber(),
        starCost
      );
    });
  });

  describe("tokenIdToStarInfo", () => {
    it("returns star info", async function() {
      const tokenId = 1;
      await this.contract.createStar(
        "awesome star!",
        "dec_1234",
        "ra_2345",
        "mag_3456",
        "asdf",
        tokenId,
        { from: accounts[0] }
      );

      assert.deepEqual(await this.contract.tokenIdToStarInfo(tokenId), [
        "awesome star!",
        "dec_1234",
        "ra_2345",
        "mag_3456",
        "asdf",
        true
      ]);
    });
  });
});

const expectThrow = async function(promise) {
  try {
    await promise;
  } catch (error) {
    assert.exists(error);
    return;
  }

  assert.fail("Expected an error but didnt see one!");
};
