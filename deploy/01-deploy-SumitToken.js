const { network, ethers } = require("hardhat");
const { verify } = require("../hardhat.config");

const developmentChains = ["localhost", "hardhat"];

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const args = [ethers.utils.parseEther("0.01"), 200000000];

  const sumitToken = await deploy("SumitToken", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: network.config.blockConfirmation | 1,
  });
  log("Contract Deployed!!!");
  log(
    "-------------------------------------------------------------------------------------------------------"
  );
  if (!developmentChains.includes(network.name)) {
    verify(sumitToken.address, args);
  }
};

module.exports.tags = ["all", "sumitToken"];
