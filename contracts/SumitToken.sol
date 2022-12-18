//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error SumitToken__NotEnoughETH();
error SumitToken__NotCreator();
error SumitToken__InsuffeicientBalance();
error SumitToken__AddressNull();
error SumitToken__NotEnoughToken();

contract SumitToken is ERC20 {
    event Bought(address indexed buyer, uint indexed amt);
    event Withdraw(uint indexed amt);
    event WithdrawUnsuccessfull(uint indexed amt);

    address private immutable i_creator;
    uint private immutable i_price;

    modifier enoughETH(uint _qty) {
        if (msg.value < getTotalPrice(_qty)) revert SumitToken__NotEnoughETH();
        _;
    }

    modifier onlyCreator() {
        if (msg.sender != i_creator) revert SumitToken__NotCreator();
        _;
    }

    modifier balanceMod() {
        if (address(this).balance <= 0)
            revert SumitToken__InsuffeicientBalance();
        _;
    }

    modifier enoughToken(uint _tokenAmt) {
        uint totalToken = balanceOf(i_creator);
        if (_tokenAmt > totalToken) revert SumitToken__NotEnoughToken();
        _;
    }

    constructor(uint _price, uint _token) ERC20("Sumit", "SUM") {
        _mint(msg.sender, _token);
        i_creator = msg.sender;
        i_price = _price;
    }

    function buy(
        uint _tokenAmt
    ) external payable enoughToken(_tokenAmt) enoughETH(_tokenAmt) {
        _transfer(i_creator, msg.sender, _tokenAmt);
        emit Bought(msg.sender, _tokenAmt);
    }

    function withdraw() public payable onlyCreator balanceMod {
        uint _balance = address(this).balance;
        (bool success, ) = i_creator.call{value: _balance}("");
        if (success) emit Withdraw(_balance);
        else emit WithdrawUnsuccessfull(_balance);
    }

    function mint(uint _tokenAmt) public onlyCreator {
        _mint(i_creator, _tokenAmt);
    }

    function getTotalPrice(uint _qty) public view returns (uint) {
        return _qty * i_price;
    }

    function getCreator() public view returns (address) {
        return i_creator;
    }

    function getPrice() public view returns (uint) {
        return i_price;
    }
}
