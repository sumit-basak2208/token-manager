const { assert, expect } = require("chai");
const { ethers, deployments } = require("hardhat");

const developmentChains = ["localhost", "hardhat"];
const totalTokens = 200000000;

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("SumitToken", () => {
      let accounts, deployer, sumitToken;
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["sumitToken"]);
        sumitToken = await ethers.getContract("SumitToken");
      });

      describe("constructor", () => {
        it("Sets name and symbol", async () => {
          const name = await sumitToken.name();
          const symbol = await sumitToken.symbol();
          assert.equal(name, "Sumit");
          assert.equal(symbol, "SUM");
        });

        it("mints tokens", async () => {
          const totalSupply = await sumitToken.totalSupply();
          const balance = await sumitToken.balanceOf(deployer.address);
          assert.equal(totalSupply.toNumber(), totalTokens);
          assert.equal(balance.toNumber(), totalTokens);
        });

        it("Sets price correctly", async () => {
          const price = await sumitToken.getPrice();
          assert.equal(price.toString(), ethers.utils.parseEther("0.01"));
        });

        it("Sets creator correctly", async () => {
          const creator = await sumitToken.getCreator();
          assert.equal(creator.toString(), deployer.address);
        });
      });

      describe("buy", () => {
        it("Reverts if eth is not enough", async () => {
          await expect(sumitToken.buy(1)).to.be.revertedWith(
            "SumitToken__NotEnoughETH"
          );
        });

        it("Reverts if supply is less", async () => {
          const totalPrice = await sumitToken.getTotalPrice(totalTokens + 1);
          await expect(sumitToken.buy(totalTokens + 1), {
            value: totalPrice.toString(),
          }).to.be.revertedWith("SumitToken__NotEnoughToken");
        });

        it("Transfers token from creator to buyer", async () => {
          const token = 100;
          const totalPrice = await sumitToken.getTotalPrice(token);
          const beforeCreatorBalance = await sumitToken.balanceOf(
            deployer.address
          );
          await sumitToken
            .connect(accounts[1])
            .buy(token, { value: totalPrice });
          const afterCreatorBalance = await sumitToken.balanceOf(
            deployer.address
          );
          const buyerBalance = await sumitToken.balanceOf(accounts[1].address);
          assert.equal(
            beforeCreatorBalance.toString(),
            afterCreatorBalance.add(token).toString()
          );
          assert.equal(buyerBalance.toNumber(), token);
        });

        it("Emits an event", async () => {
          const token = 100;
          const totalPrice = await sumitToken.getTotalPrice(token);
          await expect(
            sumitToken.connect(accounts[1]).buy(token, { value: totalPrice })
          ).to.emit(sumitToken, "Bought");
        });
      });

      describe("withdraw", async () => {
        it("Reverts if caller is not creator", async () => {
          await expect(
            sumitToken.connect(accounts[1]).withdraw()
          ).to.be.revertedWith("SumitToken__NotCreator");
        });

        it("Reverts if contract balance is less than or equal to zero", async () => {
          await expect(sumitToken.withdraw()).to.be.revertedWith(
            "SumitToken__InsuffeicientBalance"
          );
        });

        it("Withdraws and deposits amt to the creator", async () => {
          const token = 100;
          const totalPrice = await sumitToken.getTotalPrice(token);
          await sumitToken
            .connect(accounts[1])
            .buy(token, { value: totalPrice });
          const beforeContractBalance = await ethers.provider.getBalance(
            sumitToken.address
          );
          const beforeDeployerBalance = await ethers.provider.getBalance(
            deployer.address
          );

          const txRes = await sumitToken.withdraw();
          const txRec = await txRes.wait(1);
          const { gasUsed, effectiveGasPrice } = txRec;
          const totalGas = gasUsed.mul(effectiveGasPrice);

          const afterContractBalance = await ethers.provider.getBalance(
            sumitToken.address
          );
          const afterDeployerBalance = await ethers.provider.getBalance(
            deployer.address
          );

          assert.equal(
            beforeDeployerBalance
              .add(beforeContractBalance)
              .sub(totalGas)
              .toString(),
            afterDeployerBalance.toString()
          );

          assert.equal(afterContractBalance.toString(), "0");
        });

        it("Emits an event", async () => {
          const token = 100;
          const totalPrice = await sumitToken.getTotalPrice(token);
          await sumitToken
            .connect(accounts[1])
            .buy(token, { value: totalPrice });
          await expect(sumitToken.withdraw()).to.emit(sumitToken, "Withdraw");
        });
      });
    });
