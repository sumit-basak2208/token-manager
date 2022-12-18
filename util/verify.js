const { run } = require("hardhat");

async function verify(contractAddress, args) {
  try {
    console.log("Verifying... contract at address " + contractAddress);
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("Verified!!!");
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified"))
      console.log("Already Verified!!!");
    else console.log(err);
  }
}

module.exports = verify;
