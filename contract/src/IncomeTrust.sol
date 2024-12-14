// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error IncomeTrust__BeneficiaryAndWithdrawalLimitsLengthMismatch();
error IncomeTrust__BeneficiaryAndPeriodicPercentagesLengthMismatch();
error IncomeTrust__TotalWithdrawalLimitsPercentageShouldBe100();
error IncomeTrust__PeriodicPercentageShouldBeLessThan100();
error IncomeTrust__PeriodicPercentageShouldBeLessThanWithdrawalLimitsPercentage();
error IncomeTrust__WithdrawalAmountShouldBeGreaterThanZero();
error IncomeTrust__WithdrawalAmountShouldBeLessThanAvailableBalance();
error IncomeTrust__TransferFailed();
error IncomeTrust__TheDepositIsAlreadyRevoked();
error IncomeTrust__OnlyTheDepositorCanRevokeTheDeposit();
error IncomeTrust__OnlyTheDepositorCanModifyTheDeposit();
error IncomeTrust__PayoutIntervalShouldBeGreaterThanZero();
error IncomeTrust__TheDepositIsNotStartedYet();
error IncomeTrust__TheDepositIsAlreadyStartedYet();
error IncomeTrust__StartTimestampShouldBeGreaterThanCurrentTimestamp();
error IncomeTrust__DepositAmountShouldBeGreaterThan100Wei();
error IncomeTrust__PeriodicPercentageShouldBeGreaterThanZero();
error IncomeTrust__WithdrawalLimitsPercentageShouldBeGreaterThanZero();
error IncomeTrust__DuplicateBeneficiary();

contract IncomeTrust is ReentrancyGuard, Ownable {
    uint256 private s_id;

    mapping(uint256 => depositData) private s_depositData;
    mapping(address => beneficiaryData[]) private s_beneficiaryData;
    mapping(address => uint256[]) private s_depositHistory;
    mapping(address => mapping(uint256 => uint256)) s_idToIndex;

    struct beneficiaryData {
        uint256 id;
        uint256 index;
    }

    struct depositData {
        uint256 id;
        address depositor;
        uint256 depositAmount;
        address[] beneficiary;
        uint8[] withdrawalLimitsPercentages;
        uint8[] periodicPercentages;
        uint256[] withdrawnAmounts;
        uint256 payoutInterval;
        uint256 depositTimestamps;
        uint256 startTimestamp;
        bool isRevoked;
    }

    constructor() Ownable(msg.sender) {
        s_id = 0;
    }

    function deposit(
        address[] memory beneficiary,
        uint8[] memory withdrawalLimitsPercentages,
        uint8[] memory periodicPercentages,
        uint256 payoutInterval,
        uint256 startTimestamp
    ) public payable {
        if (beneficiary.length != withdrawalLimitsPercentages.length) {
            revert IncomeTrust__BeneficiaryAndWithdrawalLimitsLengthMismatch();
        }
        if (beneficiary.length != periodicPercentages.length) {
            revert IncomeTrust__BeneficiaryAndPeriodicPercentagesLengthMismatch();
        }
        if (payoutInterval == 0) {
            revert IncomeTrust__PayoutIntervalShouldBeGreaterThanZero();
        }
        if (startTimestamp < block.timestamp) {
            revert IncomeTrust__StartTimestampShouldBeGreaterThanCurrentTimestamp();
        }
        if (msg.value < 100) {
            revert IncomeTrust__DepositAmountShouldBeGreaterThan100Wei();
        }

        uint8 totalPercentage = 0;

        for (uint256 i = 0; i < beneficiary.length; i++) {
            for (uint256 j = i + 1; j < beneficiary.length; j++) {
                if (beneficiary[i] == beneficiary[j]) {
                    revert IncomeTrust__DuplicateBeneficiary();
                }
            }

            totalPercentage += withdrawalLimitsPercentages[i];
            if (periodicPercentages[i] > 100) {
                revert IncomeTrust__PeriodicPercentageShouldBeLessThan100();
            }
            if (periodicPercentages[i] > withdrawalLimitsPercentages[i]) {
                revert IncomeTrust__PeriodicPercentageShouldBeLessThanWithdrawalLimitsPercentage();
            }
            if (periodicPercentages[i] == 0) {
                revert IncomeTrust__PeriodicPercentageShouldBeGreaterThanZero();
            }
            if (withdrawalLimitsPercentages[i] == 0) {
                revert IncomeTrust__WithdrawalLimitsPercentageShouldBeGreaterThanZero();
            }
            s_beneficiaryData[beneficiary[i]].push(beneficiaryData({id: s_id, index: i}));
            s_idToIndex[beneficiary[i]][s_id] = i;
        }

        if (totalPercentage != 100) {
            revert IncomeTrust__TotalWithdrawalLimitsPercentageShouldBe100();
        }

        (bool success,) = owner().call{value: (msg.value * 5) / 100}("");
        if (!success) {
            revert IncomeTrust__TransferFailed();
        }

        s_depositData[s_id] = depositData({
            id: s_id,
            depositor: msg.sender,
            depositAmount: (msg.value * 95) / 100,
            beneficiary: beneficiary,
            withdrawalLimitsPercentages: withdrawalLimitsPercentages,
            periodicPercentages: periodicPercentages,
            withdrawnAmounts: new uint256[](beneficiary.length),
            payoutInterval: payoutInterval,
            depositTimestamps: block.timestamp,
            startTimestamp: startTimestamp,
            isRevoked: false
        });
        s_depositHistory[msg.sender].push(s_id);

        s_id++;
    }

    function modifyDeposit(
        uint256 id,
        address[] memory beneficiary,
        uint8[] memory withdrawalLimitsPercentages,
        uint8[] memory periodicPercentages,
        uint256 payoutInterval,
        uint256 startTimestamp
    ) public {
        if (beneficiary.length != withdrawalLimitsPercentages.length) {
            revert IncomeTrust__BeneficiaryAndWithdrawalLimitsLengthMismatch();
        }
        if (beneficiary.length != periodicPercentages.length) {
            revert IncomeTrust__BeneficiaryAndPeriodicPercentagesLengthMismatch();
        }
        if (payoutInterval == 0) {
            revert IncomeTrust__PayoutIntervalShouldBeGreaterThanZero();
        }
        if (s_depositData[id].depositor != msg.sender) {
            revert IncomeTrust__OnlyTheDepositorCanModifyTheDeposit();
        }
        if (s_depositData[id].isRevoked) {
            revert IncomeTrust__TheDepositIsAlreadyRevoked();
        }
        if (block.timestamp > s_depositData[id].startTimestamp) {
            revert IncomeTrust__TheDepositIsAlreadyStartedYet();
        }
        if (startTimestamp < block.timestamp) {
            revert IncomeTrust__StartTimestampShouldBeGreaterThanCurrentTimestamp();
        }

        uint8 totalPercentage = 0;

        for (uint256 i = 0; i < beneficiary.length; i++) {
            for (uint256 j = i + 1; j < beneficiary.length; j++) {
                if (beneficiary[i] == beneficiary[j]) {
                    revert IncomeTrust__DuplicateBeneficiary();
                }
            }

            totalPercentage += withdrawalLimitsPercentages[i];
            if (periodicPercentages[i] > 100) {
                revert IncomeTrust__PeriodicPercentageShouldBeLessThan100();
            }
            if (periodicPercentages[i] > withdrawalLimitsPercentages[i]) {
                revert IncomeTrust__PeriodicPercentageShouldBeLessThanWithdrawalLimitsPercentage();
            }
            if (periodicPercentages[i] == 0) {
                revert IncomeTrust__PeriodicPercentageShouldBeGreaterThanZero();
            }
            if (withdrawalLimitsPercentages[i] == 0) {
                revert IncomeTrust__WithdrawalLimitsPercentageShouldBeGreaterThanZero();
            }
            s_beneficiaryData[beneficiary[i]][s_idToIndex[beneficiary[i]][id]] = beneficiaryData({id: s_id, index: i});
        }

        if (totalPercentage != 100) {
            revert IncomeTrust__TotalWithdrawalLimitsPercentageShouldBe100();
        }

        s_depositData[id] = depositData({
            id: id,
            depositor: msg.sender,
            depositAmount: s_depositData[id].depositAmount,
            beneficiary: beneficiary,
            withdrawalLimitsPercentages: withdrawalLimitsPercentages,
            periodicPercentages: periodicPercentages,
            withdrawnAmounts: new uint256[](beneficiary.length),
            payoutInterval: payoutInterval,
            depositTimestamps: block.timestamp,
            startTimestamp: startTimestamp,
            isRevoked: false
        });
    }

    function withdraw(uint256 _index, uint256 amount) public nonReentrant {
        uint256 id = s_beneficiaryData[msg.sender][_index].id;
        uint256 index = s_beneficiaryData[msg.sender][_index].index;
        if (s_depositData[id].isRevoked) {
            revert IncomeTrust__TheDepositIsAlreadyRevoked();
        }
        if (block.timestamp < s_depositData[id].startTimestamp) {
            revert IncomeTrust__TheDepositIsNotStartedYet();
        }
        if (amount == 0) {
            revert IncomeTrust__WithdrawalAmountShouldBeGreaterThanZero();
        }

        if (amount > getAvailableWithdrawalBalance(msg.sender, _index)) {
            revert IncomeTrust__WithdrawalAmountShouldBeLessThanAvailableBalance();
        } else {
            s_depositData[id].withdrawnAmounts[index] += amount;

            (bool success,) = msg.sender.call{value: amount}("");
            if (!success) {
                revert IncomeTrust__TransferFailed();
            }
        }
    }

    function withdrawAll() public nonReentrant {
        uint256 totalAmount = getAllAvailableWithdrawalBalance(msg.sender);
        if (totalAmount == 0) {
            revert IncomeTrust__WithdrawalAmountShouldBeGreaterThanZero();
        }

        for (uint256 i = 0; i < s_beneficiaryData[msg.sender].length; i++) {
            uint256 id = s_beneficiaryData[msg.sender][i].id;
            uint256 index = s_beneficiaryData[msg.sender][i].index;
            if (s_depositData[id].isRevoked || block.timestamp < s_depositData[id].startTimestamp) {
                continue;
            }

            uint256 _totalAmount = (
                ((block.timestamp - s_depositData[id].depositTimestamps) / s_depositData[id].payoutInterval)
                    * s_depositData[id].depositAmount * s_depositData[id].periodicPercentages[index]
            ) / 100;

            if (
                _totalAmount
                    >= (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index]) / 100
            ) {
                _totalAmount = (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index])
                    / 100 - s_depositData[id].withdrawnAmounts[index];
            } else {
                _totalAmount = _totalAmount - s_depositData[id].withdrawnAmounts[index];
            }
            s_depositData[id].withdrawnAmounts[index] += _totalAmount;
        }

        (bool success,) = msg.sender.call{value: totalAmount}("");
        if (!success) {
            revert IncomeTrust__TransferFailed();
        }
    }

    function revokeDeposit(uint256 id) public nonReentrant {
        if (s_depositData[id].isRevoked) {
            revert IncomeTrust__TheDepositIsAlreadyRevoked();
        }
        if (s_depositData[id].depositor != msg.sender) {
            revert IncomeTrust__OnlyTheDepositorCanRevokeTheDeposit();
        }

        uint256 totalWithdrawnAmount = 0;

        for (uint256 i = 0; i < s_depositData[id].beneficiary.length; i++) {
            totalWithdrawnAmount += s_depositData[id].withdrawnAmounts[i];
        }

        s_depositData[id].isRevoked = true;

        (bool success,) = msg.sender.call{value: s_depositData[id].depositAmount - totalWithdrawnAmount}("");
        if (!success) {
            revert IncomeTrust__TransferFailed();
        }
    }

    function getAvailableWithdrawalBalance(address beneficiary, uint256 _index) public view returns (uint256) {
        uint256 id = s_beneficiaryData[beneficiary][_index].id;
        uint256 index = s_beneficiaryData[beneficiary][_index].index;

        if (block.timestamp < s_depositData[id].startTimestamp) {
            return 0;
        }

        if (s_depositData[id].isRevoked) {
            return 0;
        }

        uint256 totalAmount = (
            ((block.timestamp - s_depositData[id].startTimestamp) / s_depositData[id].payoutInterval)
                * s_depositData[id].depositAmount * s_depositData[id].periodicPercentages[index]
        ) / 100;

        if (
            totalAmount
                >= (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index]) / 100
        ) {
            totalAmount = (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index]) / 100
                - s_depositData[id].withdrawnAmounts[index];
        } else {
            totalAmount = totalAmount - s_depositData[id].withdrawnAmounts[index];
        }

        return totalAmount;
    }

    function getAllAvailableWithdrawalBalance(address beneficiary) public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < s_beneficiaryData[beneficiary].length; i++) {
            uint256 id = s_beneficiaryData[beneficiary][i].id;
            uint256 index = s_beneficiaryData[beneficiary][i].index;
            if (s_depositData[id].isRevoked || block.timestamp < s_depositData[id].startTimestamp) {
                continue;
            }
            uint256 _totalAmount = (
                ((block.timestamp - s_depositData[id].startTimestamp) / s_depositData[id].payoutInterval)
                    * s_depositData[id].depositAmount * s_depositData[id].periodicPercentages[index]
            ) / 100;

            if (
                _totalAmount
                    >= (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index]) / 100
            ) {
                totalAmount += (s_depositData[id].depositAmount * s_depositData[id].withdrawalLimitsPercentages[index])
                    / 100 - s_depositData[id].withdrawnAmounts[index];
            } else {
                totalAmount += _totalAmount - s_depositData[id].withdrawnAmounts[index];
            }
        }
        return totalAmount;
    }

    function getDepositData(uint256 id) public view returns (depositData memory) {
        return s_depositData[id];
    }

    function getDepositDataArray(uint256[] memory id) public view returns (depositData[] memory data) {
        data = new depositData[](id.length);
        for (uint256 i = 0; i < id.length; i++) {
            data[i] = s_depositData[id[i]];
        }
        return data;
    }

    function getDepositHistory(address depositor) public view returns (uint256[] memory) {
        return s_depositHistory[depositor];
    }

    function getBeneficiaryData(address beneficiary) public view returns (beneficiaryData[] memory) {
        return s_beneficiaryData[beneficiary];
    }

    function getAvailableWithdrawalBalanceArray(address beneficiary)
        public
        view
        returns (uint256[] memory balance, depositData[] memory data)
    {
        uint256[] memory array = new uint256[](getBeneficiaryData(beneficiary).length);
        balance = new uint256[](getBeneficiaryData(beneficiary).length);
        for (uint256 i = 0; i < getBeneficiaryData(beneficiary).length; i++) {
            balance[i] = getAvailableWithdrawalBalance(beneficiary, i);
            array[i] = getBeneficiaryData(beneficiary)[i].id;
        }
        data = getDepositDataArray(array);
        return (balance, data);
    }
}
